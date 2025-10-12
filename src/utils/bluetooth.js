import { BleClient, numbersToDataView, numberToUUID } from '@capacitor-community/bluetooth-le';

const BATTERY_SERVICE = numberToUUID(0x180f);
const BATTERY_CHARACTERISTIC = numberToUUID(0x2a19);
const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';


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

export { BATTERY_SERVICE, BATTERY_CHARACTERISTIC, HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT_CHARACTERISTIC, parseHeartRate };