// import { defineStore } from 'pinia'
// import { ref, reactive } from 'vue'

// export const webSocketStore = defineStore('ws', () => {
//   // dva različita ws objekta
//   const wsCoach = ref(null)
//   const wsGym = ref(null)

//   const isUserConnected = ref(false)
//   const isGymConnected = ref(false)

//   const caloriesFromWsCoach = reactive({})
//   const bpmsFromWsCoach = reactive({})

//   const caloriesForGym = reactive({})
//   const bpmsForGym = reactive({})

//   const client = reactive({})
//   const client_name = reactive({})
//   const seconds = reactive({})
//   const coach = reactive({})

//   // konekcija za user bpm
//   function connectCoach() {
//     if (wsCoach.value) return // već konektovan
//     const token = localStorage.getItem('access')
//     // wsCoach.value = new WebSocket(`ws://13.48.248.110:8000/ws/bpm/?token=${token}`)
//     // wsCoach.value = new WebSocket(`wss://heartapp.dev/ws/bpm/?token=${token}`);
//     wsCoach.value = new WebSocket(import.meta.env.VITE_WS_COACH_URL + `?token=${token}`);
//     console.log("Connecting to Coach WebSocket...")

//     wsCoach.value.onopen = () => {
//       console.log("✅ User WebSocket connected")
//       isUserConnected.value = true
//     }

//     wsCoach.value.onmessage = (event) => {
//       const data = JSON.parse(event.data)
//       // console.log("User WS data:", data)

//       if (data.client_id) {
//         caloriesFromWsCoach[data.client_id] = data.current_calories
//         client[data.client_id] = data.client_id
//       }
//       if (data.bpm) {
//         bpmsFromWsCoach[data.client_id] = data.bpm
//       }
//     }

//     wsCoach.value.onclose = () => {
//       console.log("❌ User WebSocket closed")
//       isUserConnected.value = false
//       wsCoach.value = null
//     }
//   }

//   function disconnectCoach() {
//     if (wsCoach.value) {
//       wsCoach.value.close()
//       wsCoach.value = null
//       isUserConnected.value = false
//     }
//   }

//   // konekcija za gym
//   function connectWholeGym() {
//     if (wsGym.value) return
//     const token = localStorage.getItem('access')
//     // wsGym.value = new WebSocket(`ws://13.48.248.110:8000/ws/gym/?token=${token}`)
//     // wsGym.value = new WebSocket(`wss://heartapp.dev/ws/gym/?token=${token}`);
//     wsGym.value = new WebSocket(import.meta.env.VITE_WS_GYM_URL + `?token=${token}`);
//     console.log("Connecting to Gym WebSocket...")

//     wsGym.value.onopen = () => {
//       console.log("✅ Gym WebSocket connected")
//       isGymConnected.value = true
//     }

//     wsGym.value.onmessage = (event) => {
//       const data = JSON.parse(event.data)
//       // console.log("Gym WS data:", data)

//       if (data.client_id) {
//         caloriesForGym[data.client_id] = data.current_calories
//         bpmsForGym[data.client_id] = data.bpm
//         client[data.client_id] = data.client_id
//         coach[data.client_id] = data.coach_id
//         client_name[data.client_id] = data.client_name
//         seconds[data.client_id] = data.seconds
//       }
//     }

//     wsGym.value.onclose = (event) => {
//       console.log("❌ Gym WebSocket closed")
//       console.log("Code:", event.code)         // Close code (number)
//       console.log("Reason:", event.reason)     // Reason string from server
//       console.log("WasClean:", event.wasClean) // True if the connection closed cleanly
//       console.log("❌ Gym WebSocket closed")
//       isGymConnected.value = false
//       wsGym.value = null
//     }

//     wsGym.value.onerror = (err) => {
//       console.error("Gym WS error:", err)
//     }

//   }

//   function disconnectWholeGym() {
//     if (wsGym.value) {
//       wsGym.value.close()
//       wsGym.value = null
//       isGymConnected.value = false
//     }
//   }

