# Training Sessions Workflow: Complete End-to-End Analysis

## 1. Overview

This document details the **complete end-to-end workflow** for a Vue 3 + Pinia + Capacitor BLE system that streams heart rate (HR) data from BLE devices to a coaching web application. The system manages:

- **Multiple clients** with individual BLE device connections
- **Live BPM streaming** via BLE notifications → backend REST → WebSocket broadcast
- **Calorie tracking** via backend calculations → WebSocket push
- **Session lifecycle** (create → start → pause/resume → finish/delete) with state synchronization across stores
- **Automatic BLE reconnect** with exponential backoff when devices disconnect unexpectedly
- **Dual WebSocket channels** (Coach: BPM updates; Gym: session metadata & pause events)
- **Timer management** that pauses/resumes alongside session state
- **Cleanup & data deletion** when sessions end or are forcefully deleted

The architecture ensures that a coach can monitor multiple clients simultaneously on a single screen, with live BPM/calorie updates and the ability to control session pause/resume at any time.

---

## 2. Main Actors & Data Flow

```
┌─────────────────────┐
│   CoachTVPreview    │
│  Vue Component      │
│  (UI Layer)         │
└──────────┬──────────┘
           │
       ╔═══╧═══╗
       ║ Stores ║
       ╚═╤═╤═╤═╝
    ┌──┘ │ │ └──────────┐
    │    │ │            │
    │    │ │            │
    ▼    ▼ ▼            ▼
 (BLE) (WS) (Control)  (Timers)
    │    │      │        │
    │    │      │        │
    ▼    ▼      ▼        ▼
 bleStore wsStore sessionControl sessionTimers
    │    │      │        │
    │    │      │        └─────────────────┐
    │    │      │                          │
    │    │      │         ┌────────────────┘
    │    │      │         │
    ▼    ▼      ▼         ▼
   BLE┌──────────────────────┐WS
    │ │  trainingSessionsSvc │
CLIENT└──────────────────────┘
       │         │
       │  REST   │
       ▼         ▼
   ┌─────────────────────┐
   │  Backend REST API   │
   │                     │
   │ POST /create-session│
   │ PATCH /finish-session
   │ POST /pause         │
   │ POST /resume        │
   │ DELETE /force-delete│
   │ POST /save-heartbeat│
   └─────────┬───────────┘
             │
             │
        ┌────┴────────────────────────┐
        │                             │
        ▼                             ▼
   ┌─────────────────┐          ┌──────────────┐
   │ SQLite/Database │          │ WebSocket    │
   │                 │          │ Server       │
   │ - Sessions      │          │              │
   │ - Heartbeats    │          │ /ws/bpm/     │
   │ - Calories      │          │ /ws/gym/     │
   └─────────────────┘          │              │
                                └──────┬───────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     ▼
            ┌──────────────┐                    ┌──────────────┐
            │ Coach Socket │                    │  Gym Socket  │
            │ (Coach View) │                    │ (Gym View)   │
            │              │                    │              │
            │ Sends: BPM   │                    │ Sends: Meta, │
            │ Updates      │                    │ pause/resume,│
            │              │                    │ finish events│
            └──────────────┘                    └──────────────┘
```

### Key Actors:

- **Coach UI (CoachTVPreview)**: Selects clients, connects BLE devices, starts sessions, controls pause/resume/finish, displays live BPM/calories/timers
- **BLE Device**: Broadcasts heart rate measurements; coach's phone initiates BLE connection via Capacitor
- **Backend REST API**: Creates/updates sessions, records heartbeats, manages lifecycle
- **WebSocket Coach (`/ws/bpm/`)**: Broadcasts live BPM and calorie updates to coach (keyed by `client_id`)
- **WebSocket Gym (`/ws/gym/`)**: Broadcasts session metadata, pause/resume events, finish events to gym displays
- **bleStore**: Manages BLE connection status, device IDs, session state per client
- **wsStore**: Manages two WebSocket connections and reactive maps for incoming data
- **sessionTimersStore**: Manages elapsed time counters and intervals per session
- **sessionControlStore**: Tracks pause/resume state per client

---

## 3. Key Stores and Their Responsibilities

### 3.1 **bleStore** (`useBleStore.js`)

**State:**
- `connectionStatus[clientId]`: `"disconnected" | "connecting" | "connected" | "reconnecting"`
- `batteryLevel[clientId]`: Battery percentage (0–100)
- `sessionsStarted[clientId]`: `true` if session is active
- `sessionIds[clientId]`: Current session ID (REST resource ID)
- `connectedDevices[clientId]`: Stored BLE device ID (persistent across component)
- `manuallyDisconnecting[clientId]`: Flag to prevent auto-reconnect on manual disconnect

**Key Actions:**
- `setConnection(clientId, status)`: Update connection state
- `setDevice(clientId, deviceId)`: Store device ID (survival key for reconnects)
- `setBattery(clientId, percent)`: Update battery display
- `setSessionId(clientId, sessionId)`: Store session ID after creation
- `setSessionStarted(clientId, true)`: Mark session as active
- `clearSession(clientId)`: Delete session/sessionId data (on cleanup)
- `removeDevice(clientId)`: Delete device ID
- `setManual(clientId, true)`: Flag manual disconnect to avoid reconnect loops

**Responsiblity:**
- Single source of truth for BLE connection state per client
- Persists device IDs for reconnect logic; survives full component remounts
- Provides getters to safely retrieve state (with `toClientId` normalization)

---

### 3.2 **wsStore** (`webSocketStore.js`)

**State:**

*Connections:*
- `wsCoach`: WebSocket ref to `/ws/bpm/`
- `wsGym`: WebSocket ref to `/ws/gym/`
- `isUserConnected`: `true` if Coach socket is open
- `isGymConnected`: `true` if Gym socket is open

*Reconnect Control:*
- `coachManualClose`: Flag preventing auto-reconnect if user called `disconnectCoach()`
- `gymManualClose`: Flag preventing auto-reconnect if user called `disconnectWholeGym()`
- `coachReconnectAttempts`: Retry counter (resets on successful connect)
- `gymReconnectAttempts`: Retry counter

*Data Maps (reactive):*
- `caloriesFromWsCoach[clientId]`: Latest calorie value from Coach socket
- `bpmsFromWsCoach[clientId]`: Latest BPM from Coach socket
- `caloriesForGym[clientId]`: Latest calories from Gym socket
- `bpmsForGym[clientId]`: Latest BPM from Gym socket
- `client[clientId]`: Client ID presence flag
- `client_name[clientId]`: N ame of client
- `coach[clientId]`: Coach ID
- `startedAt[clientId]`: Session start timestamp
- `max_heart_rate[clientId]`: Max HR threshold
- `receivedGymMetadata[clientId]`: Flag to prevent resending metadata
- `pausedByClient[clientId]`: `true` if pause event received from Gym
- `pausedAtByClient[clientId]`: Pause timestamp
- `pausedSecondsByClient[clientId]`: Elapsed seconds at pause time
- `activeClients[clientId]`: `true` if client session is active

**Key Actions:**
- `connectCoach()`: Open Coach `/ws/bpm/` socket, set up hearbeat, request resync
- `disconnectCoach()`: Close Coach socket intentionally, cancel reconnect
- `connectWholeGym()`: Open Gym `/ws/gym/` socket, set up hearbeat, request resync
- `disconnectWholeGym()`: Close Gym socket intentionally
- `clearClientData(clientId)`: Delete all maps entries for a client (final cleanup)

**Rebuild & Reconnect Logic:**
- `scheduleCoachReconnect()`: Exponential backoff timer (500ms → 5000ms)
- `scheduleGymReconnect()`: Same backoff for Gym socket
- `startCoachHeartbeat()`: 15s interval ping (optional, backend may ignore)
- `startGymHeartbeat()`: 15s interval ping

**Message Handlers:**
- **Coach `onmessage`**: Parses `{ client_id, bpm, current_calories }`, ignores `event: 'pong'`
- **Gym `onmessage`**:
  - `event: 'initial'`: Metadata (name, coach_id, max_heart_rate, started_at)
  - `event: 'session_pause'`: Sets `pausedByClient[clientId]`, `pausedAtByClient`, `pausedSecondsByClient`
  - `event: 'training_session_finished'`: Deletes `activeClients[clientId]`, calls `clearClientData()`
  - Standard: Updates BPM/calories, client metadata

**Responsibility:**
- Manages dual WebSocket lifecycle, auto-reconnect with exponential backoff
- Reactive maps auto-update UI on every incoming message
- Heartbeat prevents idle timeout; resync requests ensure consistency after reconnect
- Cleanup on disconnect prevents memory leaks and stale data

---

### 3.3 **sessionTimersStore** (`sessionTimerStore.js`)

**State:**
- `timers[clientId]`: Elapsed seconds counter (incremented every 1s)
- `_intervals[clientId]`: JavaScript interval ID (internal, not reactive)

**Key Actions:**
- `startTimerFor(clientId, startIso)`: Initialize timer from backend `start` time, begin 1s interval
- `pauseTimerFor(clientId)`: Stop interval but keep timer value (for pause state)
- `resumeTimerFor(clientId)`: Resume interval from current value
- `stopTimerFor(clientId)`: Stop interval, delete timer data, return final value
- `formatDuration(seconds)`: Format elapsed seconds as `HH:MM:SS` or `MM:SS`
- `clearAllTimers()`: Cleanup all intervals and timers

**Responsibility:**
- Single source of truth for session elapsed time
- Stays in sync with UI pause/resume buttons
- Provides formatted display strings for UI

---

### 3.4 **sessionControlStore** (`sessionControlStore.js`)

**State:**
- `pausedSessions[clientId]`: `true` if paused, `false` if running (or not set)

**Key Actions:**
- `isPaused(clientId)`: Getter returning boolean
- `stopSession(clientId)`: Set paused flag to `true`
- `startSession(clientId)`: Set paused flag to `false`
- `toggleSession(clientId)`: Flip pause state
- `clear(clientId)`: Delete pause flag

**Responsibility:**
- Minimal, UI-focused state: tracks whether pause button shows "Resume" or "Pause"
- Does NOT manage timers or BLE; those stores handle their own lifecycle

---

## 4. Workflow: Step-by-Step

### 4.1 Selecting and Preparing Clients

**Trigger:** User clicks "Select Clients"

**Flow:**
1. `openSelectClientModal()` fetches list of clients **not in an active session** via `getClientsByCoachNotInActiveSession()`
2. User selects client(s) → `selectClient(client)` adds to `selectedClients` array
3. User can remove with `removeClient(client)`

**State:**
- `selectedClients`: Array of client objects awaiting device connection
- `display`: Modal visibility

**Outcome:** Coach has list of clients ready to connect BLE devices

---

### 4.2 Connecting BLE Device (with callbacks & state machine)

