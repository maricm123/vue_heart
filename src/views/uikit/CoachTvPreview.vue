<script setup>
import { onMounted, onUnmounted, ref, reactive } from 'vue';
import { api_heart } from '@/services/api';
import { formatIsoToLocal } from '@/utils/formatDate';
import { useSessionTimers } from '@/composables/useSessionTimers';
import { useBle } from '@/composables/useBle';
import { getActiveTrainingSessions, finishSession, createSession } from '@/services/trainingSessionsService.js';
import { webSocketStore } from '@/store/webSocketStore';
import { storeToRefs } from 'pinia';
import { getClientsByCoachNotInActiveSession } from '@/services/userService.js';
import { BleClient } from '@capacitor-community/bluetooth-le';
import BelgradeClock from '@/components/BelgradeClock.vue';

import { useBleStore } from '@/store/useBleStore.js';
const bleStore = useBleStore();
const { connectionStatus, batteryLevel, sessionIds, sessionsStarted, setDevice } = storeToRefs(bleStore);

const { safeIsConnected } = useBle();

import { HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT_CHARACTERISTIC, BATTERY_SERVICE, BATTERY_CHARACTERISTIC, parseHeartRate, startHeartRateNotifications } from '@/utils/bluetooth.js';

const { connect, disconnect, isNative } = useBle();
// const { timers, startTimerFor, stopTimerFor, formatDuration } = useSessionTimers()
import { useSessionTimersStore } from '@/store/sessionTimerStore';
const timersStore = useSessionTimersStore();
const { timers } = storeToRefs(timersStore);

// When someone manually disconnects, we set this to true to avoid auto-reconnect (for example on finish session)
const manuallyDisconnecting = reactive({});
const manualDisconnects = reactive({});

// kad ručno diskonektuješ
function markManualDisconnect(clientId, deviceId) {
    if (!manualDisconnects[clientId]) {
        manualDisconnects[clientId] = {};
    }
    manualDisconnects[clientId][deviceId] = true;
}

function isManualDisconnect(clientId, deviceId) {
    return !!manualDisconnects[clientId]?.[deviceId];
}

function consumeManualDisconnect(clientId, deviceId) {
    if (manualDisconnects[clientId]) {
        delete manualDisconnects[clientId][deviceId];
        if (Object.keys(manualDisconnects[clientId]).length === 0) {
            delete manualDisconnects[clientId];
        }
    }
}

const _intervals = {};
const loadingClients = ref(false);
const connectingDevices = ref({});
const display = ref(false);
const clients = ref([]);
const layout = ref('list');
const defaultAvatar = 'https://i.pravatar.cc/150?img=3'; // placeholder image
// const devices = ref({}); // store device per client { clientId: device }
// selected clients (array instead of single)
const selectedClients = ref([]);
const wsStore = webSocketStore();
const { caloriesFromWsCoach, bpmsFromWsCoach } = storeToRefs(wsStore);
const activeSessions = ref([]);

function fmtStart(iso) {
    // želiš li uvek beogradsko vreme:
    return formatIsoToLocal(iso, { timeZone: 'Europe/Belgrade' });
    // ili prema podešavanju uređaja:
    // return formatIsoToLocal(iso)
}

async function open() {
    display.value = true;
    loadingClients.value = true;
    try {
        clients.value = await getClientsByCoachNotInActiveSession();
    } catch (err) {
        console.error('Failed to fetch clients:', err);
    } finally {
        loadingClients.value = false;
    }
}

// Remove client & disconnect if needed
function removeClient(client) {
    const index = selectedClients.value.findIndex((c) => c.id === client.id);
    if (index !== -1) selectedClients.value.splice(index, 1);
}

function onDeviceDisconnected(clientId, deviceId) {
    if (isManualDisconnect(clientId, deviceId)) {
        console.log(`🛑 Manual disconnect detected — no reconnect for client ${clientId}`);
        consumeManualDisconnect(clientId, deviceId);
        return;
    }

    console.warn(`⚠️ Unexpected disconnection for client ${clientId}`, deviceId);
    reconnectDevice(clientId, { deviceId });
}

