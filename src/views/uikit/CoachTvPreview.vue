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
const { connectionStatus, batteryLevel, sessionIds, sessionsStarted } = storeToRefs(bleStore);

const { safeIsConnected } = useBle();

import { HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT_CHARACTERISTIC, BATTERY_SERVICE, BATTERY_CHARACTERISTIC, parseHeartRate } from '@/utils/bluetooth.js';

const { connect, disconnect, isNative } = useBle();
// const { timers, startTimerFor, stopTimerFor, formatDuration } = useSessionTimers()
import { useSessionTimersStore } from '@/store/sessionTimerStore';

const timersStore = useSessionTimersStore();
const { timers } = storeToRefs(timersStore);

// When someone manually disconnects, we set this to true to avoid auto-reconnect (for example on finish session)
const manuallyDisconnecting = reactive({});

const _intervals = {};
const loadingClients = ref(false);
const connectingDevices = ref({});
const display = ref(false);
const clients = ref([]);
const layout = ref('list');
const defaultAvatar = 'https://i.pravatar.cc/150?img=3'; // placeholder image
const devices = ref({}); // store device per client { clientId: device }
// selected clients (array instead of single)
const selectedClients = ref([]);
const wsStore = webSocketStore();
const { caloriesFromWsCoach, bpmsFromWsCoach } = storeToRefs(wsStore);
// const sessionsStarted = reactive({});
// const sessionIds = reactive({}); // čuvamo sessionId za svakog clienta
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
    // disconnectDevice(client)   // disconnect first
    const index = selectedClients.value.findIndex((c) => c.id === client.id);
    if (index !== -1) selectedClients.value.splice(index, 1);
}

function onDeviceDisconnected(clientId, deviceId) {
    console.warn(`⚠️ Unexpected disconnection for client ${clientId}`, deviceId);
    reconnectDevice(clientId, { deviceId });
}

async function connectDevice(client) {
    // connectionStatus[client.id] = 'connecting';
    bleStore.setConnection(client.id, 'connecting');
    connectingDevices.value[client.id] = true;
    try {
        await BleClient.initialize();

        // Tražimo uređaj koji podržava Heart Rate Service
        const device = await BleClient.requestDevice({
            services: ['0000180d-0000-1000-8000-00805f9b34fb'], // Heart Rate Service
            optionalServices: ['0000180f-0000-1000-8000-00805f9b34fb'] // Battery
        });

        console.log('Requested device:', device, device.deviceId);
        // connectionStatus[client.id] = 'connected';
        bleStore.setConnection(client.id, 'connected');
        // Connect and attach disconnect callback
        await BleClient.connect(device.deviceId, (deviceId) => {
            console.warn(`⚠️ Device disconnected:`, deviceId, 'for client', client.id);

            // Ignore manual disconnects
            if (manuallyDisconnecting[client.id]) {
                console.log(`ℹ️ Manual disconnect for client ${client.id}, skipping reconnect.`);
                return;
            }

            // Unexpected disconnect → auto-reconnect
            onDeviceDisconnected(client.id, deviceId);
        });

        console.log(devices.value, 'DEVICESSSS');
        if (devices.value[device.deviceId]) {
            alert('This heart rate sensor is already connected to another client.');
            return;
        }

        devices.value[client.id] = device;

        console.log('Connected to device:', device);

        await BleClient.startNotifications(device.deviceId, HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT_CHARACTERISTIC, (value) => {
            let bpm = parseHeartRate(value);

            wsStore.bpmsFromWsCoach[client.id] = bpm;

            if (bleStore.isSessionStarted(client.id)) {
                try {
                    sendBpmToBackend(client, bpm, device, bleStore.getSessionId(client.id));
                } catch (err) {
                    console.error('Failed to send BPM:', err);
                }
            }
        });

        const battery = await BleClient.read(device.deviceId, BATTERY_SERVICE, BATTERY_CHARACTERISTIC);
        // batteryLevel[client.id] = battery.getUint8(0);
        bleStore.setBattery(client.id, battery.getUint8(0));
    } catch (err) {
        console.error('BLE error:', err);
    } finally {
        connectingDevices.value[client.id] = false;
    }
}