**Trigger:** User clicks "Connect Device" for a client

**Flow:**

```
1. connectDevice(client) starts:
   ├─ bleStore.setConnection(clientId, 'connecting')
   ├─ BleClient.initialize()
   ├─ BleClient.requestDevice({services: [Heart Rate Service]})
   │  └─ User picks device from native dialog
   ├─ Device returned, extract deviceId
   ├─ bleStore.setDevice(clientId, deviceId)  ← 🔑 PERSISTENT!
   │
   ├─ BleClient.connect(deviceId, disconnectCallback)
   │  └─ Register callback for unexpected disconnection:
   │     └─ disconnectCallback(deviceId):
   │        ├─ Check if manual disconnect flag set → skip reconnect
   │        └─ else onDeviceDisconnected(clientId, deviceId)
   │           └─ reconnectDevice(clientId, {deviceId})
   │
   ├─ Connection successful → bleStore.setConnection(clientId, 'connected')
   ├─ startHeartRateNotifications(clientId, deviceId)
   │  └─ BleClient.startNotifications(...)
   │  └─ HR callback: parseHeartRate() → bpm
   │     └─ update wsStore.bpmsFromWsCoach[clientId]
   │     └─ if session active & not paused: sendBpmToBackend()
   │
   └─ Read battery → bleStore.setBattery(clientId, %)
```

**State Transitions:**
- `connectionStatus[clientId]`: `disconnected` → `connecting` → `connected`

**Assumption:**
- `toClientId()` utility normalizes client IDs (handles string/number coercion); defined in `utils/id.js` but not shown

**Key Points:**
- **Device ID is stored immediately** after selection (before connect attempt) to enable reconnect
- **Disconnect callback is registered per device** and captures `clientId` context
- **Manual disconnect flag** prevents auto-reconnect when intentional

---

### 4.3 Starting HR Notifications (How BPM flows)

**Trigger:** After successful BLE connection; or after reconnect

**Flow:**

```
startHeartRateNotifications(clientId, deviceId)
├─ Check hrNotifsRunning[`${clientId}:${deviceId}`]
│  └─ if already running, skip
├─ Set hrNotifsRunning flag to true
│
└─ BleClient.startNotifications(deviceId, HR_SERVICE, HR_CHAR, callback)
   └─ On each HR measurement:
      ├─ value: DataView with flags + HR bytes
      ├─ parseHeartRate(value):
      │  ├─ Read flags byte (bit 0: 16-bit or 8-bit)
      │  └─ Extract heart rate: getUint16() or getUint8()
      │  └─ Return bpm (number)
      │
      ├─ wsStore.bpmsFromWsCoach[clientId] = bpm
      │  └─ 🔴 DIRECT UPDATE (not sent via BLE to backend)
      │
      └─ if bleStore.isSessionStarted(clientId) 
         && !sessionControlStore.isPaused(clientId):
         └─ sendBpmToBackend({id: clientId}, bpm, {deviceId}, sessionId)
            └─ REST POST /save-heartbeat
               ├─ payload: { bpm, device_id, seconds, training_session_id, timestamp }
               └─ Backend: store heartbeat, compute calories, broadcast via /ws/bpm/
```

**Data Flow:**
1. **BLE → Front-end only**: BPM parsed locally, stored in `wsStore.bpmsFromWsCoach[clientId]`
2. **To Backend**: Only if session active **and not paused**
3. **From Backend**: Backend computes calories and broadcasts **both BPM + calories** via WebSocket Coach
4. **Coach UI**: Displays from `wsStore.bpmsFromWsCoach[clientId]` and `wsStore.caloriesFromWsCoach[clientId]`

**Critical Detail:**
- If session is paused, **HR notifications continue**, but **backend is not sent BPM**
- Frontend still updates UI `bpmsFromWsCoach` (for disconnect detection, not display)

---

### 4.4 Starting a Training Session (createSession + timers)

**Trigger:** User clicks "Start Session" after device connected and BPM visible

**Precondition:**
- Device connected: `connectionStatus[clientId] === 'connected'`
- HR notifications running
- `sessionsStarted[clientId] === false`

**Flow:**

```
startSession(client)
├─ createSession(clientId)
│  └─ REST POST /create-session
│     ├─ payload: { client_id, start: ISO timestamp, title: 'New session' }
│     └─ response: { id: sessionId, start, ... }
│
├─ sessionId = response.data.id
├─ bleStore.setSessionStarted(clientId, true)
├─ bleStore.setSessionId(clientId, sessionId)
│
├─ activeSessions.value.push({...response.data, client})
├─ removeClient(client) from selectedClients
│
└─ timersStore.startTimerFor(clientId, response.data.start)
   ├─ Compute initial elapsed = now - start time
   └─ Start 1s incrementing interval
```

**State Transitions:**
- `sessionsStarted[clientId]`: `false` → `true`
- `sessionIds[clientId]`: `null` → `sessionId`
- `timers[clientId]`: undefined → elapsed seconds, then increments each 1s
- `pausedSessions[clientId]`: undefined (session just started, not paused)

**UI Result:**
- Timer starts display
- "Start Session" button hidden
- Card moves to "Active training sessions" section
- BPM now sent to backend with `training_session_id`

**Assumption:**
- Backend returns session with correct `start` timestamp in UTC; front-end computes elapsed offset

---

### 4.5 Live Updates Loop (BLE → UI → Backend → WS → UI)

**Continuous Flow (every HR measurement, ~1s for typical heart rate devices):**

```
🔄 LOOP:
├─ [T0: User has 1 active session, device connected, not paused]
│
├─ [BLE Device broadcasts HR every 1s]
│  └─ 72 BPM → Capacitor BLE notif callback
│
├─ [App receives HR notif]
│  ├─ parseHeartRate() → 72 bpm
│  ├─ wsStore.bpmsFromWsCoach[clientId] = 72 ← UI updates **instantly**
│  └─ sendBpmToBackend(client, 72, {deviceId}, sessionId)
│     └─ REST POST /save-heartbeat
│        ├─ Backend: store heartbeat record
│        ├─ Backend: recompute calories = f(all heartbeats so far)
│        └─ Backend: broadcast via WebSocket Coach /ws/bpm/
│
├─ [Coach WebSocket receives update ~0.1–1s after send]
│  ├─ Messages: {
│  │   client_id: clientId,
│  │   bpm: 72,
│  │   current_calories: 245
│  │ }
│  ├─ wsStore.bpmsFromWsCoach[clientId] = 72 ← (redundant, already set)
│  └─ wsStore.caloriesFromWsCoach[clientId] = 245 ← UI updates
│
├─ [Timer increments]
│  └─ timers[clientId] += 1 every 1s (independent of BPM rate)
│
└─ [UI re-renders with latest: BPM=72, calories=245, time=0:15, etc.]
```

**Key Insight:**
- **BPM is set twice**: once from BLE notif callback (instant), once from WS response (eventual consistency)
- **Calories only via WS** (backend computed)
- **Timer driven by local interval**, not backend
- Even if network fails, local BLE BPM + timer visible; calories may lag

---

### 4.6 Pause / Resume Session (what stops, what continues)

**Trigger:** User clicks "Stop session" or "Resume session"

#### **Pause Flow:**

```
toggleSession(session, client)
├─ paused = sessionControlStore.isPaused(clientId)
├─ if paused === true:
│  └─ Resume branch (see below)
│
└─ else (not paused, so PAUSE):
   ├─ pauseTimerFor(clientId)
   │  └─ timersStore: clear interval, keep current value
   │
   ├─ pauseActiveTrainingSession(sessionId)
   │  └─ REST POST /training-session/{sessionId}/pause
   │     └─ Backend: mark session paused, broadcast to Gym WS
   │
   ├─ stopHeartRateNotificationsSafe(clientId, deviceId)
   │  └─ BleClient.stopNotifications(...)
   │  └─ markHrNotifsStopped(clientId, deviceId) ← flag
   │
   └─ sessionControlStore.toggleSession(clientId)
      └─ pausedSessions[clientId] = true
```

**State Transitions:**
- `timers[clientId]`: running → paused (value frozen)
- `pausedSessions[clientId]`: `false` → `true`
- `connectionStatus[clientId]`: unchanged (BLE still connected)

**Server Side (Gym WS):**
- Backend broadcasts `event: 'session_pause'` to Gym socket
- Gym displays pause time

**What Stops:**
- Timer interval
- BLE notifications (no more BPM received)
- BPM sends to backend

**What Continues:**
- BLE connection (device stays connected)
- WS connections (can receive pause confirmations)

#### **Resume Flow:**

```
toggleSession(session, client)
├─ paused = sessionControlStore.isPaused(clientId) === true
│
└─ if paused:
   ├─ resumeActiveTrainingSession(sessionId)
   │  └─ REST POST /training-session/{sessionId}/resume
   │     └─ Backend: mark unpaused, broadcast resume to Gym WS
   │
   ├─ startHeartRateNotifications(clientId, deviceId)
   │  └─ BleClient.startNotifications(...)
   │  └─ hrNotifsRunning[key] = true
   │
   ├─ resumeTimerFor(clientId)
   │  └─ timersStore: restart interval from current value
   │
   └─ sessionControlStore.toggleSession(clientId)
      └─ pausedSessions[clientId] = false
```

**State Transitions:**
- Back to "live" state
- Timer increments again
- BPM updates resume

---

### 4.7 Finish Session (finishSession + cleanup + disconnect)

**Trigger:** User clicks "Finish" button on active session

**Flow:**

```
onFinishSession(client, calories, seconds)
├─ sessionId = bleStore.getSessionId(client.id)
├─ if (!sessionId) return
│
├─ finishSession(sessionId, calories, seconds)
│  └─ REST PATCH /finish-session/{sessionId}
│     ├─ payload: { calories_at_end: calories, seconds: seconds }
│     └─ Backend: mark finished, broadcast to Gym WS
│
├─ timersStore.stopTimerFor(client.id)
│  └─ Clear interval, delete timers[clientId]
│
├─ wsStore.clearClientData(client.id)
│  └─ Delete all maps: bpms, calories, names, etc.
│
├─ bleStore.clearSession(client.id)
│  └─ Delete sessionIds[clientId] and sessionsStarted[clientId]
│
├─ sessionControlStore.clear(client.id)
│  └─ Delete pausedSessions[clientId]
│
├─ disconnectDevice(client)
│  └─ markManualDisconnect(clientId, deviceId)
│  └─ stopHeartRateNotificationsSafe(clientId, deviceId)
│  └─ BleClient.disconnect(deviceId)
│  └─ bleStore.clearManual(clientId)
│  └─ bleStore.setConnection(clientId, 'disconnected')
│  └─ bleStore.removeDevice(clientId)
│  └─ delete wsStore.bpmsFromWsCoach[clientId]
│  └─ delete sessionsStarted[clientId]
│  └─ delete bleStore.connectedDevices[clientId]
│
└─ activeSessions.value = activeSessions.filter(s => s.id !== sessionId)
   └─ Remove from UI list
```