// // function clearClientData(clientId) {
// //   delete bpmsFromWsCoach[clientId]
// //   delete caloriesFromWsCoach[clientId]
// //   delete bpmsForGym[clientId]
// //   delete caloriesForGym[clientId]
// //   delete client[clientId]
// //   delete client_name[clientId]
// //   delete seconds[clientId]
// //   delete coach[clientId]

// //   // ✅ Force reactivity
// //   // ✅ Trigger reactivity safely:
// //   Object.assign(bpmsForGym, { ...bpmsForGym })
// //   Object.assign(caloriesForGym, { ...caloriesForGym })
// //   Object.assign(client_name, { ...client_name })
// //   Object.assign(coach, { ...coach })
// //   Object.assign(seconds, { ...seconds })
// // }

// function clearClientData(clientId) {
//   const safeDelete = (obj) => {
//     if (obj[clientId] !== undefined) {
//       // Make a shallow copy without the deleted key
//       const { [clientId]: _, ...rest } = obj
//       // Reassign inside reactive scope
//       Object.keys(obj).forEach(key => delete obj[key])
//       Object.assign(obj, rest)
//     }
//   }

//   safeDelete(bpmsFromWsCoach)
//   safeDelete(caloriesFromWsCoach)
//   safeDelete(bpmsForGym)
//   safeDelete(caloriesForGym)
//   safeDelete(client)
//   safeDelete(client_name)
//   safeDelete(seconds)
//   safeDelete(coach)
// }

//   return {
//     wsCoach,
//     wsGym,
//     isUserConnected,
//     isGymConnected,
//     caloriesFromWsCoach,
//     bpmsFromWsCoach,
//     caloriesForGym,
//     bpmsForGym,
//     client,
//     coach,
//     seconds,
//     client_name,
//     connectCoach,
//     disconnectCoach,
//     connectWholeGym,
//     disconnectWholeGym,
//     clearClientData
//   }
// })

import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

