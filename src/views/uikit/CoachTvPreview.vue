<script setup>
import { onMounted, onUnmounted, ref, reactive } from 'vue'
import { api_coach, api_heart } from '@/services/api';
import { formatIsoToLocal } from '@/utils/formatDate'
import { useSessionTimers } from '@/composables/useSessionTimers'
import { useBle } from '@/composables/useBle'
import { fetchActiveSessions } from '@/services/trainingSessionsService.js'
import { webSocketStore } from '@/store/webSocketStore'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/store/useSessionStore'

const { connect, disconnect, isNative } = useBle()
// const { timers, startTimerFor, stopTimerFor, formatDuration } = useSessionTimers()
import { useSessionTimersStore } from '@/store/sessionTimerStore'

const timersStore = useSessionTimersStore()
const { timers } = storeToRefs(timersStore)

const sessionStore = useSessionStore()

const _intervals = {}
const loadingClients = ref(false)
const connectingDevices = ref({})  
const display = ref(false)
const clients = ref([])
const layout = ref('list')
const options = ['list', 'grid']
const defaultAvatar = 'https://i.pravatar.cc/150?img=3' // placeholder image
const devices = ref({}) // store device per client { clientId: device }
// selected clients (array instead of single)
const selectedClients = ref([])


const wsStore = webSocketStore()

const { caloriesFromWsCoach, bpmsFromWsCoach } = storeToRefs(wsStore)


// za više klijenata – koristimo objekte umesto samo jedne vrednosti
// const calories = reactive({})
// const bpms = reactive({})

const sessionsStarted = reactive({})
const sessionIds = reactive({})      // čuvamo sessionId za svakog clienta

const activeSessions = ref([])

function fmtStart(iso) {
  // želiš li uvek beogradsko vreme:
  return formatIsoToLocal(iso, { timeZone: 'Europe/Belgrade' })
  // ili prema podešavanju uređaja:
  // return formatIsoToLocal(iso)
}

async function open() {
  display.value = true
  loadingClients.value = true
  try {
    const response = await api_coach.get(
      '/get-all-clients-based-on-coach',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access')}`,
        },
      }
    )
    clients.value = response.data
  } catch (err) {
    console.error('Error loading clients', err)
  } finally {
    loadingClients.value = false
  }
}
// Remove client & disconnect if needed
function removeClient(client) {
  // disconnectDevice(client)   // disconnect first
  const index = selectedClients.value.findIndex(c => c.id === client.id)
  if (index !== -1) selectedClients.value.splice(index, 1)
}

import { BleClient, BluetoothLe  } from '@capacitor-community/bluetooth-le';

function onDeviceDisconnected(deviceId) {
  // const clientId = deviceClientMap[deviceId];
  console.warn(`⚠️ Device for client ${client} disconnected:`, deviceId);

  // Cleanup
  // delete devices[clientId];
  // delete deviceClientMap[deviceId];

  // Optional: auto-reconnect
  reconnectDevice(clientId, deviceId);
}


async function connectDevice(client) {
  connectingDevices.value[client.id] = true
  try {
    await BleClient.initialize();

    // Tražimo uređaj koji podržava Heart Rate Service
    const device = await BleClient.requestDevice({
      services: ['0000180d-0000-1000-8000-00805f9b34fb'], // Heart Rate Service
    });

    console.log("Requested device:", device, device.deviceId)

    // await BleClient.connect(device.deviceId);
    // Connect and attach disconnect callback
    await BleClient.connect(device.deviceId, (deviceId) => {
      // const clientId = deviceClientMap[deviceId];
      console.log(`⚠️ Device for client ${client} disconnected:`, deviceId);
      
      // Optional: auto-reconnect
      reconnectDevice(client.id, device);
      // Cleanup
      // delete devices[clientId];
      // delete deviceClientMap[deviceId];

      // Optional: notify UI or attempt auto-reconnect
    });


    devices.value[client.id] = device

    console.log("Connected to device:", device)

    await BleClient.startNotifications(
  device.deviceId,
  '0000180d-0000-1000-8000-00805f9b34fb', // Heart Rate Service
  '00002a37-0000-1000-8000-00805f9b34fb', // Heart Rate Measurement Characteristic
  (value) => {
    // const data = new Uint8Array(value);
    // console.log("Raw HRM data:", data);

    // // 🔍 pravilno parsiranje HRM paketa
    // const flags = data[0];
    // let bpm;
    // // if (flags & 0x01) {
    // //   bpm = data[1] | (data[2] << 8); // 16-bit little endian
    // // } else {
    // //   bpm = data[1]; // 8-bit
    // // }
    // if ((flags & 0x01) && data.length >= 3) {
    //   bpm = data[1] | (data[2] << 8); // 16-bit
    // } else {
    //   bpm = data[1]; // 8-bit
    // }
    const data = new Uint8Array(value.buffer);

    // Probaj jednostavno ovako:
    let bpm = data[1]; // 8-bit BPM

    // bpms[client.id] = bpm;
    wsStore.bpmsFromWsCoach[client.id] = bpm

    // Ako je sesija aktivna – šaljemo na backend
    if (sessionsStarted[client.id]) {
      wsStore.client[client.id] = client.id
      sendBpmToBackend(client, bpm, device, sessionIds[client.id]);
    }
  }
);

  } catch (err) {
    console.error('BLE error:', err);
  } finally {
    connectingDevices.value[client.id] = false
  }
}