**State Transitions:**
- **Multiple stores reset to initial state**:
  - `connectionStatus[clientId]` → `'disconnected'`
  - `sessionsStarted[clientId]` → deleted
  - `sessionIds[clientId]` → deleted
  - `timers[clientId]` → deleted
  - `pausedSessions[clientId]` → deleted
  - `connectedDevices[clientId]` → deleted
  - `wsStore.*[clientId]` → all deleted

**Cleanup Order Matters:**
1. Finish session (backend state)
2. Stop timer
3. Clear all data stores
4. Manually disconnect BLE (sets flag to prevent auto-reconnect)
5. Remove UI card

**Outcome:**
- Client removed from active sessions
- Device disconnected cleanly
- No reconnect attempt (manual flag)
- All maps cleaned up

---

### 4.8 Force Delete Session (confirm + backend delete + cleanup)

**Trigger:** User clicks "Delete session" → confirms dialog

**Flow:**

```
confirmDelete(client)
├─ confirm.require({ message: '...', ... })
│  └─ User confirms
│
└─ forceDeleteSession(client):
   ├─ sessionId = bleStore.getSessionId(client.id)
   │
   ├─ forceDeleteActiveTrainingSession(sessionId)
   │  └─ REST DELETE /force-delete-training-session/{sessionId}
   │     └─ Backend: hard delete, broadcast to Gym WS
   │
   ├─ timersStore.stopTimerFor(client.id)
   ├─ wsStore.clearClientData(client.id)
   ├─ bleStore.clearSession(client.id)
   ├─ sessionControlStore.clear(client.id)
   ├─ disconnectDevice(client)
   │
   └─ activeSessions.value = activeSessions.filter(...)
```

**Difference from Finish:**
- **Force delete is permanent and immediate** (no grace period)
- **Same cleanup as finish**, but backend physically deletes session

---

### 4.9 App Mount/Unmount Behaviors

#### **onMounted():**

```
onMounted(async () => {
  └─ wsStore.connectCoach()
     └─ Open Coach WebSocket, set resync flag
  
  ├─ getActiveTrainingSessions()
     └─ REST GET /get-active-training-sessions
     └─ Load ongoing sessions (e.g., from previous session)
     └─ activeSessions.value set
  
  └─ Loop through bleStore.connectedDevices:
     ├─ For each stored (clientId, deviceId):
     ├─ safeIsConnected(deviceId)
     │  └─ Check if BLE device still connected at OS level
     │
     └─ (No automatic re-connect attempted here; manual or reconnect logic)
```

**Purpose:**
- Resume WebSocket connection to real-time BPM feed
- Load any sessions that were running before page refresh (recovery)
- Check device connectivity state (diagnostic logging only)

#### **onUnmounted():**

```
onUnmounted(() => {
  └─ Object.keys(_intervals).forEach(k => clearInterval(_intervals[k]))
     └─ Clean up any UI intervals (not store timers)
```

**Purpose:**
- Prevent memory leaks from intervals tied to component lifecycle

**Assumption:**
- WebSocket connections are **intentionally NOT closed** on unmount
- This allows gym displays to keep receiving updates if the coach page goes away
- **Risk:** Multiple tabs opening same page → multiple WebSocket connections

---

## 5. State Machine (explicit)

### 5.1 BLE Connection Status (per client)

```
┌──────────────┐
│ disconnected │ ◄──────────────────────┐
└──────┬───────┘                        │
       │ connectDevice()                │
       ▼                                │
┌──────────────┐                        │
│  connecting  │                        │
└──────┬───────┘                        │
       │ success                        │
       ▼                                │
┌──────────────┐                        │
│  connected   │ ◄────────────────┐     │
└──────┬───────┘                  │     │
       │ unexpected disconnect    │     │
       ▼                          │     │
┌──────────────┐                  │     │
│ reconnecting │                  │     │
└──────┬───────┘                  │     │
       │ reconnect success        │     │
       └─────────────────────────►│     │
              (retry loop)         │     │
                                   │     │
              Manual disconnect   │     │
              or max retries exhausted:
                                   │     │
                                   ▼     │
                          disconnectDevice()
                                   │     │
                                   └─────┴──►[disconnected]
```

**Allowed Transitions:**
- `disconnected → connecting`: `connectDevice()`
- `connecting → connected`: BLE connect succeeds
- `connecting → disconnected`: Connect fails or user aborts
- `connected → reconnecting`: Device disconnects unexpectedly (BLE callback)
- `reconnecting → connected`: Reconnect succeeds
- `reconnecting → disconnected`: Retries exhausted (default: 50 retries) or manual flag
- `connected → disconnected`: `disconnectDevice()` with manual flag
- `reconnecting → disconnected`: `disconnectDevice()` with manual flag

---

### 5.2 Session Lifecycle (per client)

```
┌──────────────┐
│ not_started  │
└──────┬───────┘
       │ startSession()
       │ (REST: POST /create-session)
       ▼
┌──────────────┐
│   started    │ ◄─────────────────────┐
└──────┬───────┘                       │
       │ toggleSession() (pause)       │ resumeActiveTrainingSession()
       │                               │ (REST: POST .../resume)
       ▼                               │
┌──────────────┐                       │
│   paused     │───────────────────────┘
└──────┬───────┘     toggleSession()
       │             (REST: POST .../pause)
       │ finishSession()
       │ or forceDeleteSession()
       ▼
┌──────────────┐
│  finished    │
└──────────────┘
```

**State Transitions:**
- `not_started → started`: `startSession()` succeeds
- `started → paused`: `toggleSession()` → REST PAUSE
- `paused → started`: `toggleSession()` → REST RESUME
- `started → finished`: `onFinishSession()` → REST PATCH /finish-session
- `started → finished`: `forceDeleteSession()` → REST DELETE /force-delete-training-session
- `paused → finished`: `onFinishSession()` or `forceDeleteSession()`

**Cleanup on → finished:**
- Timer stopped
- All data maps cleared
- BLE disconnected (manually flagged)
- UI list updated

---

## 6. Reconnect Logic (BLE)

### 6.1 Reconnect Entry Points

**Entry Point 1: Unexpected Disconnect**
```
BleClient.connect(deviceId, disconnectCallback)
  └─ callback triggered when device disconnects
     └─ onDeviceDisconnected(clientId, deviceId)
        └─ reconnectDevice(clientId, {deviceId}, retries=50)
```

**Entry Point 2: Reconnect Failure Timeout**
```
reconnectDevice()
  └─ BleClient.connect() throws error
     └─ setTimeout(() => reconnectDevice(..., retries-1), 2000)
        └─ Retry after 2s
```

### 6.2 Reconnect Flow

```
reconnectDevice(clientId, {deviceId}, retries=50)
├─ Guard: storedDeviceId = bleStore.getDeviceId(clientId)
│  └─ if (storedDeviceId !== deviceId):
│     └─ abort ("device no longer registered")
│  └─ Reason: User connected new device for same client
│
├─ Guard: isManualDisconnect(clientId, deviceId) === true
│  └─ abort, consume flag, return
│  └─ Reason: User intentionally disconnected
│
├─ Guard: retries <= 0
│  └─ setConnection('disconnected')
│  └─ Log warning, return
│  └─ Reason: Max retries exhausted
│
├─ Guard: safeIsConnected(deviceId) === true
│  └─ return immediately
│  └─ Reason: Device already reconnected
│
├─ setConnection(clientId, 'reconnecting')
├─ Log attempt: "🔄 Trying to reconnect... ({retries} left)"
│
├─ BleClient.connect(deviceId, disconnectCallback):
│  └─ If disconnects again during retry:
│     ├─ markHrNotifsStopped()
│     └─ reconnectDevice(..., retries-1)  ← RECURSIVE
│  └─ If succeeds:
│     ├─ setDevice(clientId, deviceId)
│     ├─ setConnection(clientId, 'connected')
│     ├─ stopHeartRateNotificationsSafe()  ← restart notifications
│     ├─ startHeartRateNotifications()
│     └─ Log "✅ Notifications restarted"
│
└─ If error thrown:
   └─ setTimeout(() => reconnectDevice(..., retries-1), 2000)
      └─ Retry after 2s delay
```

### 6.3 When Reconnect is Aborted

1. **Device not registered** (user switched devices): Abort silently
2. **Manual disconnect flag set**: Consume flag, abort
3. **Max retries reached**: Log warning, set to `disconnected`
4. **Device already connected**: Return (redundant call, benign)

### 6.4 Backoff Strategy for Reconnect

**For BLE (within `reconnectDevice`):**
- Simple fixed backoff: **2000ms** between retry attempts
- No exponential backoff coded; could improve (see Recommendations)
- Max retries: **50** (can connect device ~100 seconds before giving up)

**For WebSocket (in `wsStore`):**
- Exponential backoff: $ms = \min(500 \times 2^{attempt}, 5000)$
  - Attempt 0: 500ms
  - Attempt 1: 1000ms
  - Attempt 2: 2000ms
  - Attempt 3+: capped at 5000ms
- Reset counter on successful connect

### 6.5 Potential Reconnect Issues

**Issue 1: Recursive Reconnect Loop**
- If device keeps disconnecting every ~2s, reconnect will loop indefinitely until max retries
- No "backoff slowdown" during retries

**Issue 2: Manual Flag Cleanup**
- If reconnect fails and timer completes, manual flag may still be set
- Next `connectDevice()` won't auto-reconnect until flag consumed

**Issue 3: Device ID Mismatch**
- If user switches to new device for same client, old device's reconnect guards work correctly (aborts)
- But if old device reconnects **after** new device connected, old reconnect will check `storedDeviceId !== deviceId` and abort

**Issue 4: Session Pause During Reconnect**
- User pauses session
- Device disconnects
- Reconnect starts
- Reconnect completes, HR notifications restarted
- But session is still paused → BPM not sent to backend (correct behavior)

---

## 7. WebSocket Logic

### 7.1 Coach Socket (`/ws/bpm/`)

**Purpose:** Real-time BPM and calorie updates for coach monitoring

**Lifecycle:**

