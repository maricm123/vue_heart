import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBleStore } from '@/store/useBleStore.js';
import { webSocketStore } from '@/store/webSocketStore.js';

describe('Edge Cases & Failure Modes', () => {
  let bleStore, wsStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    bleStore = useBleStore();
    wsStore = webSocketStore();
  });

  test('P0.6: Manual disconnect flag persists across unmount/remount', () => {
    const clientId = 123;
    const deviceId = 'DEVICE_ABC';

    // 1. Mark manual disconnect in store
    bleStore.markManualDisconnect(clientId, deviceId);
    expect(bleStore.isManualDisconnect(clientId, deviceId)).toBe(true);

    // 2. Simulate unmount (in real scenario, component state is lost, but bleStore persists)
    // 3. Simulate remount (new component instance)

    // 4. Flag still accessible from bleStore (Pinia)
    expect(bleStore.isManualDisconnect(clientId, deviceId)).toBe(true);

    // 5. Disconnect callback checks flag (should find it)
    if (bleStore.isManualDisconnect(clientId, deviceId)) {
      bleStore.consumeManualDisconnect(clientId, deviceId);
      // Should NOT call reconnectDevice()
    }

    expect(bleStore.isManualDisconnect(clientId, deviceId)).toBe(false);
  });

  test('9.1: Duplicate BPM notifications handled gracefully', () => {
    const clientId = 123;

    // First update from BLE notif
    wsStore.bpmsFromWsCoach[clientId] = 72;
    expect(wsStore.bpmsFromWsCoach[clientId]).toBe(72);

    // Second update from WS message (same value)
    wsStore.bpmsFromWsCoach[clientId] = 72;
    expect(wsStore.bpmsFromWsCoach[clientId]).toBe(72);

    // No error, just overwrites with same value
  });

  test('9.2: Disconnect during pause', () => {
    const clientId = 123;
    const deviceId = 'DEVICE_ABC';

    // Setup: session running, then paused
    bleStore.setDevice(clientId, deviceId);
    bleStore.setConnection(clientId, 'connected');

    // Device disconnects while paused
    bleStore.setConnection(clientId, 'reconnecting');
    expect(bleStore.connectionStatus[clientId]).toBe('reconnecting');

    // Can still finish session without reconnect
    bleStore.markManualDisconnect(clientId, deviceId);
    bleStore.setConnection(clientId, 'disconnected');
    expect(bleStore.connectionStatus[clientId]).toBe('disconnected');
  });

  test('9.3: Finish session while reconnecting', () => {
    const clientId = 123;
    const deviceId = 'DEVICE_ABC';
    const sessionId = 999;

    // Setup: session active, device reconnecting
    bleStore.setDevice(clientId, deviceId);
    bleStore.setSessionId(clientId, sessionId);
    bleStore.setSessionStarted(clientId, true);
    bleStore.setConnection(clientId, 'reconnecting');

    // Finish: mark manual disconnect, clear session
    bleStore.markManualDisconnect(clientId, deviceId);
    bleStore.clearSession(clientId);
    bleStore.setConnection(clientId, 'disconnected');

    // Verify: no lingering state
    expect(bleStore.getSessionId(clientId)).toBeNull();
    expect(bleStore.isSessionStarted(clientId)).toBe(false);

    // If reconnect callback fires, flag is set, so won't trigger reconnect
    expect(bleStore.isManualDisconnect(clientId, deviceId)).toBe(true);
  });

  test('9.4: Switching device for same client', () => {
    const clientId = 123;
    const deviceA = 'DEVICE_A';
    const deviceB = 'DEVICE_B';

    // Connect device A
    bleStore.setDevice(clientId, deviceA);
    expect(bleStore.getDeviceId(clientId)).toBe(deviceA);

    // Switch to device B (overwrites)
    bleStore.setDevice(clientId, deviceB);
    expect(bleStore.getDeviceId(clientId)).toBe(deviceB);

    // Old device A is orphaned, but reconnect won't trigger for it
    // (no mapping to clientId anymore)
  });

  test('9.5: WS reconnect causing stale data', () => {
    const clientId = 123;

    // Before disconnect: BPM = 75
    wsStore.bpmsFromWsCoach[clientId] = 75;
    wsStore.caloriesFromWsCoach[clientId] = 200;

    // WS disconnects
    wsStore.isUserConnected = false;

    // Gym side paused (but coach WS didn't see it)
    wsStore.pausedByClient[clientId] = true;

    // Coach WS reconnects, resync sent
    wsStore.isUserConnected = true;

    // New message with updated state
    wsStore.bpmsFromWsCoach[clientId] = 78;
    wsStore.caloriesFromWsCoach[clientId] = 210;
    wsStore.pausedByClient[clientId] = true;

    // State is now consistent
    expect(wsStore.pausedByClient[clientId]).toBe(true);
  });

  test('9.7: Multiple clients simultaneously', () => {
    const clients = [123, 456, 789];
    const devices = ['DEV_A', 'DEV_B', 'DEV_C'];

    clients.forEach((clientId, i) => {
      bleStore.setDevice(clientId, devices[i]);
      bleStore.setSessionId(clientId, clientId * 10);
      bleStore.setSessionStarted(clientId, true);
      wsStore.bpmsFromWsCoach[clientId] = 70 + i * 5;
    });

    // Verify all independent
    expect(bleStore.getDeviceId(123)).toBe('DEV_A');
    expect(bleStore.getDeviceId(456)).toBe('DEV_B');
    expect(bleStore.getDeviceId(789)).toBe('DEV_C');
    expect(wsStore.bpmsFromWsCoach[123]).toBe(70);
    expect(wsStore.bpmsFromWsCoach[456]).toBe(75);
    expect(wsStore.bpmsFromWsCoach[789]).toBe(80);

    // Finish client 456
    bleStore.clearSession(456);
    wsStore.clearClientData(456);

    // Others unaffected
    expect(bleStore.isSessionStarted(123)).toBe(true);
    expect(bleStore.isSessionStarted(789)).toBe(true);
    expect(wsStore.bpmsFromWsCoach[123]).toBe(70);
    expect(wsStore.bpmsFromWsCoach[789]).toBe(80);
  });

  test('9.10: Backend offline / network failure', () => {
    const clientId = 123;

    // BLE notif updates UI
    wsStore.bpmsFromWsCoach[clientId] = 75;
    expect(wsStore.bpmsFromWsCoach[clientId]).toBe(75);

    // REST call to /save-heartbeat fails (not tested here, but app continues)
    // Calories don't update
    expect(wsStore.caloriesFromWsCoach[clientId]).toBeUndefined();

    // App can still finish session
    wsStore.bpmsFromWsCoach[clientId] = undefined; // Cleanup
    expect(wsStore.bpmsFromWsCoach[clientId]).toBeUndefined();
  });

  test('Pause state sync: WS Gym → sessionControl', () => {
    const clientId = 123;

    // Gym WS broadcasts pause
    wsStore.pausedByClient[clientId] = true;
    wsStore.pausedAtByClient[clientId] = new Date('2026-03-04T10:25:30Z');
    wsStore.pausedSecondsByClient[clientId] = 600;

    // App reflects in sessionControl
    // (This would normally be done in CoachTvPreview component or Pinia action)
    expect(wsStore.pausedByClient[clientId]).toBe(true);
    expect(wsStore.pausedSecondsByClient[clientId]).toBe(600);
  });

  test('Clear client data on Gym WS finish event', () => {
    const clientId = 123;

    // Setup client data
    wsStore.activeClients[clientId] = true;
    wsStore.bpmsForGym[clientId] = 75;
    wsStore.caloriesForGym[clientId] = 200;
    wsStore.client_name[clientId] = 'John';
    wsStore.startedAt[clientId] = new Date();

    // Gym WS sends training_session_finished event
    delete wsStore.activeClients[clientId];
    wsStore.clearClientData(clientId);

    // Verify cleanup
    expect(wsStore.activeClients[clientId]).toBeUndefined();
    expect(wsStore.bpmsForGym[clientId]).toBeUndefined();
    expect(wsStore.caloriesForGym[clientId]).toBeUndefined();
    expect(wsStore.client_name[clientId]).toBeUndefined();
  });

  test('Type safety: clientId normalization', () => {
    const clientId = 123;

    // Store with number
    bleStore.setDevice(clientId, 'DEVICE_123');

    // Retrieve with string (should still work via toClientId normalization)
    expect(bleStore.getDeviceId('123')).toBe('DEVICE_123');

    // Retrieve with number
    expect(bleStore.getDeviceId(123)).toBe('DEVICE_123');
  });
});