async function reconnectDevice(clientId, deviceId, retries = 50) {
  if (retries <= 0) return;


  console.log(deviceId, clientId);
  console.log(`Trying to reconnect ${clientId}... (${retries} left) ${deviceId.deviceId}`);
  try {

    // const device = await BleClient.connect(deviceId, onDeviceDisconnected);
    const device = await BleClient.connect(deviceId.deviceId, onDeviceDisconnected);
    console.log(`Reconnecting to device for client ${clientId}:`, device);

    // devices[clientId] = device;
    devices.value[clientId] = device

    console.log(devices.value, "DEVICESSSS");
    // Restart notifications after reconnect
    await BleClient.startNotifications(

      device.deviceId,
        '0000180d-0000-1000-8000-00805f9b34fb', // Heart Rate Service
        '00002a37-0000-1000-8000-00805f9b34fb', // Heart Rate Measurement Characteristic
        (value) => {
        const bpm = parseHeartRate(value);
        wsStore.bpmsFromWsCoach[clientId] = bpm;
        
        if (sessionsStarted[clientId]) {
          sendBpmToBackend({ id: clientId }, bpm, device, sessionIds[clientId]);
        }
      }
    );

    console.log(`Reconnected and restarted notifications for client ${clientId}`);    
    console.log(`Reconnected ${clientId}`);
  } catch (err) {
    setTimeout(() => reconnectDevice(clientId, deviceId, retries - 1), 2000);
  }
}

// Disconnect device
async function disconnectDevice(client) {
  console.log("Disconnecting device for client", client.id)

  try {
    // Zaustavi notifikacije
    if (devices.value[client.id]) {
      await BleClient.stopNotifications(
        devices.value[client.id].deviceId,
        '0000180d-0000-1000-8000-00805f9b34fb', // Heart Rate Service
        '00002a37-0000-1000-8000-00805f9b34fb'  // Heart Rate Measurement
      );
    }
  } catch (err) {
    console.warn("⚠️ stopNotifications failed:", err.message);
  }

  try {
    if (devices.value[client.id]) {
      await BleClient.disconnect(devices.value[client.id].deviceId);
    }
  } catch (err) {
    console.warn("⚠️ disconnect failed:", err.message);
  }

  // Obriši iz lokalnog state-a
  delete devices.value[client.id];
  delete bpms[client.id];
  delete sessionsStarted[client.id];
}


// Start session
async function createSession(client) {
  try {
    const response = await api_heart.post(
      `/create-session`,
      { client_id: client.id,
        start: new Date().toISOString(),
        title: "New session",
       }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    )

    // Save the session id returned from backend
    // Sačuvaj boolean + ID odvojeno
    sessionsStarted[client.id] = true
    sessionIds[client.id] = response.data.id

    console.log("✅ Session started", {
      clientId: client.id,
      started: sessionsStarted[client.id],
      sessionId: sessionIds[client.id],
    })

    // Add new active session to list
    // activeSessions.value.push(response.data)

    // 👉 Attach the client object locally so it renders immediately
    const newSession = {
      ...response.data,
      client: client
    }

    sessionStore.addSession(newSession)


    // Add new active session to list
    activeSessions.value.push(newSession)
    removeClient(client) // remove client from selected list

    // ⏱️ pokreni timer (koristi start sa backenda ako ga vrati)
    // startTimerFor(client.id, response.data.start) // ⏱️
    timersStore.startTimerFor(client.id, response.data.start)
  } catch (err) {
    console.error('Failed to start session', err.response?.data || err)
  }
}