```
connectCoach()
├─ Check if already has ref: if (wsCoach.value) return
│  └─ Prevents duplicate connections
│
├─ fetch token from localStorage
├─ new WebSocket(`${VITE_WS_COACH_URL}?token=${token}`)
│
├─ onopen:
│  ├─ isUserConnected.value = true
│  ├─ coachReconnectAttempts = 0 ← reset
│  ├─ send resync message: {event: 'resync', ts: timestamp}
│  │  └─ Backend to send current state for all active clients
│  └─ startCoachHeartbeat()
│     └─ setInterval(() => send ping, 15s)
│
├─ onmessage:
│  ├─ Parse JSON: {client_id, bpm, current_calories, event, ...}
│  ├─ Ignore if event === 'pong'
│  ├─ Update: bpmsFromWsCoach[client_id] = bpm
│  ├─ Update: caloriesFromWsCoach[client_id] = current_calories
│  └─ Update: client[client_id] = client_id (presence)
│
├─ onclose:
│  ├─ isUserConnected.value = false
│  ├─ stopCoachHeartbeat()
│  ├─ wsCoach.value = null
│  └─ scheduleCoachReconnect()
│     └─ If !coachManualClose, schedule exponential backoff retry
│
└─ onerror:
   └─ Log error (onclose will also fire)

disconnectCoach()
├─ coachManualClose.value = true
├─ clearTimer(coachReconnectTimer)
├─ stopCoachHeartbeat()
├─ wsCoach.value.close()
├─ wsCoach.value = null
└─ coachReconnectAttempts = 0
```

**Message Format (incoming):**
```json
{
  "client_id": 123,
  "bpm": 72,
  "current_calories": 245,
  "timestamp": "2026-03-04T10:30:45Z"
}
```

**Heartbeat (outgoing):**
```json
{
  "event": "ping",
  "ts": 1709532645000
}
```

**Async Resync (outgoing):**
```json
{
  "event": "resync",
  "ts": 1709532645000
}
```

---

### 7.2 Gym Socket (`/ws/gym/`)

**Purpose:** Broadcast initial metadata, pause events, and session finish events to gym displays

**Lifecycle:**

```
connectWholeGym()
├─ Similar to Coach socket
├─ onopen: resync, heartbeat
├─ onclose: reconnect with backoff
│
└─ onmessage:
   ├─ event === 'initial':
   │  ├─ activeClients[client_id] = true
   │  ├─ receivedGymMetadata[client_id] = true
   │  ├─ Extract: started_at, client_name, coach_id, max_heart_rate
   │  └─ Store in respective maps
   │
   ├─ event === 'session_pause':
   │  ├─ pausedByClient[client_id] = data.paused (bool)
   │  ├─ pausedAtByClient[client_id] = new Date(data.paused_at)
   │  ├─ pausedSecondsByClient[client_id] = data.paused_seconds (number)
   │  └─ return (don't process further)
   │
   ├─ event === 'training_session_finished':
   │  ├─ delete activeClients[client_id]
   │  ├─ clearClientData(client_id)  ← cleanup all maps
   │  └─ return
   │
   └─ else (standard heartbeat / BPM+calories):
      ├─ if (client_id):
      │  ├─ Metadata (one-time if !receivedGymMetadata):
      │  │  └─ started_at, client_name, coach_id, max_heart_rate
      │  ├─ Real-time:
      │  │  └─ caloriesForGym[client_id] = current_calories
      │  │  └─ bpmsForGym[client_id] = bpm
      │  └─ client[client_id] presence flag
```

**Message Format (incoming):**
```json
{
  "event": "initial",
  "client_id": 123,
  "client_name": "John Doe",
  "coach_id": 5,
  "max_heart_rate": 180,
  "started_at": "2026-03-04T10:15:00Z",
  "bpm": null,
  "current_calories": null
}

{
  "event": "session_pause",
  "client_id": 123,
  "paused": true,
  "paused_at": "2026-03-04T10:25:30Z",
  "paused_seconds": 600
}

{
  "event": "training_session_finished",
  "client_id": 123
}

{
  "client_id": 123,
  "bpm": 75,
  "current_calories": 260,
  "coach_id": 5,
  "client_name": "John Doe",
  "seconds": 660
}
```

---

### 7.3 Reconnect & Resync

**When & Why Resync:**
- After successful (re)connection
- Backend broadcasts **all current client data** in response
- Prevents coach from missing data during brief disconnects
- Also updates timestamps/metadata

**Resync Message:**
```json
{
  "event": "resync",
  "ts": 1709532645000
}
```

**Backend Response:**
- For each active client, send initial metadata + current BPM + calories
- Gym socket also sends active client list

---

## 8. Data Structures (tables)

### 8.1 Map Keys Used Across Code

| Key Used | Type | Owner Store | Used In | Example |
|----------|------|-------------|---------|---------|
| `clientId` | number | bleStore, wsStore, sessionControl, sessionTimers | All stores, functions | `123` |
| `deviceId` | string | bleStore, bluetooth.js | BLE operations, notifications | `"A1:B2:C3:D4:E5:F6"` |
| `sessionId` | number | bleStore, trainingSessionsService | REST calls, session tracking | `456` |
| `${clientId}:${deviceId}` | string | bluetooth.js (hrNotifsRunning) | HR notification flag | `"123:A1:B2:C3:D4:E5:F6"` |

### 8.2 Reactive Maps

| Map | Owner | Key | Value | Purpose | Cleanup Event |
|-----|-------|-----|-------|---------|---------------|
| `connectionStatus` | bleStore | clientId | string: `"disconnected"`, `"connecting"`, `"connected"`, `"reconnecting"` | BLE connection UI state | `clearSession()`, `removeDevice()` |
| `batteryLevel` | bleStore | clientId | number: 0–100 | Device battery display | Manual disconnect |
| `sessionsStarted` | bleStore | clientId | boolean | Whether session is active | `clearSession()`, disconnect |
| `sessionIds` | bleStore | clientId | number (sessionId) | Current session REST ID | `clearSession()` |
| `connectedDevices` | bleStore | clientId | string (deviceId) | Stored BLE device (for reconnect survival) | `removeDevice()`, disconnect |
| `bpmsFromWsCoach` | wsStore | clientId | number (BPM) | Latest BPM from Coach WS | `clearClientData()` |
| `caloriesFromWsCoach` | wsStore | clientId | number (kcal) | Latest calories from Coach WS | `clearClientData()` |
| `bpmsForGym` | wsStore | clientId | number (BPM) | Latest BPM from Gym WS | `clearClientData()` on finish event |
| `caloriesForGym` | wsStore | clientId | number (kcal) | Latest calories from Gym WS | `clearClientData()` on finish event |
| `timers` | sessionTimersStore | clientId | number (seconds) | Elapsed session time | `stopTimerFor()` |
| `pausedSessions` | sessionControlStore | clientId | boolean | Is session paused? | `clear()` |
| `client_name` | wsStore | clientId | string | Client full name (from Gym WS) | `clearClientData()` |
| `coach` | wsStore | clientId | number (coachId) | Coach ID | `clearClientData()` |
| `startedAt` | wsStore | clientId | Date | Session start timestamp | `clearClientData()` |
| `max_heart_rate` | wsStore | clientId | number | Max HR from Gym WS | `clearClientData()` |
| `receivedGymMetadata` | wsStore | clientId | boolean | Flag to prevent re-processing metadata | `clearClientData()` |
| `pausedByClient` | wsStore | clientId | boolean | Is client paused (Gym broadcast) | `clearClientData()` on finish event |
| `pausedAtByClient` | wsStore | clientId | Date | Pause timestamp (Gym broadcast) | `clearClientData()` on finish event |
| `pausedSecondsByClient` | wsStore | clientId | number | Seconds elapsed at pause (Gym broadcast) | `clearClientData()` on finish event |
| `activeClients` | wsStore | clientId | boolean | Is client active (Gym tracking) | `clearClientData()` on finish event |
| `hrNotifsRunning` | bluetooth.js | `"${clientId}:${deviceId}"` | boolean | Is HR callback registered? | `markHrNotifsStopped()`, `stopHeartRateNotifications()` |

### 8.3 Data Flow through REST Calls

| Endpoint | Method | Client Request | Server Response | Trigger | Uses Maps |
|----------|--------|---|---|---|---|
| `/create-session` | POST | `{client_id, start, title}` | `{id, start, ...}` | startSession | → sessionIds[clientId] |
| `/finish-session/{id}` | PATCH | `{calories_at_end, seconds}` | `{...}` | onFinishSession | (uses sessionIds to lookup) |
| `/force-delete-training-session/{id}` | DELETE | — | `{...}` | forceDeleteSession | (uses sessionIds to lookup) |
| `/training-session/{id}/pause` | POST | — | `{...}` | toggleSession (pause) | (uses sessionIds) |
| `/training-session/{id}/resume` | POST | — | `{...}` | toggleSession (resume) | (uses sessionIds) |
| `/save-heartbeat` | POST | `{bpm, device_id, seconds, training_session_id, timestamp}` | — | HR notif callback | (backend uses sessionIds) |
| `/get-active-training-sessions` | GET | — | Array of {id, start, client, ...} | onMounted | → activeSessions[] |

---

## 9. Edge Cases & Failure Modes

### 9.1 Duplicate BPM Notifications

**Scenario:** BLE notif callback updates `bpmsFromWsCoach[clientId]`, then WebSocket message also updates the same key with same/similar value.

**Impact:** Minor. UI re-renders twice, but same value.

**Mitigation:** App accepts redundancy. If stricter dedup needed, store last received `{bpm, ts}` and compare.

---

### 9.2 Disconnect During Pause

**Scenario:** User pauses session. Device disconnects. Reconnect attempts to restart HR notifications. Session stays paused, BPM not sent to backend.

**Impact:** No data loss. HR notifications run but backend not updated. If user resumes, it works.

**Mitigation:** Current design handles correctly. Resume flow restarts notifications.

---

### 9.3 Finish Session While Reconnecting

**Scenario:** Device connects, session starts. Device disconnects. Reconnect retrying (retries < 50). User clicks "Finish" before reconnect succeeds.

**Flow:**
1. User clicks "Finish"
2. `finishSession()` REST call succeeds
3. Timer stopped
4. `disconnectDevice()` called with manual flag → reconnect will abort

**Impact:** Session marked finished on backend. Reconnect aborts (manual flag prevents loop). Clean.

**Potential Issue:** If REST call fails (network error), session not marked finished, but app cleanup happens anyway. Session stays "orphaned" on server.

---

### 9.4 Switching Device for Same Client

**Scenario:** User connects Device A for Client 1. Later, clicks "Connect Device" again → chooses Device B for Client 1.

**Flow:**
1. Device A still connected, HR notifying
2. `connectDevice()` for Device A: device already storing in `connectedDevices[1]`
3. User picks Device B in native dialog
4. `bleStore.setDevice(1, deviceB)`  ← **overwrites Device A**
5. `BleClient.connect(deviceB)` succeeds
6. Start HR notifications for Device B
7. Device A still connected at OS level, but app no longer using it

**Impact:**
- Device A orphaned (background connection, wasting power)
- Reconnect for Device A won't trigger (device ID no longer stored)
- If Device B disconnect → reconnect will attempt Device B ✓

