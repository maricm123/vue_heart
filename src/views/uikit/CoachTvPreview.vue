<script setup>
import { ref } from 'vue'
import axios from 'axios'

const loadingClients = ref(false)          // for modal
const connectingDevices = ref({})  
const display = ref(false)
const clients = ref([])
const layout = ref('list')
const options = ['list', 'grid']
const defaultAvatar = 'https://i.pravatar.cc/150?img=3' // placeholder image
const devices = ref({}) // store device per client { clientId: device }
const bpms = ref({}) // store bpm per client { clientId: bpm }
const sessionsStarted = ref({}) // track started sessions
// selected clients (array instead of single)
const selectedClients = ref([])
const servers = ref({}) 
const characteristics = ref({})

async function open() {
  display.value = true
  loadingClients.value = true
  try {
    const response = await axios.get(
      'http://mygym.localhost:8000/api_coach/get-all-clients-based-on-coach',
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
  disconnectDevice(client)   // disconnect first
  const index = selectedClients.value.findIndex(c => c.id === client.id)
  if (index !== -1) selectedClients.value.splice(index, 1)
}

// Connect device
async function connectDevice(client) {
  connectingDevices.value[client.id] = true
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }]
    })

    if (!device.gatt.connected) {
      await device.gatt.connect()
    }

    const server = await device.gatt.connect()
    const service = await server.getPrimaryService('heart_rate')
    const characteristic = await service.getCharacteristic('heart_rate_measurement')

    characteristic.startNotifications()
    characteristic.addEventListener('characteristicvaluechanged', event => {
      const value = event.target.value
      const bpm = value.getUint8(1) 
      bpms.value[client.id] = bpm
    })

    devices.value[client.id] = device
    servers.value[client.id] = server
    characteristics.value[client.id] = characteristic
  } catch (err) {
    console.error('Bluetooth error', err)
  } finally {
    connectingDevices.value[client.id] = false
  }
}

// Disconnect device
function disconnectDevice(client) {
  if (characteristics.value[client.id]) {
    characteristics.value[client.id].stopNotifications().catch(() => {})
    characteristics.value[client.id].removeEventListener('characteristicvaluechanged', () => {})
    delete characteristics.value[client.id]
  }
  if (servers.value[client.id]) {
    servers.value[client.id].disconnect()
    delete servers.value[client.id]
  }
  if (devices.value[client.id]) delete devices.value[client.id]
  if (bpms.value[client.id]) delete bpms.value[client.id]
  if (sessionsStarted.value[client.id]) delete sessionsStarted.value[client.id]
}

// Start session
function startSession(client) {
  sessionsStarted.value[client.id] = true
  console.log(`Session started for client ${client.user.first_name}`)
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
            @click="disconnectDevice(client)" 
        />
        </div>

        <!-- Show BPM and Start Session only when connected -->
        <div v-if="devices[client.id]">
        <p>BPM: {{ bpms[client.id] || '-' }}</p>
        <Button 
            label="Start Session" 
            :disabled="sessionsStarted[client.id]" 
            @click="startSession(client)" 
        />
        </div>
      </div>
    </template>
  </Card>
</div>
  </div>
</template>