// Finish session
async function finishSession(client) {
  console.log("Finish clicked for client:", client.id)
  console.log("sessionIds state:", sessionIds)
  try {
    const sessionId = sessionIds[client.id]  // uzmi pravi ID
    if (!sessionId) return

    console.log("Finishing session", sessionId, "for client", client.id)

    await api_heart.patch(
      `/finish-session/${sessionId}`,
        { calories_at_end: Math.round(caloriesFromWsCoach[client.id] ?? 0) }, 
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    )

    // const sec = stopTimerFor(client.id)
    const sec = timersStore.stopTimerFor(client.id)
    // console.log(`⏱️ Session duration for ${client.user.first_name}: ${sec}s (${formatDuration(sec)})`)

    delete sessionsStarted[client.id]
    delete sessionIds[client.id]

    disconnectDevice(client) // disconnect device when finishing

    console.log(`✅ Session finished for client ${client.user.first_name}`)

    activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId)
  } catch (err) {
    console.error('Failed to finish session', err.response?.data || err)
  }
}

function selectClient(client) {
  // prevent duplicates
  if (!selectedClients.value.find(c => c.id === client.id)) {
    selectedClients.value.push(client)
  }
  display.value = false
}

function isSelected(client) {
  return selectedClients.value.some(c => c.id === client.id)
}

// 📌 Funkcija za slanje BPM-a na backend REST endpoint
async function sendBpmToBackend(client, bpm, device, sessionId) {
  // console.log("Sending BPM to backend:", {
  //   clientId: client.id,
  //   bpm: bpm,
  //   device: device,
  //   sessionId: sessionId
  // });
  try {
    const response = await api_heart.post("/save-heartbeat", {
      client: client.id,
      bpm: bpm,
      device_id: device.name,
      training_session: sessionId || null, // Ako je sesija aktivna
      timestamp: new Date().toISOString()  // opcionalno, ako backend koristi
    });

    // console.log("✅ BPM sent:", response.data);
  } catch (err) {
    console.error("❌ Error sending BPM:", err);
  }
}


onMounted(async () => {
  // // ws.value = new WebSocket("ws://localhost:8000/ws/bpm/")
  // // ws.value = new WebSocket(import.meta.env.VITE_WS_API_URL)
  // const token = localStorage.getItem('access')
  // // ws.value = new WebSocket(`wss://heartapp.dev/ws/bpm/?token=${token}`);
  // // ws.value = new WebSocket("wss://heartapp.dev/ws/bpm/");
  // // ws.value = new WebSocket(`ws://localhost:8000/ws/bpm/?token=${token}`);
  // ws.value = new WebSocket(`ws://13.48.248.110:8000/ws/bpm/?token=${token}`);
  // // console.log("Connecting to WS:", import.meta.env.VITE_WS_API_URL)
  // console.log("Connecting to WS:", ws.value.url)
  // ws.value.onopen = () => console.log("✅ WebSocket connected")

  // ws.value.onmessage = (event) => {
  //   const data = JSON.parse(event.data)
  //   console.log("WS data:", data)

  //   // Mapiraj kalorije po client.id
  //   if (data.client_id) {
  //     calories[data.client_id] = data.current_calories
  //   }

  //   // Ako backend šalje i bpm, ažuriraj i to
  //   if (data.bpm) {
  //     bpms[data.client_id] = data.bpm
  //   }
  // }

  // ws.value.onclose = () => console.log("❌ WebSocket closed")

  try {
    activeSessions.value = await fetchActiveSessions()
    console.log('✅ Active sessions loaded', activeSessions.value)
  } catch (err) {
    // već je logovano u servisu, ovde možeš prikazati poruku korisniku
  }
})

onUnmounted(() => {
  Object.keys(_intervals).forEach(k => clearInterval(_intervals[k]))
})