async function connectDevice(client) {
    const clientId = client.id;
    bleStore.setConnection(client.id, 'connecting');
    connectingDevices.value[client.id] = true;
    try {
        await BleClient.initialize();

        // Tražimo uređaj koji podržava Heart Rate Service
        const device = await BleClient.requestDevice({
            services: ['0000180d-0000-1000-8000-00805f9b34fb'], // Heart Rate Service
            optionalServices: ['0000180f-0000-1000-8000-00805f9b34fb'] // Battery
        });

        const deviceId = device.deviceId;


        bleStore.setDevice(client.id, deviceId);  // ✅ persistent reference

        console.log('Requested device:', device, device.deviceId);
        await BleClient.connect(device.deviceId, (deviceId) => {
            console.warn(`⚠️ Device disconnected:`, deviceId, 'for client', client.id);

            if (isManualDisconnect(client.id, deviceId)) {
                console.log(`ℹ️ Manual disconnect for client ${client.id}, skipping reconnect.`);
                consumeManualDisconnect(client.id, deviceId);
                return;
            }
            // Unexpected disconnect → auto-reconnect
            onDeviceDisconnected(client.id, deviceId);
        });

        bleStore.setConnection(client.id, 'connected');

        await startHeartRateNotifications(clientId, deviceId);

        const battery = await BleClient.read(device.deviceId, BATTERY_SERVICE, BATTERY_CHARACTERISTIC);
        bleStore.setBattery(client.id, battery.getUint8(0));
    } catch (err) {
        console.error('BLE error:', err);
    } finally {
        connectingDevices.value[client.id] = false;
    }
}

async function reconnectDevice(clientId, deviceInfo, retries = 50) {
    const storedDeviceId = bleStore.getDeviceId(clientId);

    if (!storedDeviceId || storedDeviceId !== deviceInfo.deviceId) {
        console.log(`🛑 Reconnect aborted — device no longer registered for client ${clientId}`);
        return;
    }

    if (isManualDisconnect(clientId, deviceInfo.deviceId)) {
        consumeManualDisconnect(clientId, deviceInfo.deviceId);
        return;
    }
    bleStore.setConnection(clientId, 'reconnecting');

    // 1️⃣ Validate input
    if (!deviceInfo?.deviceId) {
        console.warn(`Invalid deviceInfo for client ${clientId}:`, deviceInfo);
        return;
    }

    const deviceId = deviceInfo.deviceId; // string

    // 1.1️⃣ Ako je ovo zapravo manual disconnect → ne reconnectuj
    if (isManualDisconnect(clientId, deviceId)) {
        console.log(`🛑 Skipping reconnect — manual disconnect for client ${clientId}, device ${deviceId}`);
        consumeManualDisconnect(clientId, deviceId);
        return;
    }

    // 2️⃣ Stop if already connected
    try {
        const connected = await safeIsConnected(deviceId);
        if (connected) {
            console.log(`✅ Device ${deviceId} already connected (client ${clientId})`);
            return;
        }
    } catch (err) {
        console.warn(`⚠️ Error checking connection for ${deviceId}:`, err);
    }

    // 3️⃣ Stop if retries are exhausted
    if (retries <= 0) {
        bleStore.setConnection(clientId, 'disconnected');
        console.warn(`❌ Reconnect attempts exhausted for client ${clientId}`);
        return;
    }

    console.log(`🔄 Trying to reconnect client ${clientId}... (${retries} left)`, deviceId);

    try {
        // 4️⃣ Try to reconnect
        await BleClient.connect(deviceId, (disconnectedDeviceId) => {
            console.warn(`⚠️ Device disconnected again for client ${clientId}:`, disconnectedDeviceId);

            if (isManualDisconnect(clientId, disconnectedDeviceId)) {
                console.log(`ℹ️ Manual disconnect during reconnect loop for client ${clientId}, device ${disconnectedDeviceId}`);
                consumeManualDisconnect(clientId, disconnectedDeviceId);
                return;
            }

            reconnectDevice(clientId, { deviceId: disconnectedDeviceId }, retries - 1);
        });

        console.log(`✅ Reconnected device for client ${clientId}:`, deviceId);
        bleStore.setDevice(clientId, deviceId);
        bleStore.setConnection(clientId, 'connected');

        await startHeartRateNotifications(clientId, deviceId);

        console.log(`📡 Notifications restarted for client ${clientId}`);
    } catch (err) {
        console.warn(`⚠️ Reconnect failed for ${clientId}, retrying...`, err.message);
        setTimeout(() => reconnectDevice(clientId, { deviceId }, retries - 1), 2000);
    }
}

