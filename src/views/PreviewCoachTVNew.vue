<template>
  <div class="p-4 bg-gray-50 min-h-screen flex flex-col items-center">
    <!-- Dugme visoko -->
    <div class="w-full flex justify-center mb-6">
      <Button
        label="Add new client"
        icon="pi pi-plus"
        class="p-button-rounded p-button-primary"
        @click="showClientModal = true"
      />
    </div>

    <!-- Modal za dodavanje clienta -->
    <Dialog v-model:visible="showClientModal" header="Select client" :modal="true">
      <Listbox
        :options="availableClients"
        optionLabel="user.last_name"
        @change="selectClient"
      />
    </Dialog>

    <!-- Grid sa korisnicima -->
    <div class="grid gap-4 w-full">
        {{ clients }}
      <div
        class="col-12 md:col-4"
        v-for="(client, index) in clients"
        :key="client.id"
      >
        <Card>
        <template #title>
            {{ client.user.first_name }} {{ client.user.last_name }}
        </template>
          <!-- Sadržaj -->
      <template #content>
        <p>{{ client.device?.name || 'No device connected' }}</p>
        <p v-if="client.battery !== undefined">🔋 Battery: {{ client.battery ?? 'N/A' }}%</p>
        <p v-if="client.bpm !== null">❤️ {{ client.bpm }} bpm</p>
        <p v-if="client.calories !== null">🔥 {{ client.calories }} kcal</p>
        <p v-if="client.sessionActive">⏱️ Time: {{ formatTime(client.timer) }}</p>

        <div class="mt-2 flex flex-wrap gap-2">
          <Button
            label="Connect"
            icon="pi pi-link"
            @click="connectDevice(client)"
            v-if="!client.device"
          />
          <Button
            label="Start"
            icon="pi pi-play"
            @click="createSession(client)"
            v-if="client.device && !client.sessionActive"
          />
          <Button
            label="End"
            icon="pi pi-stop"
            @click="finishSession(client)"
            v-if="client.device && client.sessionActive"
          />
          <Button
            label="Remove"
            icon="pi pi-trash"
            class="p-button-danger"
            @click="removeClient(index)"
          />
        </div>
      </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Listbox from "primevue/listbox";
import Card from "primevue/card";
import axios from "axios";

/** --- Tipovi --- **/
interface BackendClient {
  id: number;
  first_name: string;
  last_name: string;
}

interface Client extends BackendClient {
  bpm: number | null;
  calories: number | null;
  device: BluetoothDevice | null;
  server: BluetoothRemoteGATTServer | null;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
  sessionActive: boolean;
  sessionId: number | null;
  timer: number;
  timerInterval: ReturnType<typeof setInterval> | null;
  battery?: number | null;
}

/** --- State --- **/
const clients = ref<Client[]>([]);
const availableClients = ref<BackendClient[]>([]);
const showClientModal = ref(false);

/** --- Helper --- **/
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = '';
};

/** --- Session handling --- **/
const createSession = async (client: Client) => {
  try {
    const response = await axios.post("http://mygym.localhost:8000/api_heart/create-session", {
      client_id: client.id,
      gym_id: client.gym,
      start: new Date().toISOString(),
      title: `Session ${new Date().toLocaleString()}`
    });
    client.sessionActive = true;
    client.sessionId = response.data.id;
    client.timer = 0;
    client.timerInterval = setInterval(() => { client.timer++; }, 1000);
  } catch (err: any) { console.error(err); }
};

const finishSession = async (client: Client) => {
  if (!client.sessionId) return;
  await axios.patch(`http://mygym.localhost:8000/api_heart/finish-session/${client.sessionId}`, {});
  client.sessionActive = false;
  clearInterval(client.timerInterval!);
  client.timerInterval = null;
  client.sessionId = null;
};

/** --- Heartbeat --- **/
const sendHeartRateToBackend = async (client: Client, bpm: number, device: BluetoothDevice) => {
  try {
    await axios.post("http://mygym.localhost:8000/api_heart/save-heartbeat", {
      client: client.id,
      bpm,
      device_id: device.name,
      training_session: client.sessionId || null,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) { console.error(err); }
};

/** --- Client management --- **/
const selectClient = (clientData: BackendClient) => {
  const newClient: Client = {
    ...clientData.value,
    bpm: null,
    calories: null,
    device: null,
    server: null,
    characteristic: null,
    sessionActive: false,
    sessionId: null,
    timer: 0,
    timerInterval: null,
    battery: null
  };
  clients.value.push(newClient);
  showClientModal.value = false;
};

const removeClient = async (index: number) => {
  const client = clients.value[index];
  try { if (client.characteristic) await client.characteristic.stopNotifications(); } catch {}
  try { if (client.server?.connected) await client.server.disconnect(); } catch {}
  clients.value.splice(index, 1);
};

/** --- Device connection --- **/
const connectDevice = async (client: Client) => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['heart_rate', 'battery_service']
    });
    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService('heart_rate');
    const characteristic = await service.getCharacteristic('heart_rate_measurement');

    client.device = device;
    client.server = server;
    client.characteristic = characteristic;

    // Battery
    try {
      const batteryService = await server.getPrimaryService('battery_service');
      const batteryChar = await batteryService.getCharacteristic('battery_level');
      const batteryValue = await batteryChar.readValue();
      client.battery = batteryValue.getUint8(0);
    } catch { client.battery = null; }

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
      const val = (event.target as BluetoothRemoteGATTCharacteristic).value!;
      const flags = val.getUint8(0);
      const hr = (flags & 0x01) ? val.getUint16(1, true) : val.getUint8(1);
      client.bpm = hr;
      if (client.sessionActive && client.sessionId) sendHeartRateToBackend(client, hr, device);
    });
  } catch (err) { console.error(err); }
};

/** --- Lifecycle --- **/
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler);

  // Fetch clients
  fetch("http://mygym.localhost:8000/api_heart/get-all-clients")
    .then(res => res.json())
    .then(data => availableClients.value = data)
    .catch(console.error);

  // WebSocket
  const socket = new WebSocket('ws://localhost:8000/ws/bpm/');
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const client = clients.value.find(u => u.id === data.client_id);
    if (client) {
      if (data.bpm !== undefined) client.bpm = data.bpm;
      if (data.current_calories !== undefined) client.calories = data.current_calories;
    }
  };
});

onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler));
</script>