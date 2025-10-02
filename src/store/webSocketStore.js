import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const webSocketStore = defineStore('ws', () => {
  // dva različita ws objekta
  const wsUser = ref(null)
  const wsGym = ref(null)

  const isUserConnected = ref(false)
  const isGymConnected = ref(false)

  const caloriesFromWsCoach = reactive({})
  const bpmsFromWsCoach = reactive({})

  const caloriesForGym = reactive({})
  const bpmsForGym = reactive({})

  const client = reactive({})
  const coach = reactive({})

  // konekcija za user bpm
  function connectCoach() {
    if (wsUser.value) return // već konektovan
    const token = localStorage.getItem('access')
    // wsUser.value = new WebSocket(`ws://13.48.248.110:8000/ws/bpm/?token=${token}`)
    wsUser.value = new WebSocket(`wss://heartapp.dev/ws/bpm/?token=${token}`);

    wsUser.value.onopen = () => {
      console.log("✅ User WebSocket connected")
      isUserConnected.value = true
    }

    wsUser.value.onmessage = (event) => {
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

    wsUser.value.onclose = () => {
      console.log("❌ User WebSocket closed")
      isUserConnected.value = false
      wsUser.value = null
    }
  }

  function disconnectCoach() {
    if (wsUser.value) {
      wsUser.value.close()
      wsUser.value = null
      isUserConnected.value = false
    }
  }

  // konekcija za gym
  function connectWholeGym() {
    if (wsGym.value) return
    const token = localStorage.getItem('access')
    // wsGym.value = new WebSocket(`ws://13.48.248.110:8000/ws/gym/?token=${token}`)
    wsGym.value = new WebSocket(`wss://heartapp.dev/ws/gym/?token=${token}`);
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
      }
    }

    wsGym.value.onclose = () => {
      console.log("❌ Gym WebSocket closed")
      isGymConnected.value = false
      wsGym.value = null
    }
  }

  function disconnectWholeGym() {
    if (wsGym.value) {
      wsGym.value.close()
      wsGym.value = null
      isGymConnected.value = false
    }
  }

  return {
    wsUser,
    wsGym,
    isUserConnected,
    isGymConnected,
    caloriesFromWsCoach,
    bpmsFromWsCoach,
    caloriesForGym,
    bpmsForGym,
    client,
    coach,
    connectCoach,
    disconnectCoach,
    connectWholeGym,
    disconnectWholeGym,
  }
})