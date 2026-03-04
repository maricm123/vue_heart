import { describe, test, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBleStore } from './useBleStore.js';

describe('bleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('should set and get session ID', () => {
    const store = useBleStore();
    store.setSessionId(123, 456);
    expect(store.getSessionId(123)).toBe(456);
  });

  test('should normalize client ID (string → number)', () => {
    const store = useBleStore();
    store.setSessionId('123', 456);
    expect(store.getSessionId(123)).toBe(456);
    expect(store.getSessionId('123')).toBe(456);
  });

  test('should set and check session started', () => {
    const store = useBleStore();
    store.setSessionStarted(123, true);
    expect(store.isSessionStarted(123)).toBe(true);
  });

  test('should clear session', () => {
    const store = useBleStore();
    store.setSessionId(123, 456);
    store.setSessionStarted(123, true);
    
    store.clearSession(123);
    
    expect(store.getSessionId(123)).toBeNull();
    expect(store.isSessionStarted(123)).toBe(false);
  });

  test('should set device and get device ID', () => {
    const store = useBleStore();
    store.setDevice(123, 'DEVICE_123');
    expect(store.getDeviceId(123)).toBe('DEVICE_123');
  });

  test('should remove device', () => {
    const store = useBleStore();
    store.setDevice(123, 'DEVICE_123');
    store.removeDevice(123);
    expect(store.getDeviceId(123)).toBeNull();
  });

  test('should set and update connection status', () => {
    const store = useBleStore();
    store.setConnection(123, 'connecting');
    expect(store.connectionStatus[123]).toBe('connecting');
    
    store.setConnection(123, 'connected');
    expect(store.connectionStatus[123]).toBe('connected');
  });

  test('should set battery level', () => {
    const store = useBleStore();
    store.setBattery(123, 85);
    expect(store.batteryLevel[123]).toBe(85);
  });

  test('should handle manual disconnect flag', () => {
    const store = useBleStore();
    store.markManualDisconnect(123, 'DEVICE_ABC');
    expect(store.isManualDisconnect(123, 'DEVICE_ABC')).toBe(true);
    
    store.consumeManualDisconnect(123, 'DEVICE_ABC');
    expect(store.isManualDisconnect(123, 'DEVICE_ABC')).toBe(false);
  });
});
