<script setup>
import { onMounted, onUnmounted, ref, reactive } from 'vue';
import { formatIsoToLocal } from '@/utils/formatDate';
import { useBle } from '@/composables/useBle';
import { getActiveTrainingSessions, finishSession, createSession, forceDeleteActiveTrainingSession, resumeActiveTrainingSession, pauseActiveTrainingSession } from '@/services/trainingSessionsService.js';
import { webSocketStore } from '@/store/webSocketStore';
import { storeToRefs } from 'pinia';
import { getClientsByCoachNotInActiveSession } from '@/services/userService.js';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { useConfirm } from 'primevue/useconfirm';
import BelgradeClock from '@/components/BelgradeClock.vue';
import { useToast } from 'primevue/usetoast';
import { useBleStore } from '@/store/useBleStore.js';
import { useSessionControlStore } from '@/store/sessionControlStore';

const sessionControlStore = useSessionControlStore();
const bleStore = useBleStore();
const { connectionStatus, batteryLevel, sessionIds, sessionsStarted, setDevice } = storeToRefs(bleStore);

const { safeIsConnected } = useBle();

import { HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT_CHARACTERISTIC, BATTERY_SERVICE, BATTERY_CHARACTERISTIC, startHeartRateNotifications, stopHeartRateNotificationsSafe } from '@/utils/bluetooth.js';

const { connect, disconnect, isNative } = useBle();
import { useSessionTimersStore } from '@/store/sessionTimerStore';
const timersStore = useSessionTimersStore();
const { timers } = storeToRefs(timersStore);
// actions directly from store (no storeToRefs)
const { pauseTimerFor, resumeTimerFor } = timersStore;

// When someone manually disconnects, we set this to true to avoid auto-reconnect (for example on finish session)
const manuallyDisconnecting = reactive({});
const manualDisconnects = reactive({});
const toast = useToast();

async function toggleSession(session, client) {
    console.log(session, client);
    const sessionId = session.id;
    const clientId = client.id;
    const deviceId = bleStore.getDeviceId(clientId);
    if (!deviceId) return;

    const paused = sessionControlStore.isPaused(clientId);

    if (paused) {
        await resumeActiveTrainingSession(sessionId);
        await startHeartRateNotifications(clientId, deviceId);
        resumeTimerFor(clientId);
        sessionControlStore.toggleSession(clientId);
    } else {
        pauseTimerFor(clientId);
        await pauseActiveTrainingSession(sessionId);
        await stopHeartRateNotificationsSafe(clientId, deviceId);
        sessionControlStore.toggleSession(clientId);
    }
}

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
const defaultAvatar = 'https://i.pravatar.cc/150?img=3';
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