**Mitigation:** Could disconnect Device A first, but current code doesn't. Minor cleanup issue.

---

### 9.5 WebSocket Reconnect Causing Stale Data

**Scenario:** Coach socket disconnects for 10 seconds. Reconnect succeeds. Coach sends resync. But backend state changed (e.g., pause event) during disconnect.

**Flow:**
1. Coach WS closes
2. Coach sends pause event (server-side) but coach app doesn't see it
3. Coach WS reconnects
4. Coach sends resync
5. Backend returns current metadata (including pause flag)

**Impact:** Brief inconsistency, but resync heals it.

**Mitigation:** resync message ensures coach gets latest state after reconnect.

---

### 9.6 Deleting Keys from Reactive Objects

**Scenario:** `delete wsStore.bpmsFromWsCoach[clientId]` in some cleanup flow.

**Potential Issue (now fixed in code):** If Pinia or Vue 3 reactivity doesn't track deletion, UI may not update. Old map value lingers.

**Current mitigation:** `clearClientData()` uses explicit delete, which Vue 3 Proxy handles correctly.

---

### 9.7 Multiple Clients, Multiple Devices Simultaneously

**Scenario:** 5 clients, 5 devices, 150+ HR measurements/second, 2 WS connections, 5 timers, 5 pause flags.

**State Complexity:** 
- `connectionStatus`: 5 entries
- `timers`: 5 intervals running
- `hsNotifsRunning`: 5 keys (`"clientId:deviceId"`)
- `bpmsFromWsCoach`: 5 entries (updated ~60–150 times/sec)

**Potential Issues:**
1. **BLE notification callback executes while UI re-rendering** → potential race
   - *Mitigation:* Vue 3's Proxy handles concurrent updates correctly.
2. **Timer interval fires while pauseTimerFor executing** → race
   - *Mitigation:* Interval checks `if (_intervals[id])` before clearing; benign.
3. **Two reconnect attempts for same device** (double-connect)
   - *Mitigation:* `reconnectDevice()` checks `storedDeviceId` and returns early.
4. **Memory usage** → 5 × intervals + 10 × maps + BLE callbacks
   - *Mitigation:* Cleanup on finish/delete removes all maps.

**Bottom Line:** Design handles multiple clients well, but no explicit stress testing documented.

---

### 9.8 Manual Disconnect Flag Zombie State

**Scenario:** User clicks "Disconnect Device". Manual flag set. BleClient.disconnect() called. Device actually disconnects. Disconnect callback fired.

**Flow:**
1. `disconnectDevice()` calls `markManualDisconnect(clientId, deviceId)`
2. `BleClient.disconnect(deviceId)` called
3. Device OS disconnects
4. BLE callback `(disconnectedDeviceId) => { ... }` fired
5. Check: `isManualDisconnect(clientId, disconnectedDeviceId)` → true
6. `consumeManualDisconnect()` called, flag deleted

**Outcome:** Clean.

**Risk:** If `consumeManualDisconnect()` not called (code path skipped), flag stays forever. New device connections won't auto-reconnect.

**Mitigation:** Code is consistent; flag consumed correctly.

---

### 9.9 Session Started Before HR Notifications Ready

**Scenario:** User clicks "Start Session" immediately after connect, before HR notif callback is wired up.

**Flow:**
1. `connectDevice()` in progress
2. User immediately clicks "Start Session"
3. `startSession()` REST call succeeds, sessionId assigned
4. HR notif callback finally registered
5. First BPM arrives

**Impact:** Session created. First BPM updates `bpmsFromWsCoach[clientId]`. Sent to backend. OK.

**Mitigation:** UI enforces: "Start Session" button only visible if `connectionStatus[clientId] === 'connected'`, so timing unlikely.

---

### 9.10 Backend Offline / Network Failure

**Scenario:** BLE connected, HR notifying. REST server down or network unreachable.

**Flow:**
1. BLE notif callback: `sendBpmToBackend()` → POST /save-heartbeat fails
2. Error logged; app continues
3. Local `bpmsFromWsCoach[clientId]` updated (from BLE)
4. Calories not received (backend down)
5. Timer continues incrementing

**Impact:**
- BPM visible (from BLE, not backend confirmed)
- Calories frozen or 0
- Session created (if REST succeeded)

**Mitigation:** App handles this gracefully. No blocker.

---

### 9.11 **Manual Disconnect Flag Lost on Component Unmount/Remount** ⚠️ CRITICAL BUG

**Scenario (the bug you found!):**
1. User connects device, starts session
2. Coach finishes session → `markManualDisconnect()` flag set
3. `BleClient.disconnect()` called (but may fail or be slow)
4. Coach navigates to another page → CoachTvPreview **unmounts**
5. Coach returns to CoachTvPreview → component **remounts**
6. `manualDisconnects = reactive({})` is **NEW, EMPTY**
7. Device still physically connected at OS level (disconnect callback still registered, old flag lost)
8. If device spontaneously disconnects, BLE callback fires:
   ```javascript
   // Old callback closure:
   (disconnectedDeviceId) => {
       if (isManualDisconnect(clientId, disconnectedDeviceId)) {  // ← FALSE! Flag lost!
           consumeManualDisconnect(...);
           return;
       }
       // ← Should NOT reach here, but does:
       reconnectDevice(clientId, {deviceId: disconnectedDeviceId}, 50);  // ❌ Wrong!
   }
   ```
9. App thinks it's "unexpected disconnect" → starts reconnect retry loop (50 retries)
10. **Bug**: User sees device status: `reconnecting... reconnecting... reconnecting...` even though session already finished

**Root Cause:**
- `manualDisconnects` is stored in **component-level `reactive({})`**
- BLE callbacks are Capacitor closures registered at **OS level**
- When component unmounts, closures remain registered but refer to **stale/garbage component state**
- When component remounts, new `manualDisconnects` object created → old closure sees empty object
- Race condition between disconnect callback and state management

**Why it matters (P0, CRITICAL):**
- **Silent data corruption**: App state diverges from actual device state
- **Confusing UX**: Device appears "reconnecting" when user already finished the session
- **Battery drain**: Unnecessary 50 reconnect attempts (50 × retry backoff)
- **Misleading logs**: "Unexpected disconnect" when it was intentional
- **Session management failure**: UI says session is finished, but BLE thinks device is active

**The FIX:** See **P0.6** below for complete code solution.

---

## 10. Recommended Improvements (prioritized)

### **P0: Correctness / Data Loss / Infinite Loops**

#### P0.1 **Explicit Transaction: Session Finish**

**Problem:**
```javascript
await finishSession(...)  // ← fails here
timersStore.stopTimerFor(...)
wsStore.clearClientData(...)
```
If REST call fails, cleanup still happens. Session orphaned on server, but app state reset.

**Why it matters:** 
- Lost session on audit trail
- Coach may retry finish, but app already cleaned up

**Suggestion:**
```javascript
async function onFinishSession(client, calories, seconds) {
  try {
    const sessionId = bleStore.getSessionId(client.id);
    
    // CRITICAL: Finish first, or abort
    const response = await finishSession(sessionId, calories, seconds);
    if (!response?.data?.id) {
      throw new Error('Backend did not confirm finish');
    }
    
    // Only then cleanup
    timersStore.stopTimerFor(client.id);
    wsStore.clearClientData(client.id);
    bleStore.clearSession(client.id);
    sessionControlStore.clear(client.id);
    disconnectDevice(client);
    
    activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId);
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Failed to finish session', detail: err.message });
    // Do NOT cleanup; retry later
  }
}
```

---

#### P0.2 **BLE Reconnect: Exponential Backoff (not fixed 2s)**

**Problem:**
```javascript
setTimeout(() => reconnectDevice(..., retries-1), 2000);
```
Fixed 2s backoff → if device keeps failing, reconnect storms the BLE stack and battery.

**Suggestion:**
```javascript
// In bluetooth.js or CoachTvPreview
const bltBackoffMs = (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000);
// Attempt 0: 1000ms, 1: 2000ms, 2: 4000ms, 3: 8000ms, ... capped at 30s

async function reconnectDevice(..., retries=50, attempt=0) {
  // ... guards ...
  
  try {
    await BleClient.connect(...);
    // ... success path ...
  } catch (err) {
    const waitMs = bltBackoffMs(attempt);
    setTimeout(() => reconnectDevice(..., retries-1, attempt+1), waitMs);
  }
}
```

---

#### P0.3 **Pause BPM Send: Guard Against Sending While Paused**

**Problem:**
```javascript
// bluetooth.js
if (bleStore.isSessionStarted(clientId) && !sessionControlStore.isPaused(clientId)) {
  sendBpmToBackend(...);
}
```
Logic is correct, but **no retry if paused state flickers**. Edge case: pause() call delayed, BPM sent.

**Suggestion:**
```javascript
// Add server-side idempotency: include BPM timestamp + attempt ID
export async function sendBpmToBackend(client, bpm, device, sessionId) {
  try {
    const attemptId = `${sessionId}:${clientId}:${Date.now()}`;
    
    const response = await api_heart.post('/save-heartbeat', {
      bpm,
      device_id: device.name || device.deviceId || 'unknown',
      seconds: timersStore.timers[client.id] || 0,
      training_session_id: sessionId,
      timestamp: new Date().toISOString(),
      // NEW: Dedup key
      attempt_id: attemptId
    });
    
  } catch (err) {
    // Only log; don't throw (don't block notif callback)
    console.error('BPM send failed:', err.message);
  }
}
```
Backend must deduplicate using `attempt_id`.

---

#### P0.4 **WebSocket Manual Close Flag Race**

**Problem:**
```javascript
function scheduleCoachReconnect() {
  if (coachManualClose.value) return;  // ← race!
  if (wsCoach.value) return;
  
  // ... schedule ...
}
```
If `disconnectCoach()` called after close but before reconnect scheduled, flag works. But if called during schedule, timing matters.

**Suggestion:**
```javascript
function scheduleCoachReconnect() {
  if (coachManualClose.value) return;
  if (wsCoach.value && wsCoach.value.readyState === WebSocket.OPEN) {
    return;  // Still open, don't reconnect
  }
  
  // Double-check before scheduling
  if (coachManualClose.value) return;  // ← race guard
  
  const wait = computeBackoffMs(coachReconnectAttempts.value);
  coachReconnectAttempts.value += 1;
  
  coachReconnectTimer = clearTimer(coachReconnectTimer);
  coachReconnectTimer = setTimeout(() => {
    if (!coachManualClose.value) connectCoach();  // ← final guard
  }, wait);
}
```

---

#### P0.5 **DeviceId Type Safety**

**Problem:**
```javascript
// BLE device IDs are strings: "A1:B2:C3..."
// clientIds are numbers: 123
// But reactive maps keyed by clientId are polymorphic
```
If `toClientId()` is inconsistent (sometimes returns `"123"`, sometimes `123`), map lookup fails.

