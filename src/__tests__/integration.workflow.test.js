import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBleStore } from '@/store/useBleStore.js';
import { useSessionTimersStore } from '@/store/sessionTimerStore.js';
import { useSessionControlStore } from '@/store/sessionControlStore.js';
import { webSocketStore } from '@/store/webSocketStore.js';

describe('Training Session Workflow Integration', () => {
  let bleStore, timersStore, sessionControl, wsStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    bleStore = useBleStore();
    timersStore = useSessionTimersStore();
    sessionControl = useSessionControlStore();
    wsStore = webSocketStore();
  });

  test('complete session workflow: connect → start → pause → resume → finish', () => {
    const clientId = 123;
    const deviceId = 'DEVICE_ABC';
    const sessionId = 999;

    // 1. CONNECT DEVICE
    bleStore.setDevice(clientId, deviceId);
    bleStore.setConnection(clientId, 'connected');
    bleStore.setBattery(clientId, 85);

    expect(bleStore.getDeviceId(clientId)).toBe(deviceId);
    expect(bleStore.connectionStatus[clientId]).toBe('connected');
    expect(bleStore.batteryLevel[clientId]).toBe(85);

    // 2. START SESSION
    const sessionStart = new Date().toISOString();
    bleStore.setSessionId(clientId, sessionId);
    bleStore.setSessionStarted(clientId, true);
    timersStore.startTimerFor(clientId, sessionStart);

    expect(bleStore.getSessionId(clientId)).toBe(sessionId);
    expect(bleStore.isSessionStarted(clientId)).toBe(true);
    expect(timersStore.timers[clientId]).toBeGreaterThanOrEqual(0);
    expect(sessionControl.isPaused(clientId)).toBe(false);

    // 3. RECEIVE HR DATA FROM WS
    wsStore.bpmsFromWsCoach[clientId] = 75;
    wsStore.caloriesFromWsCoach[clientId] = 150;

    expect(wsStore.bpmsFromWsCoach[clientId]).toBe(75);
    expect(wsStore.caloriesFromWsCoach[clientId]).toBe(150);

    // 4. PAUSE SESSION
    const pausedValue = timersStore.pauseTimerFor(clientId);
    sessionControl.stopSession(clientId);

    expect(sessionControl.isPaused(clientId)).toBe(true);
    expect(timersStore.timers[clientId]).toBe(pausedValue);

    // 5. RESUME SESSION
    timersStore.resumeTimerFor(clientId);
    sessionControl.startSession(clientId);

    expect(sessionControl.isPaused(clientId)).toBe(false);

    // 6. FINISH SESSION
    const finalElapsed = timersStore.stopTimerFor(clientId);
    wsStore.clearClientData(clientId);
    bleStore.clearSession(clientId);
    sessionControl.clear(clientId);
    bleStore.setConnection(clientId, 'disconnected');
    bleStore.removeDevice(clientId);

    expect(timersStore.timers[clientId]).toBeUndefined();
    expect(wsStore.bpmsFromWsCoach[clientId]).toBeUndefined();
    expect(wsStore.caloriesFromWsCoach[clientId]).toBeUndefined();
    expect(bleStore.getSessionId(clientId)).toBeNull();
    expect(bleStore.isSessionStarted(clientId)).toBe(false);
    expect(bleStore.getDeviceId(clientId)).toBeNull();
  });

  test('manual disconnect flag prevents unwanted reconnect', () => {
    const clientId = 123;
    const deviceId = 'DEVICE_ABC';

    bleStore.setDevice(clientId, deviceId);
    bleStore.markManualDisconnect(clientId, deviceId);

    expect(bleStore.isManualDisconnect(clientId, deviceId)).toBe(true);

    // Simulate disconnect callback checking flag
    if (bleStore.isManualDisconnect(clientId, deviceId)) {
      bleStore.consumeManualDisconnect(clientId, deviceId);
      // Should NOT call reconnectDevice()
    }

    expect(bleStore.isManualDisconnect(clientId, deviceId)).toBe(false);
  });

  test('multiple clients operate independently', () => {
    const client1 = 123, client2 = 456;
    const device1 = 'DEV_1', device2 = 'DEV_2';

    // Client 1
    bleStore.setDevice(client1, device1);
    bleStore.setSessionId(client1, 111);
    bleStore.setSessionStarted(client1, true);
    bleStore.setBattery(client1, 80);

    // Client 2
    bleStore.setDevice(client2, device2);
    bleStore.setSessionId(client2, 222);
    bleStore.setSessionStarted(client2, true);
    bleStore.setBattery(client2, 60);

    // Pause only client 1
    sessionControl.stopSession(client1);

    expect(sessionControl.isPaused(client1)).toBe(true);
    expect(sessionControl.isPaused(client2)).toBe(false);

    expect(bleStore.batteryLevel[client1]).toBe(80);
    expect(bleStore.batteryLevel[client2]).toBe(60);

    expect(bleStore.getSessionId(client1)).toBe(111);
    expect(bleStore.getSessionId(client2)).toBe(222);
  });

  test('pause state sync across stores', () => {
    const clientId = 123;

    // Client paused via WS Gym socket
    wsStore.pausedByClient[clientId] = true;
    wsStore.pausedAtByClient[clientId] = new Date();
    wsStore.pausedSecondsByClient[clientId] = 300;

    // App sync: update sessionControl
    sessionControl.stopSession(clientId);

    expect(sessionControl.isPaused(clientId)).toBe(true);
    expect(wsStore.pausedByClient[clientId]).toBe(true);
  });

  test('force delete clears all client data', () => {
    const clientId = 123;
    const deviceId = 'DEVICE_ABC';

    // Setup
    bleStore.setDevice(clientId, deviceId);
    bleStore.setSessionId(clientId, 999);
    bleStore.setSessionStarted(clientId, true);
    bleStore.setConnection(clientId, 'connected');
    bleStore.setBattery(clientId, 75);
    sessionControl.stopSession(clientId);
    wsStore.bpmsFromWsCoach[clientId] = 72;
    wsStore.caloriesFromWsCoach[clientId] = 200;
    timersStore.startTimerFor(clientId, new Date().toISOString());

    // Force delete cleanup
    timersStore.stopTimerFor(clientId);
    wsStore.clearClientData(clientId);
    bleStore.clearSession(clientId);
    sessionControl.clear(clientId);
    bleStore.setConnection(clientId, 'disconnected');
    bleStore.removeDevice(clientId);

    // Verify complete cleanup
    expect(bleStore.getDeviceId(clientId)).toBeNull();
    expect(bleStore.getSessionId(clientId)).toBeNull();
    expect(bleStore.isSessionStarted(clientId)).toBe(false);
    expect(bleStore.connectionStatus[clientId]).toBe('disconnected');
    expect(timersStore.timers[clientId]).toBeUndefined();
    expect(wsStore.bpmsFromWsCoach[clientId]).toBeUndefined();
    expect(sessionControl.isPaused(clientId)).toBe(false);
  });
});