async function disconnectDevice(client) {
    const clientId = client.id;

    // ✅ SINGLE source of truth
    const deviceId = bleStore.getDeviceId(clientId);

    console.log('Disconnecting device for client', clientId, 'deviceId:', deviceId);

    if (!deviceId) {
        console.warn('No stored deviceId for client', clientId);
        return;
    }

    markManualDisconnect(clientId, deviceId);

    bleStore.removeDevice(clientId);
    bleStore.setConnection(clientId, 'disconnected');

    try {
        await BleClient.stopNotifications(
            deviceId,
            HEART_RATE_SERVICE,
            HEART_RATE_MEASUREMENT_CHARACTERISTIC
        );

        await BleClient.disconnect(deviceId);

        try {
            const stillConnected = await safeIsConnected(deviceId);
            console.log(`After disconnect isConnected(${deviceId}):`, stillConnected);
        } catch (e) {
            // safeIsConnected may throw — this is OK
        }
    } catch (err) {
        console.warn('Disconnect failed:', err.message);
    } finally {
        // 🧹 CLEANUP
        bleStore.clearManual(clientId);
        bleStore.setConnection(clientId, 'disconnected');
        bleStore.removeDevice?.(clientId); // optional
        delete wsStore.bpmsFromWsCoach[clientId];
        delete sessionsStarted[clientId];
        delete bleStore.connectedDevices[clientId];
    }
}

async function startSession(client) {
    try {
        const response = await createSession(client.id);
        const sessionId = response.data.id;

        bleStore.setSessionStarted(client.id, true);
        bleStore.setSessionId(client.id, sessionId);

        activeSessions.value.push({
            ...response.data,
            client
        });

        removeClient(client);

        timersStore.startTimerFor(client.id, response.data.start);
    } catch (err) {
        console.error('Failed to start session', err);
    }
}

async function onFinishSession(client, calories, seconds) {
    try {
        const sessionId = bleStore.getSessionId(client.id);
        if (!sessionId) return;

        await finishSession(sessionId, calories, seconds);

        timersStore.stopTimerFor(client.id);

        wsStore.clearClientData(client.id);

        // bleStore.setManual(client.id, true);
        // manuallyDisconnecting[client.id] = true;

        bleStore.clearSession(client.id);

        disconnectDevice(client);

        activeSessions.value = activeSessions.value.filter((s) => s.id !== sessionId);
    } catch (err) {
        console.error('Failed to finish session', err);
    }
}

function selectClient(client) {
    // prevent duplicates
    if (!selectedClients.value.find((c) => c.id === client.id)) {
        selectedClients.value.push(client);
    }
    display.value = false;
}

function isSelected(client) {
    return selectedClients.value.some((c) => c.id === client.id);
}

onMounted(async () => {
    wsStore.connectCoach();
    try {
        activeSessions.value = await getActiveTrainingSessions();
    } catch (err) {
        // već je logovano u servisu, ovde možeš prikazati poruku korisniku
    }
    for (const [clientId, deviceId] of Object.entries(bleStore.connectedDevices)) {
        const isConnected = await safeIsConnected(deviceId);
        console.log(`On mount - client ${clientId} device ${deviceId} isConnected:`, isConnected);
            if (isConnected) {
                bleStore.setConnection(clientId, 'connected');
            } else {
                bleStore.clearDevice(clientId);
        }
  }
});