**Suggestion:**
```javascript
// In utils/id.js
export function toClientId(raw) {
  const n = Number(raw);
  if (isNaN(n)) return null;
  return n;  // Always return number
}

// In bleStore actions, validate input:
setConnection(clientId, status) {
  const id = toClientId(clientId);
  if (id === null || status == null) {
    console.warn(`setConnection: invalid args`, { clientId, id, status });
    return;
  }
  this.connectionStatus[id] = status;
}
```

---

#### P0.6 **CRITICAL: Manual Disconnect Flag Lost on Component Unmount/Remount**

**Problem (the one you found! 🎯):**

Manual disconnect flag is stored in **component-level** `reactive({})`:
```javascript
// CoachTvPreview.vue
const manualDisconnects = reactive({});  // ← Thrown away on unmount!
```

**Failure Scenario:**
1. User connects device, starts session
2. Coach clicks "Finish Session" → `markManualDisconnect(clientId, deviceId)` sets flag
3. `BleClient.disconnect(deviceId)` called (but may fail or be slow)
4. CoachTvPreview component unmounts (user navigates away)
5. Component remounts (user returns to Coach TV)
6. `manualDisconnects = reactive({})` is a **NEW, EMPTY object**
7. Device is still physically connected at OS level (disconnect failed or callback still pending)
8. If device spontaneously disconnects now, the BLE callback fires:
   ```javascript
   await BleClient.connect(deviceId, (disconnectedDeviceId) => {
       if (isManualDisconnect(clientId, disconnectedDeviceId)) {  // ← FALSE now! Flag lost!
           consumeManualDisconnect(...);
           return;
       }
       
       // ← Takes this path (wrong!)
       markHrNotifsStopped(clientId, disconnectedDeviceId);
       reconnectDevice(clientId, {deviceId: disconnectedDeviceId}, 50);
   });
   ```
9. App thinks it's "unexpected disconnect" → starts reconnect retry loop
10. User sees device status flicker "reconnecting... reconnecting..." even though they already finished

