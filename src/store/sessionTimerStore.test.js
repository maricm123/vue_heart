import { describe, test, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSessionTimersStore } from './sessionTimerStore.js';

describe('sessionTimersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('should format < 1 minute as MM:SS', () => {
    const store = useSessionTimersStore();
    expect(store.formatDuration(45)).toBe('00:45');
  });

  test('should format 1+ minute as MM:SS', () => {
    const store = useSessionTimersStore();
    expect(store.formatDuration(125)).toBe('02:05');
  });

  test('should format 1+ hour as HH:MM:SS', () => {
    const store = useSessionTimersStore();
    expect(store.formatDuration(3665)).toBe('01:01:05');
  });

  test('should start timer', () => {
    const store = useSessionTimersStore();
    const now = new Date().toISOString();
    store.startTimerFor(123, now);
    expect(store.timers[123]).toBeGreaterThanOrEqual(0);
  });

  test('should pause and resume timer', () => {
    const store = useSessionTimersStore();
    const now = new Date().toISOString();
    
    store.startTimerFor(123, now);
    const valueBefore = store.timers[123];
    
    store.pauseTimerFor(123);
    const valuePaused = store.timers[123];
    
    expect(valuePaused).toBe(valueBefore);
  });

  test('should clear timer on stop', () => {
    const store = useSessionTimersStore();
    store.startTimerFor(123, new Date().toISOString());
    store.stopTimerFor(123);
    
    expect(store.timers[123]).toBeUndefined();
  });
});
