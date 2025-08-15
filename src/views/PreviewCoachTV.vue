<template>
  <div class="p-4">
    <!-- Users Cards -->
    <div class="grid">
      <div class="col-12 md:col-4" v-for="(user, index) in users" :key="user.id">
        <Card :title="user.first_name + ' ' + user.last_name">
          <p>{{ user.device?.name || 'No device connected' }}</p>
          <p v-if="user.battery !== undefined">🔋 Battery: {{ user.battery }}%</p>
          <p v-if="user.bpm !== null">❤️ {{ user.bpm }} bpm</p>
          <p v-if="user.calories !== null">🔥 {{ user.calories }} kcal</p>
          <p v-if="user.sessionActive">⏱️ Time: {{ formatTime(user.timer) }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <Button label="Connect" icon="pi pi-link" @click="connectDevice(user)" v-if="!user.device" />
            <Button label="Start" icon="pi pi-play" @click="createSession(user)" v-if="user.device && !user.sessionActive" />
            <Button label="End" icon="pi pi-stop" @click="finishSession(user)" v-if="user.device && user.sessionActive" />
            <Button label="Remove" icon="pi pi-trash" class="p-button-danger" @click="removeUser(index)" />
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';

import { computed } from 'vue'
import { useUserStore } from '../stores/main';

const store = useUserStore()
const activeUsers = computed(() => store.activeUsers)

/** --- Tipovi --- **/

interface BackendUser {
  id: number;
  first_name: string;
  last_name: string;
}

interface BluetoothDeviceData {
  name: string;
  gatt: BluetoothRemoteGATTServer;
}

interface User extends BackendUser {
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

/** --- Reactive state --- **/
const users = ref<User[]>([]);
const availableUsers = ref<BackendUser[]>([]);
const showUserModal = ref(false);
const selectedUserId = ref<number | null>(null);
/** --- Helper functions --- **/
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
const createSession = async (user: User) => {
  try {
    const response = await axios.post("http://mygym.localhost:8000/api_heart/create-session", {
      user_id: user.id,
      start: new Date().toISOString(),
      title: `Session ${new Date().toLocaleString()}`
    });

    user.sessionActive = true;
    user.sessionId = response.data.id;
    user.timer = 0;
    user.timerInterval = setInterval(() => {
      user.timer++;
    }, 1000);
    console.log("✅ Sesija započeta:", response.data);
  } catch (err: any) {
    console.error("❌ Greška pri pokretanju sesije:", err.response?.data || err.message);
  }
};

const finishSession = async (user: User) => {
  try {
    if (!user.sessionId) return console.warn("⚠️ Korisnik nema aktivnu sesiju.");

    await axios.patch(`http://mygym.localhost:8000/api_heart/finish-session/${user.sessionId}`, {});

    user.sessionActive = false;
    clearInterval(user.timerInterval!);
    user.timerInterval = null;
    user.sessionId = null;
    console.log("⏹ Sesija završena za korisnika:", user.id);
  } catch (err: any) {
    console.error("❌ Greška pri završetku sesije:", err.response?.data || err.message);
  }
};

const confirmUserSelection = () => {
  if (selectedUserId.value) {
    const userData = availableUsers.value.find(u => u.id === selectedUserId.value);
    if (userData) {
      selectUser(userData);
    }
    selectedUserId.value = null;
    showUserModal.value = false;
  }
};

const sendHeartRateToBackend = async (user: User, bpm: number, device: BluetoothDevice) => {
  try {
    await axios.post("http://mygym.localhost:8000/api_heart/save-heartbeat", {
      user: user.id,
      bpm,
      device_id: device.name,
      training_session: user.sessionId || null,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("❌ Greška pri slanju BPM:", err.response?.data || err.message);
  }
};

/** --- User management --- **/
const selectUser = (userData: BackendUser) => {
  const newUser: User = {
    ...userData,
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
  users.value.push(newUser);
  showUserModal.value = false;
};

const removeUser = async (index: number) => {
  const user = users.value[index];
  try {
    if (user.characteristic) await user.characteristic.stopNotifications();
    if (user.server?.connected) await user.server.disconnect();
  } catch (err) {
    console.warn("⚠️ Disconnect failed:", err);
  }
  users.value.splice(index, 1);
};

/** --- Device connection --- **/
const connectDevice = async (user: User) => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['heart_rate', 'battery_service']
    });

    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService('heart_rate');
    const characteristic = await service.getCharacteristic('heart_rate_measurement');

    user.device = device;
    user.server = server;
    user.characteristic = characteristic;

    try {
      const batteryService = await server.getPrimaryService('battery_service');
      const batteryChar = await batteryService.getCharacteristic('battery_level');
      const batteryValue = await batteryChar.readValue();
      user.battery = batteryValue.getUint8(0);
      console.log(`🔋 Battery Level: ${user.battery}%`);
    } catch (err: any) {
      console.warn("⚠️ Battery level not available:", err.message);
      user.battery = null;
    }

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
      const val = (event.target as BluetoothRemoteGATTCharacteristic).value!;
      const flags = val.getUint8(0);
      const hr = (flags & 0x01) ? val.getUint16(1, true) : val.getUint8(1);
      user.bpm = hr;
      if (user.sessionActive && user.sessionId) {
        sendHeartRateToBackend(user, hr, device);
      }
    });
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
};

/** --- Lifecycle --- **/
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler);

  // Fetch available users
  fetch("http://mygym.localhost:8000/api_heart/get-all-users")
    .then(res => res.json())
    .then(data => availableUsers.value = data)
    .catch(err => console.error("Failed to fetch users:", err));

  // WebSocket
  const socket = new WebSocket('ws://localhost:8000/ws/bpm/');
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const user = users.value.find(u => u.id === data.user_id);
    if (user) {
      if (data.bpm !== undefined) user.bpm = data.bpm;
      if (data.current_calories !== undefined) user.calories = data.current_calories;
    }
    console.log('✅ Primljeni podaci:', data);
  };
  socket.onclose = () => console.warn('WebSocket closed');
  socket.onerror = (err) => console.error('WebSocket error:', err);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler);
  // Možeš ovde dodati disconnect svih BLE uređaja
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
