import { BleClient, numbersToDataView, numberToUUID } from '@capacitor-community/bluetooth-le';
import { storeToRefs } from 'pinia';
const BATTERY_SERVICE = numberToUUID(0x180f);
const BATTERY_CHARACTERISTIC = numberToUUID(0x2a19);
const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';
import { sendBpmToBackend } from '@/services/trainingSessionsService';

function parseHeartRate(value) {
  const flags = value.getUint8(0);
  const rate16Bits = flags & 0x1;
  let heartRate;
  if (rate16Bits > 0) {
    heartRate = value.getUint16(1, true);
  } else {
    heartRate = value.getUint8(1);
  }
  return heartRate;
}



import { useBleStore } from '@/store/useBleStore.js';
const bleStore = useBleStore();
const { connectionStatus, batteryLevel, sessionIds, sessionsStarted } = storeToRefs(bleStore);
import { webSocketStore } from '@/store/webSocketStore';
const wsStore = webSocketStore();

async function startHeartRateNotifications(clientId, deviceId) {
  await BleClient.startNotifications(
    deviceId,
    HEART_RATE_SERVICE,
    HEART_RATE_MEASUREMENT_CHARACTERISTIC,
    (value) => {
      const bpm = parseHeartRate(value);
      wsStore.bpmsFromWsCoach[clientId] = bpm;
      
      if (bleStore.isSessionStarted(clientId)) {
                sendBpmToBackend(
                  { id: clientId },
                  bpm,
                  { deviceId },
                    bleStore.getSessionId(clientId)
                  );
                }
        }
      );
    }

async function stopHeartRateNotificationsSafe(deviceId) {
  try {
    await BleClient.stopNotifications(
      deviceId,
      HEART_RATE_SERVICE,
      HEART_RATE_MEASUREMENT_CHARACTERISTIC
    );
    console.log("⏸️ HR notifications stopped:", deviceId);
  } catch (e) {
    // Some stacks throw if notifications weren't running — treat as OK
    console.warn("Stop notifications failed (often harmless):", e?.message || e);
  }
}

export { BATTERY_SERVICE, BATTERY_CHARACTERISTIC, HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT_CHARACTERISTIC, parseHeartRate, startHeartRateNotifications, stopHeartRateNotificationsSafe };