onUnmounted(() => {
    Object.keys(_intervals).forEach((k) => clearInterval(_intervals[k]));
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Add new session for client</div>

        <!-- Clients modal -->
        <Dialog header="Clients" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '50vw' }" :modal="true">
            <div v-if="loadingClients" class="flex justify-center p-8">
                <ProgressSpinner />
            </div>
            <DataView v-else :value="clients" :layout="layout">
                <!-- List layout -->
                <template #list="slotProps">
                    <div class="flex flex-col">
                        <div
                            v-for="client in slotProps.items"
                            :key="client.id"
                            class="flex flex-col sm:flex-row sm:items-center p-4 border-b border-surface-200 gap-4"
                            :class="{
                                'opacity-50 cursor-not-allowed': isSelected(client),
                                'cursor-pointer hover:bg-primary-50': !isSelected(client)
                            }"
                            @click="!isSelected(client) && selectClient(client)"
                        >
                            <div class="w-16 h-16 flex-shrink-0">
                                <img :src="client.user.avatar || defaultAvatar" alt="Avatar" class="w-full h-full rounded-full object-cover" />
                            </div>
                            <div class="flex-1">
                                <div class="text-lg font-medium">{{ client.user.first_name }} {{ client.user.last_name }}</div>
                                <div class="text-sm text-surface-600">{{ client.user.email }}</div>
                                <div class="flex gap-4 mt-2">
                                    <span>Height: {{ client.height }} cm</span>
                                    <span>Weight: {{ client.weight }} kg</span>
                                    <span>Gender: {{ client.gender }}</span>
                                </div>
                            </div>
                            <div v-if="isSelected(client)" class="text-primary font-semibold">✅ Selected</div>
                        </div>
                    </div>
                </template>

                <!-- Grid layout -->
                <template #grid="slotProps">
                    <div class="grid grid-cols-12 gap-4">
                        <div v-for="client in slotProps.items" :key="client.id" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                            <div
                                class="p-4 border border-surface-200 bg-surface-0 rounded flex flex-col gap-4"
                                :class="{
                                    'opacity-50 cursor-not-allowed': isSelected(client),
                                    'cursor-pointer hover:border-primary hover:border-2': !isSelected(client)
                                }"
                                @click="!isSelected(client) && selectClient(client)"
                            >
                                <div class="font-medium text-lg">{{ client.user.first_name }} {{ client.user.last_name }}</div>
                                <div class="text-sm text-surface-600">{{ client.user.email }}</div>
                                <div class="flex gap-4">
                                    <span>Height: {{ client.height }} cm</span>
                                    <span>Weight: {{ client.weight }} kg</span>
                                    <span>Gender: {{ client.gender }}</span>
                                </div>
                                <div v-if="isSelected(client)" class="text-primary font-semibold">✅ Selected</div>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
        </Dialog>

        <!-- Button to open modal -->
        <Button label="Select Clients" style="width: auto" @click="open" class="mt-4" />

        <!-- Show selected clients -->
        <!-- for grid use this -->
        <!-- <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"> -->
        <div class="flex flex-col gap-4 mt-4">
            <Card v-for="client in selectedClients" :key="client.id">
                <template #title>
                    <div class="flex justify-between items-center">
                        <span>{{ client.user.first_name }} {{ client.user.last_name }}</span>
                        <Button label="Remove" severity="danger" size="small" @click="removeClient(client)" />
                    </div>
                </template>

                <template #content>
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-4">
                            <img :src="client.user.avatar || defaultAvatar" alt="Avatar" class="w-20 h-20 rounded-full object-cover" />
                            <div>
                                <p class="m-0">Email: {{ client.user.email }}</p>
                                <p class="m-0">Height: {{ client.height }} cm</p>
                                <p class="m-0">Weight: {{ client.weight }} kg</p>
                                <p class="m-0">Gender: {{ client.gender }}</p>
                            </div>
                        </div>

                        <div>
                            <!-- Connect / Disconnect device -->
                            <div>
    <!-- Connect -->
    <Button
        v-if="connectionStatus[client.id] !== 'connected'"
        :label="connectingDevices[client.id] ? 'Connecting...' : 'Connect Device'"
        :loading="connectingDevices[client.id]"
        :disabled="connectingDevices[client.id]"
        @click="connectDevice(client)"
    />

    <!-- Disconnect -->
    <Button
        v-else
        label="Disconnect Device"
        severity="danger"
        @click="disconnectDevice(client)"
    />
