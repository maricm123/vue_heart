import { ref, reactive } from 'vue'
import { Capacitor } from '@capacitor/core'
import { BleClient } from '@capacitor-community/bluetooth-le'

export function useBle() {
  const isNative = Capacitor.isNativePlatform()
  const devices = reactive({})
  const connectingDevices = reactive({})
  const bpms = reactive({})
  // --- WEB LOGIC ---
  async function connectDeviceWeb(client) {
    connectingDevices[client.id] = true
    try {
      console.log('Requesting BLE device for client', client.id)
      await BleClient.initialize()
      const device = await BleClient.requestDevice({
        services: ['0000180d-0000-1000-8000-00805f9b34fb'],
      })
      await BleClient.connect(device.deviceId)
      devices[client.id] = device
      // startNotifications i ostalo ostaje isto
      await BleClient.startNotifications(
    device.deviceId,
    '0000180d-0000-1000-8000-00805f9b34fb', // Heart Rate Service
    '00002a37-0000-1000-8000-00805f9b34fb', // Heart Rate Measurement Characteristic
    (value) => {
      const data = new Uint8Array(value.buffer);

      // 🔍 pravilno parsiranje HRM paketa
      const flags = data[0];
      let bpm;
      if (flags & 0x01) {
        bpm = data[1] | (data[2] << 8); // 16-bit little endian
      } else {
        bpm = data[1]; // 8-bit
      }

      bpms[client.id] = bpm;

      console.log("❤️ BPM parsed:", bpm, "raw:", data);

      if (sessionsStarted[client.id]) {
      sendBpmToBackend(client, bpm, device, sessionIds[client.id]);
      }
    }
  );
    } catch (err) {
      console.error('BLE Web error:', err)
    } finally {
      connectingDevices[client.id] = false
    }
  }

  async function disconnectDeviceWeb(client) {
    if (!devices[client.id]) return
    try {
      await BleClient.stopNotifications(devices[client.id].deviceId,
        '0000180d-0000-1000-8000-00805f9b34fb',
        '00002a37-0000-1000-8000-00805f9b34fb'
      )
      await BleClient.disconnect(devices[client.id].deviceId)
      delete devices[client.id]
    } catch (err) {
      console.warn('BLE Web disconnect error', err)
    }
  }

  // --- NATIVE LOGIC ---
  async function connectDeviceNative(client) {
    // logika za reconnect + native modal handling
    return connectDeviceWeb(client) // za početak može da pozove web logiku
  }

  async function disconnectDeviceNative(client) {
    return disconnectDeviceWeb(client)
  }

  // --- GENERIČKE METODE ---
  async function connect(client) {
    console.log('Connecting to device for client', client)
    console.log('Is native?', isNative)
    return isNative ? connectDeviceNative(client) : connectDeviceWeb(client)
  }

  async function disconnect(client) {
    return isNative ? disconnectDeviceNative(client) : disconnectDeviceWeb(client)
  }

  async function safeIsConnected(deviceId) {
    try {
      if (typeof BleClient.isConnected === 'function') {
        return await BleClient.isConnected(deviceId);
      }
      return false; // On web, treat as disconnected
    } catch (err) {
      console.warn('safeIsConnected failed:', err);
      return false;
    }
  }

  return {
    devices,
    connectingDevices,
    connect,
    disconnect,
    isNative,
    safeIsConnected,
  }
}
