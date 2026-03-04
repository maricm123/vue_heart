# Testing Guide

## Setup

```bash
npm install -D vitest @vue/test-utils happy-dom
npm run test
```

## Test Structure

### Unit Tests (Store & Utils)

```
src/
├── utils/
│   └── bluetooth.test.js          ← parseHeartRate()
├── store/
│   ├── useBleStore.test.js        ← BLE device/session/connection state
│   ├── sessionTimerStore.test.js  ← Timer formatting and lifecycle
│   ├── sessionControlStore.test.js ← Pause/resume state
│   └── webSocketStore.test.js     ← WS data + clearClientData()
```

### Integration & Edge Cases

```
src/__tests__/
├── integration.workflow.test.js   ← Complete session workflow (connect→start→pause→resume→finish)
└── edge-cases.test.js             ← 12 critical edge cases from documentation
```

## Run Tests

```bash
# Run all tests
npm run test

# Watch mode (rerun on file change)
npm run test -- --watch

# UI Dashboard
npm run test:ui

# Run specific test file
npm run test -- bluetooth.test.js

# Run with coverage
npm run test -- --coverage
```

## What's Tested

### ✅ Unit Tests (unit):

- **parseHeartRate**: 8-bit/16-bit format parsing, high/low HR values
- **formatDuration**: MM:SS, HH:MM:SS formatting
- **bleStore**: setDevice, setSessionId, clearSession, manualDisconnect flag
- **timersStore**: startTimer, pauseTimer, resumeTimer, stopTimer
- **sessionControlStore**: isPaused, toggleSession, clear
- **wsStore**: BPM/calories update, clearClientData, pauseState, activeClients

### ✅ Integration Tests:

- **Complete workflow**: Device connect → start session → pause → resume → finish
- **Multiple clients**: 2+ clients running independently
- **Manual disconnect flag**: Prevents unwanted reconnect
- **State cleanup**: All maps cleared on finish/delete
- **Force delete**: Complete cleanup including timers + WS data

### ✅ Edge Cases:

- **P0.6**: Manual disconnect flag persistence across unmount/remount
- **9.1**: Duplicate BPM notifications (redundant updates ok)
- **9.2**: Disconnect during pause
- **9.3**: Finish while reconnecting
- **9.4**: Device switch (B overwrites A)
- **9.5**: WS reconnect stale data (resync heals)
- **9.7**: Multiple clients (150+ msgs/sec)
- **9.10**: Backend offline (graceful degrade)
- **Pause sync**: WS Gym → sessionControl
- **Finish event**: Cleanup on training_session_finished
- **Type safety**: clientId normalization (string ↔ number)

## Manual Testing

See: `MANUAL_TEST_CHECKLIST.md`

Covers UI flows, loading states, reconnect scenarios, navigation edge cases.

## Code Coverage

Each test should cover:
- ✅ Happy path (normal flow)
- ✅ Edge case (boundary condition, error, race condition)
- ✅ Cleanup (state reset)

## When to Test

1. **Always run tests after code changes:**
   ```bash
   npm run test
   ```

2. **Before pushing to git:**
   ```bash
   npm run test && npm run lint
   ```

3. **Run edge case tests when modifying:**
   - `bleStore` → run `edge-cases.test.js`
   - `toggleSession()` → run `integration.workflow.test.js`
   - WS reconnect logic → run `webSocketStore.test.js`

## Adding New Tests

Template:
```javascript
test('should [do something] when [condition]', () => {
  // Arrange
  const clientId = 123;
  bleStore.setDevice(clientId, 'DEVICE_XYZ');

  // Act
  const result = bleStore.getDeviceId(clientId);

  // Assert
  expect(result).toBe('DEVICE_XYZ');
});
```

## Known Gaps

⚠️ **NOT tested (requires Capacitor mock):**
- `BleClient.connect()` actual connection
- `BleClient.startNotifications()` callback
- Real WebSocket connections

✅ **These can be added later with:**
- `vi.mock()` for Capacitor
- Mock WebSocket server
- Component mount tests with Vue Test Utils

## Files

- `vitest.config.js` - Test config
- `package.json` - Test scripts
- `src/**/*.test.js` - Unit tests
- `src/__tests__/**/*.test.js` - Integration tests
- `MANUAL_TEST_CHECKLIST.md` - Manual flows

---

**Why test all edge cases?**

Many BLE + WS + UI state interactions can fail silently:
- Device ghost reconnects (P0.6)
- Memory leaks (orphaned timers)
- Race conditions (multiple clients)
- Stale state (unmount/remount)

Tests catch these **before users report them**.
