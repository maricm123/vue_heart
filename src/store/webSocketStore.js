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
    // WebSocket objects
    const wsCoach = ref(null);
    const wsGym = ref(null);

    // Connection states
    const isUserConnected = ref(false);
    const isGymConnected = ref(false);

    // Reactive client data
    const caloriesFromWsCoach = reactive({});
    const bpmsFromWsCoach = reactive({});
    const caloriesForGym = reactive({});
    const bpmsForGym = reactive({});
    const client = reactive({});
    const client_name = reactive({});
    const coach = reactive({});
    const startedAt = reactive({}); // store start timestamp locally

    // Keep track of which client metadata has been received
    const receivedGymMetadata = reactive({});

    // ---------- COACH WS ----------
    function connectCoach() {
        if (wsCoach.value) return;
        const token = localStorage.getItem('access');
        wsCoach.value = new WebSocket(`${import.meta.env.VITE_WS_COACH_URL}?token=${token}`);

        wsCoach.value.onopen = () => {
            console.log('✅ User WebSocket connected');
            isUserConnected.value = true;
        };

        wsCoach.value.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (!data.client_id) return;

            if (data.current_calories !== undefined) {
                caloriesFromWsCoach[data.client_id] = data.current_calories;
            }
            if (data.bpm !== undefined) {
                bpmsFromWsCoach[data.client_id] = data.bpm;
            }
            client[data.client_id] = data.client_id;
        };

        wsCoach.value.onclose = () => {
            console.log('❌ User WebSocket closed');
            isUserConnected.value = false;
            wsCoach.value = null;
        };
    }

    function disconnectCoach() {
        if (wsCoach.value) {
            wsCoach.value.close();
            wsCoach.value = null;
            isUserConnected.value = false;
        }
    }

    // ---------- GYM WS ----------
    function connectWholeGym() {
        if (wsGym.value) return;
        const token = localStorage.getItem('access');
        wsGym.value = new WebSocket(`${import.meta.env.VITE_WS_GYM_URL}?token=${token}`);

        wsGym.value.onopen = () => {
            console.log('✅ Gym WebSocket connected');
            isGymConnected.value = true;
        };

        wsGym.value.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Gym WS data:', data);
            if (!data.client_id) return;

            if (data.event === 'initial') {
                console.log('INITIAL METADATA RECEIVED FOR CLIENT:', data.client_id);
                receivedGymMetadata[data.client_id] = true;

                if (data.started_at) {
                    const parsed = new Date(data.started_at);
                    if (!isNaN(parsed)) {
                        startedAt[data.client_id] = parsed;
                    }
                }

                if (data.client_name) client_name[data.client_id] = data.client_name;
                if (data.coach_id) coach[data.client_id] = data.coach_id;
            }

            console.log('RAW started_at:', data.started_at);
            console.log('PARSED date:', new Date(data.started_at));
            client[data.client_id] = data.client_id;

            // ---------- METADATA (send once) ----------
            if (!receivedGymMetadata[data.client_id]) {
                if (data.started_at) startedAt[data.client_id] = new Date(data.started_at);
                if (data.client_name) client_name[data.client_id] = data.client_name;
                if (data.coach_id) coach[data.client_id] = data.coach_id;
                receivedGymMetadata[data.client_id] = true;
                console.log('Received metadata for client:', data.client_id);
                console.log('Started at:', startedAt[data.client_id]);
                console.log('Client name:', client_name[data.client_id]);
            }

            // ---------- BPM & Calories ----------
            if (data.current_calories !== undefined) {
                caloriesForGym[data.client_id] = data.current_calories;
            }
            if (data.bpm !== undefined) {
                bpmsForGym[data.client_id] = data.bpm;
            }

            // ovde više NEMA računanja seconds
        };

        wsGym.value.onclose = (event) => {
            console.log('❌ Gym WebSocket closed');
            console.log('Code:', event.code);
            console.log('Reason:', event.reason);
            console.log('WasClean:', event.wasClean);
            isGymConnected.value = false;
            wsGym.value = null;
        };

        wsGym.value.onerror = (err) => {
            console.error('Gym WS error:', err);
        };
    }

    function disconnectWholeGym() {
        if (wsGym.value) {
            wsGym.value.close();
            wsGym.value = null;
            isGymConnected.value = false;
        }
    }

    // ---------- CLEAR CLIENT DATA ----------
    function clearClientData(clientId) {
        const safeDelete = (obj) => {
            if (obj[clientId] !== undefined) {
                const { [clientId]: _, ...rest } = obj;
                Object.keys(obj).forEach((key) => delete obj[key]);
                Object.assign(obj, rest);
            }
        };

        safeDelete(bpmsFromWsCoach);
        safeDelete(caloriesFromWsCoach);
        safeDelete(bpmsForGym);
        safeDelete(caloriesForGym);
        safeDelete(client);
        safeDelete(client_name);
        safeDelete(coach);
        safeDelete(startedAt);
        safeDelete(receivedGymMetadata);
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
        connectCoach,
        disconnectCoach,
        connectWholeGym,
        disconnectWholeGym,
        clearClientData
    };
});

// import { defineStore } from 'pinia'
// import { ref, reactive } from 'vue'