</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">Add new session for client</div>

    <!-- Clients modal -->
    <Dialog
      header="Clients"
      v-model:visible="display"
      :breakpoints="{ '960px': '75vw' }"
      :style="{ width: '50vw' }"
      :modal="true"
    >

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
                'cursor-pointer hover:bg-primary-50': !isSelected(client),
              }"
              @click="!isSelected(client) && selectClient(client)"
            >
              <div class="w-16 h-16 flex-shrink-0">
                <img
                  :src="client.user.avatar || defaultAvatar"
                  alt="Avatar"
                  class="w-full h-full rounded-full object-cover"
                />
              </div>
              <div class="flex-1">
                <div class="text-lg font-medium">
                  {{ client.user.first_name }} {{ client.user.last_name }}
                </div>
                <div class="text-sm text-surface-600">{{ client.user.email }}</div>
                <div class="flex gap-4 mt-2">
                  <span>Height: {{ client.height }} cm</span>
                  <span>Weight: {{ client.weight }} kg</span>
                  <span>Gender: {{ client.gender }}</span>
                </div>
              </div>
              <div v-if="isSelected(client)" class="text-primary font-semibold">
                ✅ Selected
              </div>
            </div>
          </div>
        </template>
        
        <!-- Grid layout -->
        <template #grid="slotProps">
          <div class="grid grid-cols-12 gap-4">
            <div
              v-for="client in slotProps.items"
              :key="client.id"
              class="col-span-12 sm:col-span-6 lg:col-span-4 p-2"
            >
              <div
                class="p-4 border border-surface-200 bg-surface-0 rounded flex flex-col gap-4"
                :class="{
                  'opacity-50 cursor-not-allowed': isSelected(client),
                  'cursor-pointer hover:border-primary hover:border-2': !isSelected(client),
                }"
                @click="!isSelected(client) && selectClient(client)"
              >
                <div class="font-medium text-lg">
                  {{ client.user.first_name }} {{ client.user.last_name }}
                </div>
                <div class="text-sm text-surface-600">{{ client.user.email }}</div>
                <div class="flex gap-4">
                  <span>Height: {{ client.height }} cm</span>
                  <span>Weight: {{ client.weight }} kg</span>
                  <span>Gender: {{ client.gender }}</span>
                </div>
                <div v-if="isSelected(client)" class="text-primary font-semibold">
                  ✅ Selected
                </div>
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
        <Button 
        v-else 
        label="Disconnect Device" 
        severity="danger" 
        @click="disconnect(client)" 
        />
        </div>

        <!-- Show BPM and Start Session only when connected -->
        <div v-if="devices[client.id]">
          <p>BPM: {{ bpmsFromWsCoach[client.id] || '-' }}</p>

          <!-- Show Start or Finish based on session -->
          <Button 
            v-if="!sessionsStarted[client.id]"
            label="Start Session" 
            @click="createSession(client)" 
          />
          <!-- <Button 
            v-else
            label="Finish Session" 
            severity="danger"
            @click="finishSession(client)" 
          /> -->
        </div>
      </div>
    </template>
  </Card>
</div>
</div>
<div class="card">
  <div class="font-semibold text-xl mb-4">Active training sessions</div>

  <!-- If no active sessions -->
  <div v-if="activeSessions.length === 0" class="p-4 text-gray-500">
    No active sessions
  </div>

  <!-- Each session has its own splitter -->
  <Splitter
    v-for="session in activeSessions"
    :key="session.id"
    style="height: 300px"
    class="mb-8"
  >
    <!-- Left panel: client info + finish button -->
    <SplitterPanel :size="30" :minSize="10">
      <div class="p-4 flex flex-col justify-between h-full">
        <div>
          <p class="font-medium">
            {{ session.client.user.first_name }} {{ session.client.user.last_name }}
          </p>
          <p class="text-sm text-gray-500">Started: {{ fmtStart(session.start) }}</p>
        </div>
        <Button 
          label="Finish" 
          severity="danger" 
          size="small"
          @click="finishSession(session.client)" 
        />
        <!-- <Button 
  label="Finish" 
  @click="() => console.log('Kliknuto', session.client)"
/> -->
      </div>
    </SplitterPanel>
    <div>
      <h2>Active Session</h2>
      <p>Calories burned: {{ currentCalories }}</p>
      <p>Client ID: {{ currentClientId }}</p>
    </div>
    <!-- Right panel: session details -->
    <SplitterPanel :size="70">
  <div class="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl shadow-md p-6">
    <h2 class="text-xl font-semibold text-gray-700 mb-4">
      🏋️ Session – {{ session.client.user.first_name }}
    </h2>
    
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
    <span class="text-sm text-gray-500">time</span>
  </div>
  </div>
</SplitterPanel>
  </Splitter>
</div>
</template>