**Why it happens:**
- BLE callbacks registered in `BleClient.connect()` are closures that capture component state
- When component unmounts, those closures **remain registered at OS level** (they're Capacitor plugin references)
- When component remounts, new `manualDisconnects` object is created
- Old closure still refers to old (garbage-collected) `manualDisconnects` → always sees empty

**Why it matters (P0, not P1):**
- **Silent data corruption**: User thinks device is disconnected, but app keeps trying to reconnect
- **Battery drain**: Unnecessary reconnect loop on device
- **Confusing UX**: Device shows "reconnecting..." when it should be "disconnected"
- **Potential double-reconnect**: App tries to reconnect even after session properly finished

**Suggestion (store flag in Pinia, not component):**

```javascript
// 1. Add persistent flag to bleStore
// useBleStore.js
export const useBleStore = defineStore('ble', {
  state: () => ({
    // ... existing state ...
    manualDisconnects: {},  // ← Move here! { clientId: { deviceId: true } }
  }),
  
  actions: {
    markManualDisconnect(clientId, deviceId) {
      const id = toClientId(clientId);
      if (id == null) return;
      if (!this.manualDisconnects[id]) this.manualDisconnects[id] = {};
      this.manualDisconnects[id][deviceId] = true;
    },
    
    isManualDisconnect(clientId, deviceId) {
      const id = toClientId(clientId);
      if (id == null) return false;
      return !!this.manualDisconnects[id]?.[deviceId];
    },
    
    consumeManualDisconnect(clientId, deviceId) {
      const id = toClientId(clientId);
      if (id == null) return;
      if (this.manualDisconnects[id]) {
        delete this.manualDisconnects[id][deviceId];
        if (Object.keys(this.manualDisconnects[id]).length === 0) {
          delete this.manualDisconnects[id];
        }
      }
    },
    
    clearAllManualDisconnects(clientId) {
      const id = toClientId(clientId);
      if (id == null) return;
      delete this.manualDisconnects[id];
    }
  }
});

// 2. Update bluetooth.js to use bleStore
// bluetooth.js
import { useBleStore } from '@/store/useBleStore.js';
const bleStore = useBleStore();

async function startHeartRateNotifications(clientId, deviceId) {
  const key = notifKey(clientId, deviceId);
  if (hrNotifsRunning[key]) return;
  
  hrNotifsRunning[key] = true;
  
  try {
    await BleClient.startNotifications(
      deviceId,
      HEART_RATE_SERVICE,
      HEART_RATE_MEASUREMENT_CHARACTERISTIC,
      (value) => {
        const bpm = parseHeartRate(value);
        wsStore.bpmsFromWsCoach[clientId] = bpm;
        
        if (bleStore.isSessionStarted(clientId) && !sessionControlStore.isPaused(clientId)) {
          sendBpmToBackend({ id: clientId }, bpm, { deviceId }, bleStore.getSessionId(clientId));
        }
      }
    );
    console.log("▶️ HR notifications started:", key);
  } catch (e) {
    hrNotifsRunning[key] = false;
    throw e;
  }
}

// 3. In CoachTvPreview, use bleStore methods instead of component state
// Before (WRONG):
function markManualDisconnect(clientId, deviceId) {
  if (!manualDisconnects[clientId]) manualDisconnects[clientId] = {};
  manualDisconnects[clientId][deviceId] = true;
}

function isManualDisconnect(clientId, deviceId) {
  return !!manualDisconnects[clientId]?.[deviceId];
}

// After (CORRECT):
const { markManualDisconnect, isManualDisconnect, consumeManualDisconnect } = bleStore;

// 4. In disconnectDevice(), use bleStore instead of component function:
async function disconnectDevice(client) {
  const clientId = client.id;
  const deviceId = bleStore.getDeviceId(clientId);
  if (!deviceId) return;

  bleStore.markManualDisconnect(clientId, deviceId);  // ← From store now!

  try {
    await stopHeartRateNotificationsSafe(clientId, deviceId);
    await BleClient.disconnect(deviceId);
    const stillConnected = await safeIsConnected(deviceId);
    console.log(`After disconnect isConnected(${deviceId}):`, stillConnected);
  } catch (err) {
    console.warn('Disconnect failed:', err?.message || err);
  } finally {
    bleStore.clearManual(clientId);
    bleStore.setConnection(clientId, 'disconnected');
    bleStore.removeDevice(clientId);
    delete wsStore.bpmsFromWsCoach[clientId];
    delete sessionsStarted[clientId];
    delete bleStore.connectedDevices[clientId];
  }
}

// 5. In BLE callback (connectDevice), use bleStore methods:
await BleClient.connect(device.deviceId, (disconnectedDeviceId) => {
    console.warn(`⚠️ Device disconnected:`, disconnectedDeviceId);

    markHrNotifsStopped(client.id, disconnectedDeviceId);
    
    // ← Use bleStore methods (persist across unmount)
    if (bleStore.isManualDisconnect(client.id, disconnectedDeviceId)) {
        console.log(`ℹ️ Manual disconnect for client ${client.id}.`);
        bleStore.consumeManualDisconnect(client.id, disconnectedDeviceId);
        return;
    }

    console.warn(`⚠️ Unexpected disconnect, reconnecting...`);
    onDeviceDisconnected(client.id, disconnectedDeviceId);
});
```

**Benefits:**
- Manual flag survives component unmount/remount
- BLE callbacks can always read current state (not stale closures)
- Reconnect logic only triggers on **true** unexpected disconnects
- No more "ghost reconnects" after finish session

**Additional Guards:**
```javascript
// Also add this to onMounted() to clean stale flags:
onMounted(async () => {
  // Clear any orphaned manual disconnect flags for devices no longer stored
  for (const [clientIdRaw] of Object.entries(bleStore.manualDisconnects)) {
    const clientId = Number(clientIdRaw);
    const storedDevice = bleStore.getDeviceId(clientId);
    
    if (!storedDevice) {
      // Device no longer registered, clear flag
      bleStore.clearAllManualDisconnects(clientId);
      console.log(`Cleared orphaned manual disconnect flag for client ${clientId}`);
    }
  }
});
```

---

### **P1: Reliability / Reconnection Strategy / Idempotency**

#### P1.1 **BLE Device Persistence Across Tab Refresh**

**Problem:**
App stores `connectedDevices[clientId] = deviceId`, but if user refreshes browser, OS BLE handle on the device side becomes stale.

**Why it matters:** Next reconnect attempts to use old handle, which may fail.

**Suggestion:**
```javascript
// On mount, validate each stored device
onMounted(async () => {
  for (const [clientIdRaw, deviceId] of Object.entries(bleStore.connectedDevices)) {
    const clientId = Number(clientIdRaw);
    
    try {
      const isConnected = await safeIsConnected(deviceId);
      if (!isConnected) {
        console.log(`Device ${deviceId} no longer connected at boot. Removing.`);
        bleStore.removeDevice(clientId);
        bleStore.setConnection(clientId, 'disconnected');
      } else {
        console.log(`Device ${deviceId} still connected. Auto-reconnect skipped; manual restart required.`);
      }
    } catch (err) {
      console.warn(`Boot validation failed for ${deviceId}:`, err.message);
      bleStore.removeDevice(clientId);
    }
  }
});
```

---

#### P1.2 **WebSocket Heartbeat Ping Sends But Server Drops Pong**

**Problem:**
```javascript
// Coach sends ping every 15s
// Server may ignore or not send pong
// Client never detects stale socket
```

**Suggestion:**
```javascript
// In wsStore
let coachHeartbeatMissed = 0;
const HEARTBEAT_TIMEOUT_MS = 20000;  // Expect pong within 20s

function startCoachHeartbeat() {
  coachHeartbeatTimer = clearIntervalSafe(coachHeartbeatTimer);
  coachHeartbeatTimer = setInterval(() => {
    if (!wsCoach.value || wsCoach.value.readyState !== WebSocket.OPEN) return;
    
    coachHeartbeatMissed += 1;
    if (coachHeartbeatMissed > 2) {
      console.warn('Heartbeat missed 2+ times. Closing WS to force reconnect.');
      wsCoach.value.close();
      return;
    }
    
    wsCoach.value.send(JSON.stringify({ event: 'ping', ts: Date.now() }));
  }, HEARTBEAT_INTERVAL_MS);
}

// In onmessage:
if (data.event === 'pong') {
  coachHeartbeatMissed = 0;  // Reset
  return;
}
```

---

#### P1.3 **Session Pause State Sync: Gym WS vs Client**

**Problem:**
- Client pause state stored in `sessionControlStore.pausedSessions[clientId]`
- Gym pause state stored in `wsStore.pausedByClient[clientId]`
- Both may diverge if WS delayed or lost

**Suggestion:**
```javascript
// On Gym socket 'session_pause' event, also update sessionControlStore
if (data.event === 'session_pause') {
  pausedByClient[data.client_id] = !!data.paused;
  
  // SYNC with app state
  if (data.paused) {
    sessionControlStore.stopSession(data.client_id);
  } else {
    sessionControlStore.startSession(data.client_id);
  }
  
  return;
}
```
Ensures UI pause button reflects both client and gym intent.

---

#### P1.4 **Gym Socket Finish Event: Clear Data + Session**

**Problem:**
```javascript
if (data.event === 'training_session_finished') {
  delete activeClients[data.client_id];
  clearClientData(data.client_id);
  return;
}
```
If finish received via Gym WS but user hasn't manually finished on coach side, client's session card stays visible.

**Suggestion:**
```javascript
if (data.event === 'training_session_finished') {
  delete activeClients[data.client_id];
  clearClientData(data.client_id);
  
  // Also clear session in UI (if coach app is viewing same client)
  // This requires link from Gym WS to CoachTvPreview component
  // Emit event or dispatch Pinia action
  
  // Workaround: Coach side listens for 'finish' event on Gym WS
  // and removes from activeSessions[]
  
  return;
}
```

---

#### P1.5 **Manual Disconnect Flag Cleanup Timer**

**Problem:**
Manual disconnect flag consumed on device disconnect. But if device never disconnects (edge case), flag lingers.

**Suggestion:**
```javascript
function markManualDisconnect(clientId, deviceId) {
  if (!manualDisconnects[clientId]) manualDisconnects[clientId] = {};
  manualDisconnects[clientId][deviceId] = true;
  
  // Auto-cleanup timer: if disconnect doesn't fire within 5s, clear flag
  setTimeout(() => {
    if (isManualDisconnect(clientId, deviceId)) {
      console.warn(`Manual disconnect flag not consumed within 5s. Clearing.`);
      consumeManualDisconnect(clientId, deviceId);
    }
  }, 5000);
}
```

---

### **P2: Code Quality / Refactors / Readability**

#### P2.1 **Extract BLE Reconnect Logic to Separate Service**

**Problem:**
`reconnectDevice()` is mixed into component; 100+ lines of complex logic.

**Suggestion:**
```javascript
// services/bleReconnectService.js
export function useBleReconnectService() {
  const bleStore = useBleStore();
  
  async function attemptReconnect(clientId, deviceId, options = {}) {
    const { timeout = 2000, maxRetries = 50, retryAttempt = 0 } = options;
    
    // All reconnect logic extracted here
    // Returns: { success, message }
  }
  
  return { attemptReconnect };
}

// In component:
import { useBleReconnectService } from '@/services/bleReconnectService.js';
const { attemptReconnect } = useBleReconnectService();

// Later:
const result = await attemptReconnect(clientId, deviceId);
```

---

#### P2.2 **Type Definitions / Interfaces**

**Problem:**
No TypeScript; map structures and function signatures are implicit.

**Suggestion:**
```javascript
// types/training.d.js (JSDoc)

/**
 * @typedef {Object} ClientSession
 * @property {number} clientId
 * @property {string} deviceId
 * @property {number} sessionId
 * @property {string} connectionStatus - 'connected' | 'disconnected' | 'reconnecting'
 * @property {boolean} isPaused
 * @property {number} elapsedSeconds
 */

/**
 * @typedef {Object} BleHRNotification
 * @property {number} bpm
 * @property {number} timestamp
 */
```

---

#### P2.3 **Separate Concerns: BLE vs WebSocket**

**Problem:**
`bluetooth.js` imports `wsStore`, `bleStore`, `sessionControlStore`. Circular dependencies risk.

**Suggestion:**
```javascript
// bluetooth.js: Pure BLE logic
export async function startHeartRateNotifications(clientId, deviceId, onHeartRate) {
  await BleClient.startNotifications(..., (value) => {
    const bpm = parseHeartRate(value);
    onHeartRate({ clientId, deviceId, bpm, timestamp: Date.now() });
  });
}

// In component/service: Wire up dependencies
startHeartRateNotifications(clientId, deviceId, ({ bpm, clientId }) => {
  wsStore.bpmsFromWsCoach[clientId] = bpm;
  if (shouldSend) sendBpmToBackend(...);
});
```

---

#### P2.4 **Logging Strategy: Structured Logs**

**Problem:**
Logs use emoji + text strings; hard to parse/analyze.

**Suggestion:**
```javascript
// utils/logger.js
export const log = {
  info: (module, action, data) => {
    console.log(`[${module}] ${action}`, data);
  },
  warn: (module, action, error) => {
    console.warn(`[${module}] ${action}`, error);
  },
  error: (module, action, error) => {
    console.error(`[${module}] ${action}`, error);
  }
};

// Usage:
log.info('BLE', 'reconnect_start', { clientId, deviceId, attempt: 5 });
log.error('WS', 'coach_message_parse_failed', { raw: data, err: e.message });
```

---

#### P2.5 **Unit Tests (suggested)**

**Problem:**
No tests visible.

**Suggestion:**
```javascript
// tests/unit/parseHeartRate.spec.js
import { parseHeartRate } from '@/utils/bluetooth.js';

describe('parseHeartRate', () => {
  it('should parse 8-bit HR (flags & 0x1 === 0)', () => {
    const dv = new DataView(new Uint8Array([0x00, 0x48]).buffer);  // flags=0, HR=72
    expect(parseHeartRate(dv)).toBe(72);
  });
  
  it('should parse 16-bit HR (flags & 0x1 === 1)', () => {
    const dv = new DataView(new Uint8Array([0x01, 0x48, 0x00]).buffer);  // flags=1, HR=72
    expect(parseHeartRate(dv)).toBe(72);
  });
});

// tests/unit/wsStore.spec.js
import { webSocketStore } from '@/store/webSocketStore';

describe('wsStore', () => {
  it('should initialize with empty maps', () => {
    const store = webSocketStore();
    expect(store.bpmsFromWsCoach).toEqual({});
    expect(store.caloriesFromWsCoach).toEqual({});
  });
  
  it('should clear client data on clearClientData()', () => {
    const store = webSocketStore();
    store.bpmsFromWsCoach[123] = 75;
    store.caloriesFromWsCoach[123] = 250;
    
    store.clearClientData(123);
    
    expect(store.bpmsFromWsCoach[123]).toBeUndefined();
    expect(store.caloriesFromWsCoach[123]).toBeUndefined();
  });
});
```

---

## 11. Suggested Logging & Metrics

### 11.1 Where to Log

| Component | Event | Log Level | Format |
|-----------|-------|-----------|--------|
| **CoachTvPreview** | openSelectClientModal | INFO | `"✅ Fetched N clients"` |
| **BLE** | connectDevice START | INFO | `"Initializing BLE for client ${id}"` |
| **BLE** | connectDevice SUCCESS | INFO | `"✅ Connected device ${deviceId}"` |
| **BLE** | connectDevice FAIL | ERROR | `"❌ Connect failed: ${err.message}"` |
| **BLE** | startHeartRateNotifications | INFO | `"▶️ HR notifs started: ${key}"` |
| **BLE** | onHeartRate | DEBUG | `{clientId, bpm, deviceId}` (high volume) |
| **BLE** | disconnectCallback | WARN | `"⚠️ Device ${deviceId} disconnected for client ${clientId}"` |
| **BLE** | reconnectDevice ATTEMPT | INFO | `"🔄 Reconnect attempt ${attempt}/${maxRetries} for ${clientId}"` |
| **BLE** | reconnectDevice SUCCESS | INFO | `"✅ Reconnected ${clientId}"` |
| **BLE** | reconnectDevice ABORT | WARN | `"🛑 Reconnect aborted: ${reason}"` |
| **WebSocket** | connectCoach | INFO | `"✅ Coach WS connected"` |
| **WebSocket** | connectCoach FAIL | ERROR | `"❌ Coach WS error: ${code} ${reason}"` |
| **WebSocket** | Coach onmessage | DEBUG | `{clientId, bpm, calories}` (high volume) |
| **WebSocket** | Gym `'session_pause'` event | INFO | `"⏸ Session paused for ${clientId}"` |
| **WebSocket** | Gym `'training_session_finished'` event | INFO | `"🏁 Session finished for ${clientId}"` |
| **Session** | startSession | INFO | `"✅ Session ${sessionId} started for client ${clientId}"` |
| **Session** | finishSession | INFO | `"✅ Session ${sessionId} finished, calories=${cal}, seconds=${sec}"` |
| **Session** | finishSession FAIL | ERROR | `"❌ Finish failed: ${err.message}"` |
| **Session** | forceDeleteSession | WARN | `"🗑️ Session ${sessionId} force-deleted for ${clientId}"` |
| **Service** | sendBpmToBackend | DEBUG | `{clientId, bpm, sessionId, ts}` (high volume) |
| **Service** | sendBpmToBackend FAIL | WARN | `"⚠️ BPM send failed: ${err.message}"` |
| **Timer** | startTimerFor | INFO | `"⏱️ Timer started for ${clientId}, initial=${elapsed}s"` |
| **Timer** | pauseTimerFor | INFO | `"⏸️ Timer paused for ${clientId}, value=${timers[id]}s"` |
| **Timer** | resumeTimerFor | INFO | `"▶️ Timer resumed for ${clientId}"` |

### 11.2 Metrics to Collect

```javascript
// metrics/training.js
export const metrics = {
  // Per-session
  sessionStartTime: {},          // { sessionId: timestamp }
  sessionFinishTime: {},         // { sessionId: timestamp }
  heartbeatsSent: {},            // { sessionId: count }
  heartbeatsFailed: {},          // { sessionId: count }
  
  // Per-client
  bleConnectAttempts: {},        // { clientId: count }
  bleReconnectAttempts: {},      // { clientId: count }
  bleReconnectSuccesses: {},     // { clientId: count }
  
  // Global
  wsCoachReconnections: 0,
  wsGymReconnections: 0,
  avgBpmLatencyMs: [],           // Rolling array of (BLE recv → backend send) times
};
```

### 11.3 Metrics to Display (Optional Gym TV)

```javascript
// For coach admin dashboard
{
  averageSessionDuration: "45 min",
  totalSessionsToday: 12,
  activeClientsNow: 5,
  wsCoachHealth: "✅ connected",
  wsGymHealth: "✅ connected",
  avgHeartbeatLatency: "250ms",
  ableReconnectRate: "98%",
}
```

---

## 12. Testing Plan

### 12.1 Unit Tests

#### Test: `parseHeartRate()`
```javascript
// bluetooth.spec.js
describe('parseHeartRate', () => {
  test('should parse 8-bit format (flags LSB = 0)', () => {
    const buffer = new Uint8Array([0x00, 72]);  // Flags=0, HR=72 bpm
    const dv = new DataView(buffer.buffer);
    expect(parseHeartRate(dv)).toBe(72);
  });
  
  test('should parse 16-bit format (flags LSB = 1)', () => {
    const buffer = new Uint8Array([0x01, 72, 0]);  // Flags=1, HR=72 (little-endian)
    const dv = new DataView(buffer.buffer);
    expect(parseHeartRate(dv)).toBe(72);
  });
  
  test('should handle high HR value (200 bpm)', () => {
    const buffer = new Uint8Array([0x01, 200, 0]);
    const dv = new DataView(buffer.buffer);
    expect(parseHeartRate(dv)).toBe(200);
  });
});
```

#### Test: `sessionTimersStore.formatDuration()`
```javascript
describe('formatDuration', () => {
  test('should format < 1 min as MM:SS', () => {
    expect(formatDuration(45)).toBe('00:45');
  });
  
  test('should format >= 1 min as MM:SS', () => {
    expect(formatDuration(125)).toBe('02:05');  // 2:05
  });
  
  test('should format >= 1 hour as HH:MM:SS', () => {
    expect(formatDuration(3665)).toBe('01:01:05');  // 1:01:05
  });
  
  test('should handle 0', () => {
    expect(formatDuration(0)).toBe('00:00');
  });
});
```

#### Test: `bleStore state management`
```javascript
describe('bleStore', () => {
  let store;
  
  beforeEach(() => {
    store = useBleStore();
  });
  
  test('should set and get session ID', () => {
    store.setSessionId(123, 456);
    expect(store.getSessionId(123)).toBe(456);
  });
  
  test('should normalize client ID (string → number)', () => {
    store.setSessionId('123', 456);
    expect(store.getSessionId(123)).toBe(456);
    expect(store.getSessionId('123')).toBe(456);
  });
  
  test('should clear session', () => {
    store.setSessionId(123, 456);
    store.setSessionStarted(123, true);
    
    store.clearSession(123);
    
    expect(store.getSessionId(123)).toBeNull();
    expect(store.isSessionStarted(123)).toBe(false);
  });
});
```

#### Test: `wsStore.clearClientData()`
```javascript
describe('wsStore.clearClientData', () => {
  let store;
  
  beforeEach(() => {
    store = webSocketStore();
    
    // Populate maps
    store.bpmsFromWsCoach[123] = 75;
    store.caloriesFromWsCoach[123] = 250;
    store.client_name[123] = "John";
    store.startedAt[123] = new Date();
  });
  
  test('should delete all client data', () => {
    store.clearClientData(123);
    
    expect(store.bpmsFromWsCoach[123]).toBeUndefined();
    expect(store.caloriesFromWsCoach[123]).toBeUndefined();
    expect(store.client_name[123]).toBeUndefined();
    expect(store.startedAt[123]).toBeUndefined();
  });
  
  test('should not affect other clients', () => {
    store.bpmsFromWsCoach[456] = 80;
    
    store.clearClientData(123);
    
    expect(store.bpmsFromWsCoach[456]).toBe(80);
  });
});
```

---

### 12.2 Integration Tests

#### Test: BLE + bleStore State Sync
```javascript
describe('BLE connect flow integration', () => {
  let component, bleStore;
  
  beforeEach(async () => {
    // Mount component
    component = mount(CoachTvPreview);
    bleStore = useBleStore();
    
    // Mock BleClient
    jest.mock('@capacitor-community/bluetooth-le', () => ({
      BleClient: {
        initialize: jest.fn(),
        requestDevice: jest.fn().mockResolvedValue({
          deviceId: 'MOCK_DEVICE_ID'
        }),
        connect: jest.fn().mockResolvedValue(undefined),
        startNotifications: jest.fn().mockResolvedValue(undefined),
        read: jest.fn().mockResolvedValue(new DataView([88]))  // Battery
      }
    }));
  });
  
  test('should update bleStore on successful connect', async () => {
    const client = { id: 123, user: { first_name: 'John' } };
    
    await component.vm.connectDevice(client);
    
    expect(bleStore.connectionStatus[123]).toBe('connected');
    expect(bleStore.connectedDevices[123]).toBe('MOCK_DEVICE_ID');
    expect(bleStore.batteryLevel[123]).toBe(88);
  });
});
```

#### Test: Session Lifecycle (mock REST + WS)
```javascript
describe('Training session lifecycle', () => {
  let component, bleStore, wsStore, timersStore;
  
  beforeEach(async () => {
    component = mount(CoachTvPreview);
    bleStore = useBleStore();
    wsStore = webSocketStore();
    timersStore = useSessionTimersStore();
    
    // Mock REST
    jest.mock('@/services/trainingSessionsService', () => ({
      createSession: jest.fn().mockResolvedValue({
        data: {
          id: 999,
          start: new Date().toISOString(),
          client_id: 123
        }
      }),
      finishSession: jest.fn().mockResolvedValue({ data: { id: 999 } })
    }));
  });
  
  test('should create session, start timer, set sessionId', async () => {
    bleStore.setConnection(123, 'connected');
    const client = { id: 123 };
    
    await component.vm.startSession(client);
    
    expect(bleStore.sessionsStarted[123]).toBe(true);
    expect(bleStore.sessionIds[123]).toBe(999);
    expect(timersStore.timers[123]).toBeDefined();  // Timer started
  });
  
  test('should cleanup on finish', async () => {
    // Setup: session running
    bleStore.setSessionStarted(123, true);
    bleStore.setSessionId(123, 999);
    wsStore.bpmsFromWsCoach[123] = 75;
    wsStore.caloriesFromWsCoach[123] = 250;
    timersStore.startTimerFor(123, new Date().toISOString());
    
    // Finish
    await component.vm.onFinishSession(client, 250, 600);
    
    // Verify cleanup
    expect(bleStore.sessionIds[123]).toBeUndefined();
    expect(bleStore.sessionsStarted[123]).toBeUndefined();
    expect(wsStore.bpmsFromWsCoach[123]).toBeUndefined();
    expect(wsStore.caloriesFromWsCoach[123]).toBeUndefined();
    expect(timersStore.timers[123]).toBeUndefined();
  });
});
```

#### Test: Pause / Resume
```javascript
describe('Pause / Resume session', () => {
  let component, sessionControlStore, timersStore;
  
  beforeEach(async () => {
    // Mock BLE notifications
    jest.mock('@/utils/bluetooth.js', () => ({
      startHeartRateNotifications: jest.fn().mockResolvedValue(undefined),
      stopHeartRateNotificationsSafe: jest.fn().mockResolvedValue(undefined)
    }));
  });
  
  test('should pause: stop timer, stop BLE notif, set flag', async () => {
    const session = { id: 999 };
    const client = { id: 123 };
    
    // Setup
    sessionControlStore.startSession(123);  // not paused
    timersStore.startTimerFor(123, new Date().toISOString());
    
    // Pause
    await component.vm.toggleSession(session, client);
    
    expect(sessionControlStore.isPaused(123)).toBe(true);
    expect(timersStore._intervals[123]).toBeUndefined();  // Timer stopped
  });
  
  test('should resume: start timer, start BLE notif, unset flag', async () => {
    // Setup: paused
    sessionControlStore.stopSession(123);
    timersStore.pauseTimerFor(123);  // Stopped but value kept
    
    // Resume
    await component.vm.toggleSession(session, client);
    
    expect(sessionControlStore.isPaused(123)).toBe(false);
    expect(timersStore._intervals[123]).toBeDefined();  // Timer restarted
  });
});
```

---

### 12.3 Manual Testing Checklist

- [ ] **Device Connect**: User selects client, clicks "Connect Device", BLE picker opens, device selected, status → 'connected'
- [ ] **HR Notification**: BPM appears on screen, updates every ~1s, matches device readout
- [ ] **Start Session**: BPM visible, click "Start Session", timer begins, BPM sent to backend, calories appear from WS
- [ ] **Live Loop**: Monitor BPM + calories update for 1+ minute, timer increments smoothly
- [ ] **Pause**: Click "Pause", timer stops, timer value frozen, BPM stops updating UI, BPM not sent to backend
- [ ] **Resume**: Click "Resume", timer resumes from last value, BPM updates again, backend receives BPM again
- [ ] **Multiple Clients**: Add 3 clients, 3 devices, 3 sessions. Verify all timers + BPM independent.
- [ ] **Device Disconnect (Manual)**: Click "Disconnect Device", device disconnects, status → 'disconnected', no reconnect
- [ ] **Device Disconnect (Unexpected)**: Pull out BLE device (or force disconnect via OS), verify status → 'reconnecting', watch retry counts decrease, then reconnect succeeds or reaches max
- [ ] **Finish Session**: Click "Finish" while running, check backend confirmed, all maps cleaned, device disconnects, card removed from UI
- [ ] **Delete Session**: Click "Delete", confirm, verify hard delete, same cleanup as finish
- [ ] **WS Reconnect**: Unplug network (or mock close), verify Coach WS reconnects with exponential backoff, resync request sent, BPM data resumes
- [ ] **Page Unmount/Mount**: Start sessions, refresh page, verify sessions restored, device status checked, no auto-reconnect (expected)
- [ ] **Pause During Reconnect**: Device disconnects, reconnect retrying. Pause session. Resume session. Verify notifications restart post-reconnect.
- [ ] **Multiple Devices (one client)**: Client 1, Connect Device A. Connect Device A again (different device for same client). Verify Device A ID overwritten, Device B used, Device A orphaned (no error).

---

## Summary

This document outlines the complete end-to-end workflow of a Vue 3 + Pinia + Capacitor BLE coaching application. The system handles:

1. **Multi-client BLE streaming**: Independent connection, notification, and reconnect per client
2. **Session lifecycle**: Create, start, pause, resume, finish, delete with full state cleanup
3. **Dual WebSocket channels**: Coach (BPM/calories) and Gym (metadata/pause events)
4. **Timers**: Per-session elapsed time with pause/resume support
5. **Reconnect logic**: Exponential backoff for WebSocket; fixed retry for BLE (can improve)
6. **Cleanup & memory safety**: Explicit deletion of all maps to prevent leaks

**Key Risks & Improvements:**
- **P0**: Finish transaction (CRITICAL), BLE backoff (CRITICAL), pause guard (HIGH), WS race (MEDIUM)
- **P1**: Device persistence, heartbeat timeout, pause state sync, Gym finish sync
- **P2**: Service extraction, TypeScript, logging, testing

**Recommendations**: Adopt P0 improvements immediately (correctness), then P1 (reliability), then P2 (code quality). Add comprehensive unit + integration tests before production scaling.

---

**Document Generated:** 2026-03-04  
**Version:** 1.0  
**Status:** Complete (assumes all referenced services and backend APIs exist and behave as coded)
