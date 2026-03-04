import { describe, test, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSessionControlStore } from './sessionControlStore.js';

describe('sessionControlStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('should check pause state (initial false)', () => {
    const store = useSessionControlStore();
    expect(store.isPaused(123)).toBe(false);
  });

  test('should stop (pause) session', () => {
    const store = useSessionControlStore();
    store.stopSession(123);
    expect(store.isPaused(123)).toBe(true);
  });

  test('should start (resume) session', () => {
    const store = useSessionControlStore();
    store.stopSession(123);
    store.startSession(123);
    expect(store.isPaused(123)).toBe(false);
  });

  test('should toggle session state', () => {
    const store = useSessionControlStore();
    
    expect(store.isPaused(123)).toBe(false);
    store.toggleSession(123);
    expect(store.isPaused(123)).toBe(true);
    
    store.toggleSession(123);
    expect(store.isPaused(123)).toBe(false);
  });

  test('should clear pause state', () => {
    const store = useSessionControlStore();
    store.stopSession(123);
    store.clear(123);
    expect(store.isPaused(123)).toBe(false);
  });

  test('should handle multiple clients independently', () => {
    const store = useSessionControlStore();
    
    store.stopSession(123);
    store.startSession(456);
    
    expect(store.isPaused(123)).toBe(true);
    expect(store.isPaused(456)).toBe(false);
  });
});