async function reconnectDevice(clientId, deviceId, retries = 50) {
    // connectionStatus[clientId] = 'reconnecting';
    bleStore.setConnection(clientId, 'reconnecting');
    // 1️⃣ Validate input
    if (!deviceId?.deviceId) {
        console.warn(`Invalid deviceId object for client ${clientId}:`, deviceId);
        return;
    }
    if (manuallyDisconnecting[clientId]) {
        console.log(`🛑 Skipping reconnect — manual disconnect for client ${clientId}`);
        return;
    }

    // 2️⃣ Stop if already connected
    try {
        // const connected = await BleClient.isConnected(deviceId.deviceId);
        const connected = await safeIsConnected(deviceId.deviceId);
        if (connected) {
            console.log(`✅ Device ${deviceId.deviceId} already connected (client ${clientId})`);
            return;
        }
    } catch (err) {
        console.warn(`⚠️ Error checking connection for ${deviceId.deviceId}:`, err);
    }

    // 3️⃣ Stop if retries are exhausted
    if (retries <= 0) {
        // connectionStatus[clientId] = 'disconnected';
        bleStore.setConnection(clientId, 'disconnected');
        console.warn(`❌ Reconnect attempts exhausted for client ${clientId}`);
        return;
    }

    console.log(`🔄 Trying to reconnect client ${clientId}... (${retries} left)`, deviceId.deviceId);

    try {
        // 4️⃣ Try to reconnect
        await BleClient.connect(deviceId.deviceId, () => {
            console.warn(`⚠️ Device disconnected again for client ${clientId}`);
            reconnectDevice(clientId, deviceId, retries - 1);
        });

        console.log(`✅ Reconnected device for client ${clientId}:`, deviceId.deviceId);
        // connectionStatus[clientId] = 'connected';
        bleStore.setConnection(clientId, 'connected');
        // 5️⃣ Store reference
        devices.value[clientId] = deviceId;

        // 6️⃣ Restart heart rate notifications
        await BleClient.startNotifications(
            deviceId.deviceId,
            '0000180d-0000-1000-8000-00805f9b34fb', // Heart Rate Service
            '00002a37-0000-1000-8000-00805f9b34fb', // Heart Rate Measurement
            (value) => {
                const data = new Uint8Array(value.buffer);
                const bpm = data[1]; // simple parse
                wsStore.bpmsFromWsCoach[clientId] = bpm;

                if (sessionsStarted[clientId]) {
                    sendBpmToBackend({ id: clientId }, bpm, deviceId, sessionIds[clientId]);
                }
            }
        );

        console.log(`📡 Notifications restarted for client ${clientId}`);
    } catch (err) {
        console.warn(`⚠️ Reconnect failed for ${clientId}, retrying...`, err.message);
        setTimeout(() => reconnectDevice(clientId, deviceId, retries - 1), 2000);
    }
}

async function disconnectDevice(client) {
    console.log('Disconnecting device for client', client.id);
    manuallyDisconnecting[client.id] = true; // 👈 mark manual disconnect

    try {
        if (devices.value[client.id]) {
            await BleClient.stopNotifications(devices.value[client.id].deviceId, HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT_CHARACTERISTIC);
            await BleClient.disconnect(devices.value[client.id].deviceId);
        }
    } catch (err) {
        // connectionStatus[client.id] = 'disconnected';
        bleStore.setConnection(client.id, 'disconnected');
        console.warn('⚠️ disconnect failed:', err.message);
    }

    delete devices.value[client.id];
    delete wsStore.bpmsFromWsCoach[client.id];
    delete sessionsStarted[client.id];
    // connectionStatus[client.id] = 'disconnected';
    bleStore.setConnection(client.id, 'disconnected');

    // Unset manual flag after a short delay (to avoid race)
    setTimeout(() => delete manuallyDisconnecting[client.id], 2000);
}

// Start session
// async function startSession(client) {
//     try {
//         const response = await createSession(client.id);

//         // Save the session id returned from backend
//         // Sačuvaj boolean + ID odvojeno
//         // sessionsStarted[client.id] = true;
//         // sessionIds[client.id] = response.data.id;

//         bleStore.setSessionStarted(client.id, true);
//         bleStore.setSessionId(client.id, response.data.id);

//         console.log('✅ Session started', {
//             clientId: client.id,
//             started: sessionsStarted[client.id],
//             sessionId: sessionIds[client.id]
//         });

//         // Add new active session to list
//         // activeSessions.value.push(response.data)