async function openSelectClientModal() {
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

        bleStore.setDevice(client.id, deviceId); // ✅ persistent reference

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

    if (!deviceInfo?.deviceId) {
        console.warn(`Invalid deviceInfo for client ${clientId}:`, deviceInfo);
        return;
    }

    const deviceId = deviceInfo.deviceId; // string

    // Ako je ovo zapravo manual disconnect → ne reconnectuj
    if (isManualDisconnect(clientId, deviceId)) {
        console.log(`🛑 Skipping reconnect — manual disconnect for client ${clientId}, device ${deviceId}`);
        consumeManualDisconnect(clientId, deviceId);
        return;
    }

    // Stop if already connected
    try {
        const connected = await safeIsConnected(deviceId);
        if (connected) {
            console.log(`✅ Device ${deviceId} already connected (client ${clientId})`);
            return;
        }
    } catch (err) {
        console.warn(`⚠️ Error checking connection for ${deviceId}:`, err);
    }

    // Stop if retries are exhausted
    if (retries <= 0) {
        bleStore.setConnection(clientId, 'disconnected');
        console.warn(`❌ Reconnect attempts exhausted for client ${clientId}`);
        return;
    }

    console.log(`🔄 Trying to reconnect client ${clientId}... (${retries} left)`, deviceId);

    try {
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

// async function disconnectDevice(client) {
//     const clientId = client.id;

//     const deviceId = bleStore.getDeviceId(clientId);

//     console.log('Disconnecting device for client', clientId, 'deviceId:', deviceId);

//     if (!deviceId) {
//         console.warn('No stored deviceId for client', clientId);
//         return;
//     }

//     markManualDisconnect(clientId, deviceId);

//     bleStore.removeDevice(clientId);
//     bleStore.setConnection(clientId, 'disconnected');

//     try {
//         await BleClient.stopNotifications(deviceId, HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT_CHARACTERISTIC);

//         await BleClient.disconnect(deviceId);

//         try {
//             const stillConnected = await safeIsConnected(deviceId);
//             console.log(`After disconnect isConnected(${deviceId}):`, stillConnected);
//         } catch (e) {
//             // safeIsConnected may throw — this is OK
//         }
//     } catch (err) {
//         console.warn('Disconnect failed:', err.message);
//     } finally {
//         bleStore.clearManual(clientId);
//         bleStore.setConnection(clientId, 'disconnected');
//         bleStore.removeDevice?.(clientId);
//         delete wsStore.bpmsFromWsCoach[clientId];
//         delete sessionsStarted[clientId];
//         delete bleStore.connectedDevices[clientId];
//     }
// }


async function disconnectDevice(client) {
  const clientId = client.id;
  const deviceId = bleStore.getDeviceId(clientId);
  if (!deviceId) return;

  markManualDisconnect(clientId, deviceId);

  try {
    // ✅ THIS is what you're missing
    await stopHeartRateNotificationsSafe(clientId, deviceId);

    await BleClient.disconnect(deviceId);

    const stillConnected = await safeIsConnected(deviceId);
    console.log(`After disconnect isConnected(${deviceId}):`, stillConnected);
  } catch (err) {
    console.warn('Disconnect failed:', err?.message || err);
  } finally {
    bleStore.clearManual(clientId);
    bleStore.setConnection(clientId, 'disconnected');
    bleStore.removeDevice?.(clientId);
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

        await stopHeartRateNotificationsSafe(client.id, bleStore.getDeviceId(client.id));
    } catch (err) {
        console.error('Failed to finish session', err);
    }
}

const confirm = useConfirm();
const confirmDelete = (client) => {
    confirm.require({
        message: 'This will permanently delete the session. Continue?',
        header: 'Confirm delete',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => forceDeleteSession(client)
    });
};
const forceDeleteSession = async (client) => {
    try {
        const sessionId = bleStore.getSessionId(client.id);
        await forceDeleteActiveTrainingSession(sessionId);

        toast.add({
            severity: 'success',
            summary: 'Session deleted',
            detail: 'Session has been permanently removed',
            life: 3000
        });

        timersStore.stopTimerFor(client.id);

        wsStore.clearClientData(client.id);

        // bleStore.setManual(client.id, true);
        // manuallyDisconnecting[client.id] = true;

        bleStore.clearSession(client.id);

        sessionControlStore.clear(client.id);

        disconnectDevice(client);

        activeSessions.value = activeSessions.value.filter((s) => s.id !== sessionId);
    } catch (error) {
        console.error(error);

        toast.add({
            severity: 'error',
            summary: 'Delete failed',
            detail: 'Unable to delete session',
            life: 3000
        });
    }
};

function selectClient(client) {
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
        <div class="font-semibold text-xl mb-4">Add new training session for client</div>

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
                                'cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800': !isSelected(client)
                            }"
                            @click="!isSelected(client) && selectClient(client)"
                        >
                            <!-- <div class="w-16 h-16 flex-shrink-0">
                                <img :src="client.user.avatar || defaultAvatar" alt="Avatar" class="w-full h-full rounded-full object-cover" />
                            </div> -->
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

                <template #grid="slotProps">
                    <div class="grid grid-cols-12 gap-4">
                        <div v-for="client in slotProps.items" :key="client.id" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                            <div
                                class="p-4 border border-surface-200 bg-surface-0 rounded flex flex-col gap-4"
                                :class="{
                                    'opacity-50 cursor-not-allowed': isSelected(client),
                                    'cursor-pointer hover:border-surface-200 hover:border-2': !isSelected(client)
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
        <Button label="Select Clients" style="width: auto" @click="openSelectClientModal" class="mt-4" />

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
                            <div>
                                <Button
                                    v-if="connectionStatus[client.id] !== 'connected'"
                                    :label="connectingDevices[client.id] ? 'Connecting...' : 'Connect Device'"
                                    :loading="connectingDevices[client.id]"
                                    :disabled="connectingDevices[client.id]"
                                    @click="connectDevice(client)"
                                />

                                <Button v-else label="Disconnect Device" severity="danger" @click="disconnectDevice(client)" />
                            </div>
                        </div>

                        <!-- Show BPM and Start Session only when connected -->
                        <div v-if="connectionStatus[client.id] === 'connected'">
                            <p>BPM: {{ bpmsFromWsCoach[client.id] || '-' }}</p>

                            <!-- Show Start Session only if not started -->
                            <Button v-if="!sessionsStarted[client.id]" label="Start Session" @click="startSession(client)" />
                        </div>
                        <!-- <Button label="Start Session" @click="startSession(client)" /> -->
                    </div>
                </template>
            </Card>
        </div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Active training sessions</div>

        <!-- If no active sessions -->
        <div v-if="activeSessions.length === 0" class="p-4 text-gray-500">No active sessions</div>

        <div v-for="session in activeSessions" :key="session.id" class="mb-8 border rounded-xl overflow-hidden bg-white text-slate-900 shadow-sm dark:bg-surface-900 dark:text-surface-0 dark:border-surface-700">
            <Splitter style="height: 300px">
                <SplitterPanel :size="30" :minSize="10">
                    <div class="p-4 flex flex-col justify-between h-full">
                        <div>
                            <p class="font-medium">{{ session.client.user.first_name }} {{ session.client.user.last_name }}</p>
                            <p class="text-sm text-slate-500 dark:text-surface-300">Started: {{ fmtStart(session.start) }}</p>
                        </div>

                        <Button label="Finish" severity="danger" size="small" @click="onFinishSession(session.client, caloriesFromWsCoach[session.client.id], timers[session.client.id])" />
                    </div>
                </SplitterPanel>

                <SplitterPanel :size="70">
                    <div class="h-full flex flex-col items-center justify-center rounded-xl shadow-md p-6 bg-surface-50 text-surface-900 dark:bg-surface-800 dark:text-surface-0">
                        <div class="flex items-center gap-8">
                            <div class="flex flex-col items-center">
                                <span class="text-3xl font-bold text-red-500">
                                    {{ bpmsFromWsCoach[session.client.id] ?? '-' }}
                                </span>
                                <span class="text-sm text-slate-500 dark:text-surface-300">BPM</span>
                            </div>

                            <div class="flex flex-col items-center">
                                <span class="text-3xl font-bold text-orange-500">
                                    {{ caloriesFromWsCoach[session.client.id] ?? 0 }}
                                </span>
                                <span class="text-sm text-slate-500 dark:text-surface-300">kcal burned</span>
                            </div>
                        </div>

                        <div class="flex flex-col items-center">
                            <span class="text-3xl font-bold">
                                <p>
                                    Time:
                                    {{ timers[session.client.id] ? timersStore.formatDuration(timers[session.client.id]) : '00:00' }}
                                </p>
                            </span>
                        </div>

                        <span
                            :class="{
                                'text-emerald-400': connectionStatus[session.client.id] === 'connected',
                                'text-yellow-400': connectionStatus[session.client.id] === 'connecting' || connectionStatus[session.client.id] === 'reconnecting',
                                'text-red-400': connectionStatus[session.client.id] === 'disconnected'
                            }"
                        >
                            Device status: {{ connectionStatus[session.client.id] }}
                        </span>

                        <p v-if="batteryLevel[session.client.id] !== undefined" class="text-slate-500 dark:text-surface-300">Device battery: {{ batteryLevel[session.client.id] }}%</p>
                    </div>
                </SplitterPanel>
            </Splitter>

            <!-- FOOTERS -->
            <div class="flex items-center justify-between px-4 py-3 border-t bg-slate-50 dark:bg-surface-800 dark:border-surface-700">
                <div class="flex flex-col">
                    <span class="text-m text-slate-500 dark:text-surface-300">Stop/Resume session</span>
                </div>

                <Button
                    :label="sessionControlStore.isPaused(session.client.id) ? 'Resume session' : 'Stop session'"
                    :severity="sessionControlStore.isPaused(session.client.id) ? 'success' : 'danger'"
                    outlined
                    size="small"
                    @click="toggleSession(session, session.client)"
                />
            </div>

            <div class="flex items-center justify-between px-4 py-3 border-t bg-slate-50 dark:bg-surface-800 dark:border-surface-700">
                <div class="flex flex-col">
                    <span class="text-m text-slate-500 dark:text-surface-300">Delete session permanently</span>
                </div>

                <Button label="Delete session" severity="danger" outlined size="small" @click="confirmDelete(session.client)" />
            </div>
        </div>
    </div>
    <BelgradeClock />
    <ConfirmDialog />
</template>
