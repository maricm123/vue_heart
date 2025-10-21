import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const webSocketStore = defineStore('ws', () => {
  // dva različita ws objekta
  const wsCoach = ref(null)
  const wsGym = ref(null)

  const isUserConnected = ref(false)
  const isGymConnected = ref(false)

  const caloriesFromWsCoach = reactive({})
  const bpmsFromWsCoach = reactive({})

  const caloriesForGym = reactive({})
  const bpmsForGym = reactive({})

  const client = reactive({})
  const client_name = reactive({})
  const seconds = reactive({})
  const coach = reactive({})

  // konekcija za user bpm
  function connectCoach() {
    if (wsCoach.value) return // već konektovan
    const token = localStorage.getItem('access')
    // wsCoach.value = new WebSocket(`ws://13.48.248.110:8000/ws/bpm/?token=${token}`)
    // wsCoach.value = new WebSocket(`wss://heartapp.dev/ws/bpm/?token=${token}`);
    wsCoach.value = new WebSocket(import.meta.env.VITE_WS_COACH_URL + `?token=${token}`);

    wsCoach.value.onopen = () => {
      console.log("✅ User WebSocket connected")
      isUserConnected.value = true
    }

    wsCoach.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // console.log("User WS data:", data)

      if (data.client_id) {
        caloriesFromWsCoach[data.client_id] = data.current_calories
        client[data.client_id] = data.client_id
      }
      if (data.bpm) {
        bpmsFromWsCoach[data.client_id] = data.bpm
      }
    }

    wsCoach.value.onclose = () => {
      console.log("❌ User WebSocket closed")
      isUserConnected.value = false
      wsCoach.value = null
    }
  }

  function disconnectCoach() {
    if (wsCoach.value) {
      wsCoach.value.close()
      wsCoach.value = null
      isUserConnected.value = false
    }
  }

  // konekcija za gym
  function connectWholeGym() {
    if (wsGym.value) return
    const token = localStorage.getItem('access')
    // wsGym.value = new WebSocket(`ws://13.48.248.110:8000/ws/gym/?token=${token}`)
    // wsGym.value = new WebSocket(`wss://heartapp.dev/ws/gym/?token=${token}`);
    wsGym.value = new WebSocket(import.meta.env.VITE_WS_GYM_URL + `?token=${token}`);
    console.log("Connecting to Gym WebSocket...")

    wsGym.value.onopen = () => {
      console.log("✅ Gym WebSocket connected")
      isGymConnected.value = true
    }

    wsGym.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // console.log("Gym WS data:", data)

      if (data.client_id) {
        caloriesForGym[data.client_id] = data.current_calories
        bpmsForGym[data.client_id] = data.bpm
        client[data.client_id] = data.client_id
        coach[data.client_id] = data.coach_id
        client_name[data.client_id] = data.client_name
        seconds[data.client_id] = data.seconds
      }
    }

    wsGym.value.onclose = (event) => {
      console.log("❌ Gym WebSocket closed")
      console.log("Code:", event.code)         // Close code (number)
      console.log("Reason:", event.reason)     // Reason string from server
      console.log("WasClean:", event.wasClean) // True if the connection closed cleanly
      console.log("❌ Gym WebSocket closed")
      isGymConnected.value = false
      wsGym.value = null
    }

    wsGym.value.onerror = (err) => {
      console.error("Gym WS error:", err)
    }

  }

  function disconnectWholeGym() {
    if (wsGym.value) {
      wsGym.value.close()
      wsGym.value = null
      isGymConnected.value = false
    }
  }

// function clearClientData(clientId) {
//   delete bpmsFromWsCoach[clientId]
//   delete caloriesFromWsCoach[clientId]
//   delete bpmsForGym[clientId]
//   delete caloriesForGym[clientId]
//   delete client[clientId]
//   delete client_name[clientId]
//   delete seconds[clientId]
//   delete coach[clientId]

//   // ✅ Force reactivity
//   // ✅ Trigger reactivity safely:
//   Object.assign(bpmsForGym, { ...bpmsForGym })
//   Object.assign(caloriesForGym, { ...caloriesForGym })
//   Object.assign(client_name, { ...client_name })
//   Object.assign(coach, { ...coach })
//   Object.assign(seconds, { ...seconds })
// }

function clearClientData(clientId) {
  const safeDelete = (obj) => {
    if (obj[clientId] !== undefined) {
      // Make a shallow copy without the deleted key
      const { [clientId]: _, ...rest } = obj
      // Reassign inside reactive scope
      Object.keys(obj).forEach(key => delete obj[key])
      Object.assign(obj, rest)
    }
  }

  safeDelete(bpmsFromWsCoach)
  safeDelete(caloriesFromWsCoach)
  safeDelete(bpmsForGym)
  safeDelete(caloriesForGym)
  safeDelete(client)
  safeDelete(client_name)
  safeDelete(seconds)
  safeDelete(coach)
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
    seconds,
    client_name,
    connectCoach,
    disconnectCoach,
    connectWholeGym,
    disconnectWholeGym,
    clearClientData
  }
})