//         // 👉 Attach the client object locally so it renders immediately
//         const newSession = {
//             ...response.data,
//             client: client
//         };

//         // Add new active session to list
//         activeSessions.value.push(newSession);
//         removeClient(client); // remove client from selected list

//         // ⏱️ pokreni timer (koristi start sa backenda ako ga vrati)
//         // startTimerFor(client.id, response.data.start) // ⏱️
//         timersStore.startTimerFor(client.id, response.data.start);
//     } catch (err) {
//         console.error('Failed to start session', err.response?.data || err);
//     }
// }

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

// Finish session
// async function onFinishSession(client, calories, seconds) {
//     console.log('Calories for client', calories);
//     console.log('Finish clicked for client:', client.id);
//     console.log('sessionIds state:', sessionIds);
//     console.log('SECONDS state:', seconds);
//     try {
//         const sessionId = bleStore.getSessionId(client.id); // uzmi pravi ID
//         if (!sessionId) return;

//         await finishSession(sessionIds[client.id], calories, seconds);

//         // const sec = stopTimerFor(client.id)
//         const sec = timersStore.stopTimerFor(client.id);
//         // console.log(`⏱️ Session duration for ${client.user.first_name}: ${sec}s (${formatDuration(sec)})`)

//         manuallyDisconnecting[client.id] = true;

//         // Kada obrisem jednu sesiju a imam drugu aktivnu, nakon toga se desi da sessionIds je prazno
//         // sessionIds state: Proxy(Object) {10: 145, 11: 146} ovo mi pokazalo kada sam brisao prvu sesiju, znaci oba objekta trening sesije su tu
//         // a prikzuje mi prazan state kad zelim da obrisem drugu sesiju
//         // uopste ne dodje i ne posalje zahtev ka backend za brisanje druge sesije
//         // delete sessionsStarted[client.id];
//         // delete sessionIds[client.id];

//         // ✅ Clear from WebSocket store because of LiveTV
//         wsStore.clearClientData(client.id);

//         bleStore.clearSession(client.id);     // ❗ OVO JE BITNO

//         disconnectDevice(client); // disconnect device when finishing

//         console.log(`✅ Session finished for client ${client.user.first_name}`);

//         activeSessions.value = activeSessions.value.filter((s) => s.id !== sessionId);
//     } catch (err) {
//         console.error('Failed to finish session', err.response?.data || err);
//     }
// }

async function onFinishSession(client, calories, seconds) {
    try {
        const sessionId = bleStore.getSessionId(client.id);
        if (!sessionId) return;

        await finishSession(sessionId, calories, seconds);

        timersStore.stopTimerFor(client.id);

        wsStore.clearClientData(client.id);

        // bleStore.setManual(client.id, true);
        manuallyDisconnecting[client.id] = true;

        bleStore.clearSession(client.id);

        disconnectDevice(client);

        activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId);

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

async function sendBpmToBackend(client, bpm, device, sessionId) {
    try {
        const response = await api_heart.post('/save-heartbeat', {
            // client: client.id,
            bpm: bpm,
            device_id: device.name || device.deviceId || device || 'unknown',
            seconds: timersStore.timers[client.id] || 0,
            training_session_id: sessionId || null, // Ako je sesija aktivna
            timestamp: new Date().toISOString() // opcionalno, ako backend koristi
        });
    } catch (err) {
        console.error('❌ Error sending BPM:', err);
    }
}

onMounted(async () => {
    wsStore.connectCoach();
    try {
        activeSessions.value = await getActiveTrainingSessions();
    } catch (err) {
        // već je logovano u servisu, ovde možeš prikazati poruku korisniku
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
                            <Button
                                v-if="!devices[client.id]"
                                :label="connectingDevices[client.id] ? 'Connecting...' : 'Connect Device'"
                                :loading="connectingDevices[client.id]"
                                :disabled="connectingDevices[client.id]"
                                @click="connectDevice(client)"
                            />
                            <Button v-else label="Disconnect Device" severity="danger" @click="disconnect(client)" />
                        </div>

                        <!-- Show BPM and Start Session only when connected -->
                        <div v-if="devices[client.id]">
                            <p>BPM: {{ bpmsFromWsCoach[client.id] || '-' }}</p>

                            <!-- Show Start or Finish based on session -->
                            <Button v-if="!sessionsStarted[client.id]" label="Start Session" @click="startSession(client)" />
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
