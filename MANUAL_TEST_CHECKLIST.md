# Manual Testing Checklist

Testiraj sve ove scenarije kada promeniš kod. Markiraj sa ✅ kada je testirano.

## Basic Flow

- [ ] **Device Connect**: Select client → Click "Connect Device" → Pick device → Status changes to "connected" + Battery shows
- [ ] **HR Streaming**: BPM appears and updates every ~1s → Matches device readout
- [ ] **Start Session**: Status "connected" → Click "Start Session" → Timer begins → Session card appears
- [ ] **Finish Session**: Session active → Click "Finish" → Session removed from UI → Device disconnected

## Pause / Resume

- [ ] **Pause Button**: Shows "Stop session" when running → Click → Timer stops → Button shows loading spinner
- [ ] **Paused State**: Timer frozen → BPM still visible but not sent to backend
- [ ] **Resume Button**: Shows "Resume session" when paused → Click → Timer resumes from last value
- [ ] **BPM After Resume**: BPM updates resume after clicking Resume

## Multiple Clients

- [ ] **Two Clients Connected**: Connect 2 devices → Start 2 sessions → Both timers independent
- [ ] **Pause One Client**: Pause client #1 → Client #2 timer continues
- [ ] **Different Battery Levels**: Battery display correct for each client

## Disconnect Scenarios

- [ ] **Manual Disconnect**: Click "Disconnect Device" → Status "disconnected" → No reconnect attempts
- [ ] **Unexpected Disconnect**: Pull out device → Status "reconnecting" → Watch retries → Reconnect succeeds OR max retries reached
- [ ] **Disconnect During Pause**: Pause session → Pull out device → Device tries to reconnect → Still paused after reconnect

## Finish Session Edge Cases

- [ ] **Finish While Reconnecting**: Device reconnecting → Click "Finish" → Session finishes cleanly → No ghost reconnects
- [ ] **Finish After Navigation Away**: Start session → Go to another page → Return → Session still there → Click "Finish" → Removed successfully
- [ ] **Device Still Connected After Finish**: Finish session → Check OS Bluetooth → Device should disconnect cleanly

## Delete Session

- [ ] **Force Delete**: Click "Delete session" → Confirm → Session deleted → Device disconnected
- [ ] **Delete Clears All Data**: After delete, check localStorage/state is clean (no orphaned timers, BPMs, etc.)

## WebSocket Reconnect

- [ ] **WS Disconnects**: Kill network → Coach WS closes → Reconnects with exponential backoff → Resync sent
- [ ] **BPM Resume After WS Reconnect**: WS down for 5s → Restore network → BPM updates resume
- [ ] **Pause Event From Gym WS**: Pause on coach side → Verify Gym socket receives `session_pause` event

## Cleanup / State Management

- [ ] **Component Unmount/Remount**: Start session → Navigate away (unmount CoachTvPreview) → Return (remount) → Session still there with correct state
- [ ] **No Ghost State**: After finish, check no lingering timers, BLE callbacks, or reconnect attempts
- [ ] **Multiple Sessions Cleanup**: 3 sessions running → Finish one → Other 2 unaffected

## Loading States

- [ ] **Start Session Loading**: Button shows loading spinner while REST call pending
- [ ] **Pause/Resume Loading**: Button shows loading spinner during REST call
- [ ] **Connect Device Loading**: "Connecting..." shows while BLE connecting
- [ ] **Finish Loading**: Button state updates on finish

## Error Handling

- [ ] **Network Error on Pause**: REST call fails → Toast error message appears → Button stops loading → Can retry
- [ ] **BLE Disconnect During Start Session**: Start session called → Device disconnects mid-operation → Graceful error
- [ ] **WS Heartbeat Failure**: (Check logs) Heartbeat sent but server doesn't respond → Should recover or timeout

## Edge Case: Unmount/Remount with Manual Disconnect (P0.6 FIX)

**This is the critical bug fix:**

1. Start session with client 1
2. Finish session → `markManualDisconnect()` called
3. Navigate to another page (CoachTvPreview unmounts)
4. Navigate back to CoachTvPreview (remounts)
5. Check: Device **should NOT** show "reconnecting..."
6. If device spontaneously disconnects, should recognize it as manual disconnect (not unexpected)
7. **Expected:** Device status = "disconnected", no reconnect retries

---

## Test Command

```bash
npm run test
npm run test:ui
```

---

**Last Updated:** 2026-03-04