</div>
                        </div>

                        <!-- Show BPM and Start Session only when connected -->
<div v-if="connectionStatus[client.id] === 'connected'">
    <p>BPM: {{ bpmsFromWsCoach[client.id] || '-' }}</p>

    <!-- Show Start Session only if not started -->
    <Button
        v-if="!sessionsStarted[client.id]"
        label="Start Session"
        @click="startSession(client)"
    />
</div>
                    </div>
                </template>
            </Card>
        </div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Active training sessions</div>

        <!-- If no active sessions -->
        <div v-if="activeSessions.length === 0" class="p-4 text-gray-500">No active sessions</div>

        <!-- Each session has its own splitter -->
        <Splitter v-for="session in activeSessions" :key="session.id" style="height: 300px" class="mb-8">
            <!-- Left panel: client info + finish button -->
            <SplitterPanel :size="30" :minSize="10">
                <div class="p-4 flex flex-col justify-between h-full">
                    <div>
                        <p class="font-medium">{{ session.client.user.first_name }} {{ session.client.user.last_name }}</p>
                        <p class="text-sm text-gray-500">Started: {{ fmtStart(session.start) }}</p>
                    </div>
                    <Button label="Finish" severity="danger" size="small" @click="onFinishSession(session.client, caloriesFromWsCoach[session.client.id], timers[session.client.id])" />
                </div>
            </SplitterPanel>
            <!-- Right panel: session details -->
            <SplitterPanel :size="70">
                <div class="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl shadow-md p-6">
                    <h2 class="text-xl font-semibold text-gray-700 mb-4">🏋️ Session – {{ session.client.user.first_name }}</h2>

                    <div class="flex items-center gap-8">
                        <div class="flex flex-col items-center">
                            <span class="text-3xl font-bold text-red-500">
                                {{ bpmsFromWsCoach[session.client.id] ?? '-' }}
                            </span>
                            <span class="text-sm text-gray-500">BPM</span>
                        </div>
                        <div class="flex flex-col items-center">
                            <span class="text-3xl font-bold text-orange-500">
                                {{ caloriesFromWsCoach[session.client.id] ?? 0 }}
                            </span>
                            <span class="text-sm text-gray-500">kcal burned</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-center">
                        <span class="text-3xl font-bold">
                            <p>⏱️ Time: {{ timers[session.client.id] ? timersStore.formatDuration(timers[session.client.id]) : '00:00' }}</p>

                            <!-- {{ formatDuration(timers[session.client.id] ?? 0) }} -->
                        </span>
                    </div>
                    <span
                        :class="{
                            'text-black-500': connectionStatus[session.client.id] === 'connected',
                            'text-yellow-500': connectionStatus[session.client.id] === 'connecting' || connectionStatus[session.client.id] === 'reconnecting',
                            'text-red-500': connectionStatus[session.client.id] === 'disconnected'
                        }"
                    >
                        Device is: {{ connectionStatus[session.client.id] }}
                    </span>
                    <p v-if="batteryLevel[session.client.id] !== undefined">🔋 Device battery: {{ batteryLevel[session.client.id] }}%</p>
                </div>
            </SplitterPanel>
        </Splitter>
    </div>
    <BelgradeClock />
</template>