// export const webSocketStore = defineStore('ws', () => {
//   // WebSocket objects
//   const wsCoach = ref(null)
//   const wsGym = ref(null)

//   // Connection states
//   const isUserConnected = ref(false)
//   const isGymConnected = ref(false)

//   // Reactive client data
//   const caloriesFromWsCoach = reactive({})
//   const bpmsFromWsCoach = reactive({})
//   const caloriesForGym = reactive({})
//   const bpmsForGym = reactive({})
//   const client = reactive({})
//   const client_name = reactive({})
//   const seconds = reactive({})
//   const coach = reactive({})
//   const startedAt = reactive({}) // store start timestamp locally

//   // ---------- COACH WS ----------
//   function connectCoach() {
//     if (wsCoach.value) return
//     const token = localStorage.getItem('access')
//     wsCoach.value = new WebSocket(`${import.meta.env.VITE_WS_COACH_URL}?token=${token}`)

//     wsCoach.value.onopen = () => {
//       console.log('✅ User WebSocket connected')
//       isUserConnected.value = true
//     }

//     wsCoach.value.onmessage = (event) => {
//       const data = JSON.parse(event.data)
//       if (!data.client_id) return

//       if (data.current_calories !== undefined) {
//         caloriesFromWsCoach[data.client_id] = data.current_calories
//       }
//       if (data.bpm !== undefined) {
//         bpmsFromWsCoach[data.client_id] = data.bpm
//       }
//       client[data.client_id] = data.client_id
//     }

//     wsCoach.value.onclose = () => {
//       console.log('❌ User WebSocket closed')
//       isUserConnected.value = false
//       wsCoach.value = null
//     }

//     wsCoach.value.onerror = (err) => {
//       console.error('User WS error:', err)
//     }
//   }

//   function disconnectCoach() {
//     if (wsCoach.value) {
//       wsCoach.value.close()
//       wsCoach.value = null
//       isUserConnected.value = false
//     }
//   }

//   // ---------- GYM WS ----------
//   function connectWholeGym() {
//     if (wsGym.value) return
//     const token = localStorage.getItem('access')
//     wsGym.value = new WebSocket(`${import.meta.env.VITE_WS_GYM_URL}?token=${token}`)

//     wsGym.value.onopen = () => {
//       console.log('✅ Gym WebSocket connected')
//       isGymConnected.value = true
//     }

//     wsGym.value.onmessage = (event) => {
//       const data = JSON.parse(event.data)
//       if (!data.client_id) return

//       const id = data.client_id

//       // Ako backend šalje poseban "initial" event, ovde hvataš metapodatke
//       if (data.event === 'initial') {
//         if (data.started_at) {
//           const parsed = new Date(data.started_at)
//           if (!isNaN(parsed)) {
//             startedAt[id] = parsed
//           }
//         }
//         if (data.client_name) client_name[id] = data.client_name
//         if (data.coach_id) coach[id] = data.coach_id
//       }

//       // Uvek osveži osnovne stvari ako stignu
//       if (data.started_at) {
//         const parsed = new Date(data.started_at)
//         if (!isNaN(parsed)) {
//           startedAt[id] = parsed
//         }
//       }
//       if (data.client_name) client_name[id] = data.client_name
//       if (data.coach_id) coach[id] = data.coach_id

//       client[id] = id

//       // BPM & Calories
//       if (data.current_calories !== undefined) {
//         caloriesForGym[id] = data.current_calories
//       }
//       if (data.bpm !== undefined) {
//         bpmsForGym[id] = data.bpm
//       }

//       // SECONDS CALC
//       if (startedAt[id]) {
//         seconds[id] = Math.floor((Date.now() - startedAt[id].getTime()) / 1000)
//       }
//     }

//     wsGym.value.onclose = (event) => {
//       console.log('❌ Gym WebSocket closed')
//       console.log('Code:', event.code)
//       console.log('Reason:', event.reason)
//       console.log('WasClean:', event.wasClean)
//       isGymConnected.value = false
//       wsGym.value = null
//     }

//     wsGym.value.onerror = (err) => {
//       console.error('Gym WS error:', err)
//     }
//   }

//   function disconnectWholeGym() {
//     if (wsGym.value) {
//       wsGym.value.close()
//       wsGym.value = null
//       isGymConnected.value = false
//     }
//   }

//   // ---------- CLEAR CLIENT DATA ----------
//   function clearClientData(clientId) {
//     const safeDelete = (obj) => {
//       if (obj[clientId] !== undefined) {
//         const { [clientId]: _, ...rest } = obj
//         Object.keys(obj).forEach((key) => delete obj[key])
//         Object.assign(obj, rest)
//       }
//     }

//     safeDelete(bpmsFromWsCoach)
//     safeDelete(caloriesFromWsCoach)
//     safeDelete(bpmsForGym)
//     safeDelete(caloriesForGym)
//     safeDelete(client)
//     safeDelete(client_name)
//     safeDelete(seconds)
//     safeDelete(coach)
//     safeDelete(startedAt)
//   }

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
//     startedAt,
//     connectCoach,
//     disconnectCoach,
//     connectWholeGym,
//     disconnectWholeGym,
//     clearClientData,
//   }
// })