export const webSocketStore = defineStore('ws', () => {
  const wsCoach = ref(null);
  const wsGym = ref(null);

  const isUserConnected = ref(false);
  const isGymConnected = ref(false);

  // Reconnect control
  const coachManualClose = ref(false);
  const gymManualClose = ref(false);

  const coachReconnectAttempts = ref(0);
  const gymReconnectAttempts = ref(0);

  let coachReconnectTimer = null;
  let gymReconnectTimer = null;

  // Heartbeat (optional)
  let coachHeartbeatTimer = null;
  let gymHeartbeatTimer = null;

  const HEARTBEAT_INTERVAL_MS = 15000; // 15s
  const MAX_BACKOFF_MS = 5000;         // max wait between reconnect tries
  const BASE_BACKOFF_MS = 500;         // start wait

  // Reactive client data
  const caloriesFromWsCoach = reactive({});
  const bpmsFromWsCoach = reactive({});
  const caloriesForGym = reactive({});
  const bpmsForGym = reactive({});
  const client = reactive({});
  const client_name = reactive({});
  const max_heart_rate = reactive({});
  const coach = reactive({});
  const startedAt = reactive({});

  const pausedByClient = reactive({});
  const pausedAtByClient = reactive({});
  const pausedSecondsByClient = reactive({});
  const activeClients = reactive({});
  const receivedGymMetadata = reactive({});

  function safeJsonParse(str) {
    try { return JSON.parse(str); } catch { return null; }
  }

  function clearTimer(t) {
    if (t) clearTimeout(t);
    return null;
  }

  function clearIntervalSafe(i) {
    if (i) clearInterval(i);
    return null;
  }

  function computeBackoffMs(attempt) {
    // 0 -> 500ms, 1 -> 1000ms, 2 -> 2000ms, 3 -> 3000ms... capped to MAX_BACKOFF_MS
    const ms = BASE_BACKOFF_MS * Math.pow(2, attempt);
    return Math.min(ms, MAX_BACKOFF_MS);
  }

  // -------------------- COACH SOCKET --------------------
  function scheduleCoachReconnect() {
    if (coachManualClose.value) return;
    if (wsCoach.value) return; // already connected/connecting

    const wait = computeBackoffMs(coachReconnectAttempts.value);
    coachReconnectAttempts.value += 1;

    coachReconnectTimer = clearTimer(coachReconnectTimer);
    coachReconnectTimer = setTimeout(() => {
      connectCoach(); // try again
    }, wait);
  }

  function startCoachHeartbeat() {
    coachHeartbeatTimer = clearIntervalSafe(coachHeartbeatTimer);
    coachHeartbeatTimer = setInterval(() => {
      if (!wsCoach.value || wsCoach.value.readyState !== WebSocket.OPEN) return;

      // Optional ping. Backend should ignore if it doesn't support it.
      wsCoach.value.send(JSON.stringify({ event: 'ping', ts: Date.now() }));
    }, HEARTBEAT_INTERVAL_MS);
  }

  function stopCoachHeartbeat() {
    coachHeartbeatTimer = clearIntervalSafe(coachHeartbeatTimer);
  }

  function connectCoach() {
    // if already has socket object (OPEN or CONNECTING), do nothing
    if (wsCoach.value) return;

    coachManualClose.value = false;

    const token = localStorage.getItem('access');
    wsCoach.value = new WebSocket(`${import.meta.env.VITE_WS_COACH_URL}?token=${token}`);

    wsCoach.value.onopen = () => {
      console.log('✅ User WebSocket connected');
      isUserConnected.value = true;
      coachReconnectAttempts.value = 0;

      // Ask backend to (re)send current state if supported
      wsCoach.value.send(JSON.stringify({ event: 'resync', ts: Date.now() }));

      startCoachHeartbeat();
    };

    wsCoach.value.onmessage = (event) => {
      const data = safeJsonParse(event.data);
      if (!data) return;

      // ignore pong
      if (data.event === 'pong') return;

      if (!data.client_id) return;

      if (data.current_calories !== undefined) {
        caloriesFromWsCoach[data.client_id] = data.current_calories;
      }
      if (data.bpm !== undefined) {
        bpmsFromWsCoach[data.client_id] = data.bpm;
      }
      client[data.client_id] = data.client_id;
    };

    wsCoach.value.onclose = (event) => {
      console.log('❌ User WebSocket closed', { code: event.code, reason: event.reason, wasClean: event.wasClean });

      stopCoachHeartbeat();

      isUserConnected.value = false;
      wsCoach.value = null;

      scheduleCoachReconnect();
    };

    wsCoach.value.onerror = (err) => {
      // onclose will still happen after this typically
      console.error('User WS error:', err);
    };
  }

  function disconnectCoach() {
    coachManualClose.value = true;

    coachReconnectTimer = clearTimer(coachReconnectTimer);
    stopCoachHeartbeat();

    if (wsCoach.value) {
      try { wsCoach.value.close(); } catch {}
      wsCoach.value = null;
    }

    isUserConnected.value = false;
    coachReconnectAttempts.value = 0;
  }

  // -------------------- GYM SOCKET --------------------
  function scheduleGymReconnect() {
    if (gymManualClose.value) return;
    if (wsGym.value) return;

    const wait = computeBackoffMs(gymReconnectAttempts.value);
    gymReconnectAttempts.value += 1;

    gymReconnectTimer = clearTimer(gymReconnectTimer);
    gymReconnectTimer = setTimeout(() => {
      connectWholeGym();
    }, wait);
  }

  function startGymHeartbeat() {
    gymHeartbeatTimer = clearIntervalSafe(gymHeartbeatTimer);
    gymHeartbeatTimer = setInterval(() => {
      if (!wsGym.value || wsGym.value.readyState !== WebSocket.OPEN) return;

      wsGym.value.send(JSON.stringify({ event: 'ping', ts: Date.now() }));
    }, HEARTBEAT_INTERVAL_MS);
  }

  function stopGymHeartbeat() {
    gymHeartbeatTimer = clearIntervalSafe(gymHeartbeatTimer);
  }

  function connectWholeGym() {
    if (wsGym.value) return;

    gymManualClose.value = false;

    const token = localStorage.getItem('access');
    wsGym.value = new WebSocket(`${import.meta.env.VITE_WS_GYM_URL}?token=${token}`);

    wsGym.value.onopen = () => {
      console.log('✅ Gym WebSocket connected');
      isGymConnected.value = true;
      gymReconnectAttempts.value = 0;

      // Ask backend to resend initial metadata for all active clients (recommended)
      wsGym.value.send(JSON.stringify({ event: 'resync', ts: Date.now() }));

      startGymHeartbeat();
    };

    wsGym.value.onmessage = (event) => {
      const data = safeJsonParse(event.data);
      if (!data) return;

      // ignore pong
      if (data.event === 'pong') return;

      if (!data.client_id) return;

      // ✅ pause/resume broadcast
      if (data.event === 'session_pause') {
        pausedByClient[data.client_id] = !!data.paused;
        pausedAtByClient[data.client_id] = data.paused_at ? new Date(data.paused_at) : null;
        pausedSecondsByClient[data.client_id] = Number(data.paused_seconds || 0);
        return;
      }

      // ✅ session finished broadcast
      if (data.event === 'training_session_finished') {
        delete activeClients[data.client_id];
        clearClientData(data.client_id);
        return;
      }

      // ✅ metadata (initial)
      if (data.event === 'initial') {
        activeClients[data.client_id] = true;
        receivedGymMetadata[data.client_id] = true;

        if (data.started_at) {
          const parsed = new Date(data.started_at);
          if (!isNaN(parsed)) startedAt[data.client_id] = parsed;
        }

        if (data.client_name) client_name[data.client_id] = data.client_name;
        if (data.coach_id) coach[data.client_id] = data.coach_id;
        if (data.max_heart_rate) max_heart_rate[data.client_id] = data.max_heart_rate;
      }

      client[data.client_id] = data.client_id;

      // ---------- METADATA (send once) ----------
      if (!receivedGymMetadata[data.client_id]) {
        if (data.started_at) startedAt[data.client_id] = new Date(data.started_at);
        if (data.client_name) client_name[data.client_id] = data.client_name;
        if (data.coach_id) coach[data.client_id] = data.coach_id;
        if (data.max_heart_rate) max_heart_rate[data.client_id] = data.max_heart_rate;
        receivedGymMetadata[data.client_id] = true;
      }

      // ---------- BPM & Calories ----------
      if (data.current_calories !== undefined) {
        caloriesForGym[data.client_id] = data.current_calories;
      }
      if (data.bpm !== undefined) {
        bpmsForGym[data.client_id] = data.bpm;
      }
    };

    wsGym.value.onclose = (event) => {
      console.log('❌ Gym WebSocket closed', { code: event.code, reason: event.reason, wasClean: event.wasClean });

      stopGymHeartbeat();

      isGymConnected.value = false;
      wsGym.value = null;

      scheduleGymReconnect();
    };

    wsGym.value.onerror = (err) => {
      console.error('Gym WS error:', err);
    };
  }

  function disconnectWholeGym() {
    gymManualClose.value = true;

    gymReconnectTimer = clearTimer(gymReconnectTimer);
    stopGymHeartbeat();

    if (wsGym.value) {
      try { wsGym.value.close(); } catch {}
      wsGym.value = null;
    }

    isGymConnected.value = false;
    gymReconnectAttempts.value = 0;
  }

  // ---------- CLEAR CLIENT DATA ----------
  function clearClientData(clientId) {
    const del = (obj) => { delete obj[clientId]; };

    del(bpmsFromWsCoach);
    del(caloriesFromWsCoach);
    del(bpmsForGym);
    del(caloriesForGym);
    del(client);
    del(client_name);
    del(coach);
    del(startedAt);
    del(max_heart_rate);
    del(receivedGymMetadata);
    del(pausedByClient);
    del(pausedAtByClient);
    del(pausedSecondsByClient);
  }

  return {
    wsCoach,
    wsGym,
    isUserConnected,
    isGymConnected,

    caloriesFromWsCoach,
    bpmsFromWsCoach,
    caloriesForGym,
    bpmsForGym,
    client,
    coach,
    client_name,
    startedAt,
    max_heart_rate,

    connectCoach,
    disconnectCoach,
    connectWholeGym,
    disconnectWholeGym,

    clearClientData,

    pausedByClient,
    pausedAtByClient,
    pausedSecondsByClient,
    activeClients,
  };
});
