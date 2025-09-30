import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const webSocketStore = defineStore('ws', () => {
  const ws = ref(null)
  const isConnected = ref(false)
  const calories = reactive({})
  const bpms = reactive({})
  const client = reactive({})

  function connect() {
    if (ws.value) return // već konektovan
    const token = localStorage.getItem('access')
    ws.value = new WebSocket(`ws://13.48.248.110:8000/ws/bpm/?token=${token}`)

    ws.value.onopen = () => {
      console.log("✅ WebSocket connected")
      isConnected.value = true
    }

    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log("WS data:", data)

      if (data.client_id) {
        calories[data.client_id] = data.current_calories
        client[data.client_id] = data.client_id
      }
      if (data.bpm) {
        bpms[data.client_id] = data.bpm
      }
    }

    ws.value.onclose = () => {
      console.log("❌ WebSocket closed")
      isConnected.value = false
      ws.value = null
    }
  }

  function disconnect() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  function connectGym(gymId) {
    if (ws.value) return
    const token = localStorage.getItem('access')
    ws.value = new WebSocket(`ws://13.48.248.110:8000/ws/gym/?token=${token}`)

    ws.value.onopen = () => {
      console.log("✅ Gym WebSocket connected")
      isConnected.value = true
    }

    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log("Gym WS data:", data)

      if (data.client_id) {
        calories[data.client_id] = data.calories
        bpms[data.client_id] = data.bpm
        client[data.client_id] = data.client_name
      }
    }

    ws.value.onclose = () => {
      console.log("❌ Gym WebSocket closed")
      isConnected.value = false
      ws.value = null
    }
  }

  return {
    ws, isConnected, calories, bpms, client,
    connect, disconnect, connectGym
  }
})