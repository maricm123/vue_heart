import { createPinia, setActivePinia } from 'pinia';
// Initialize Pinia before importing bluetooth.js which depends on trainingSessionsService
setActivePinia(createPinia());

import { describe, test, expect } from 'vitest';
import { parseHeartRate } from './bluetooth.js';

describe('parseHeartRate', () => {
  test('should parse 8-bit format (flags LSB = 0)', () => {
    const buffer = new Uint8Array([0x00, 72]);
    const dv = new DataView(buffer.buffer);
    expect(parseHeartRate(dv)).toBe(72);
  });

  test('should parse 16-bit format (flags LSB = 1)', () => {
    const buffer = new Uint8Array([0x01, 72, 0]);
    const dv = new DataView(buffer.buffer);
    expect(parseHeartRate(dv)).toBe(72);
  });

  test('should handle high HR (200 bpm)', () => {
    const buffer = new Uint8Array([0x01, 200, 0]);
    const dv = new DataView(buffer.buffer);
    expect(parseHeartRate(dv)).toBe(200);
  });

  test('should handle low HR (40 bpm)', () => {
    const buffer = new Uint8Array([0x00, 40]);
    const dv = new DataView(buffer.buffer);
    expect(parseHeartRate(dv)).toBe(40);
  });
});
