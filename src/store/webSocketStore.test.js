import { describe, test, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { webSocketStore } from './webSocketStore.js';

describe('webSocketStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('should initialize with empty state', () => {
    const store = webSocketStore();
    expect(store.bpmsFromWsCoach).toEqual({});
    expect(store.caloriesFromWsCoach).toEqual({});
  });

  test('should update BPM from Coach WS', () => {
    const store = webSocketStore();
    store.bpmsFromWsCoach[123] = 72;
    expect(store.bpmsFromWsCoach[123]).toBe(72);
  });

  test('should update calories from Coach WS', () => {
    const store = webSocketStore();
    store.caloriesFromWsCoach[123] = 250;
    expect(store.caloriesFromWsCoach[123]).toBe(250);
  });

  test('should clear all client data on clearClientData()', () => {
    const store = webSocketStore();
    
    // Populate maps
    store.bpmsFromWsCoach[123] = 75;
    store.caloriesFromWsCoach[123] = 250;
    store.client_name[123] = 'John';
    store.startedAt[123] = new Date();
    store.pausedByClient[123] = true;
    
    // Clear
    store.clearClientData(123);
    
    // Verify all cleared
    expect(store.bpmsFromWsCoach[123]).toBeUndefined();
    expect(store.caloriesFromWsCoach[123]).toBeUndefined();
    expect(store.client_name[123]).toBeUndefined();
    expect(store.startedAt[123]).toBeUndefined();
    expect(store.pausedByClient[123]).toBeUndefined();
  });

  test('should not affect other clients on clearClientData()', () => {
    const store = webSocketStore();
    
    store.bpmsFromWsCoach[123] = 75;
    store.bpmsFromWsCoach[456] = 80;
    
    store.clearClientData(123);
    
    expect(store.bpmsFromWsCoach[123]).toBeUndefined();
    expect(store.bpmsFromWsCoach[456]).toBe(80);
  });

  test('should track active clients', () => {
    const store = webSocketStore();
    store.activeClients[123] = true;
    expect(store.activeClients[123]).toBe(true);
  });

  test('should track pause state', () => {
    const store = webSocketStore();
    store.pausedByClient[123] = true;
    store.pausedAtByClient[123] = new Date();
    store.pausedSecondsByClient[123] = 600;
    
    expect(store.pausedByClient[123]).toBe(true);
    expect(store.pausedSecondsByClient[123]).toBe(600);
  });
});
