import { defineStore } from 'pinia'

export const useBleStore = defineStore('ble', {
  state: () => ({
    connectionStatus: {},       // { clientId: "connected" | "connecting" | etc }
    batteryLevel: {},           // { clientId: 88 }
    devices: {},                // { clientId: { deviceId } }
    manuallyDisconnecting: {},  // { clientId: true/false }
    sessionsStarted: {},        // { clientId: true/false }
    sessionIds: {}              // { clientId: sessionId }
  }),

  getters: {
    getSessionId: (state) => (clientId) => {
      return state.sessionIds[clientId] || null
    },
    isSessionStarted: (state) => (clientId) => {
      return !!state.sessionsStarted[clientId]
    }
  },

  actions: {
    // 🟢 SESSION STATE
    setSessionId(clientId, sessionId) {
      this.sessionIds[clientId] = sessionId
    },

    setSessionStarted(clientId, value) {
      this.sessionsStarted[clientId] = value
    },

    clearSession(clientId) {
      delete this.sessionIds[clientId]
      delete this.sessionsStarted[clientId]
    },

    // 🟢 DEVICE STATE
    setConnection(clientId, status) {
      this.connectionStatus[clientId] = status
    },

    setBattery(clientId, percent) {
      this.batteryLevel[clientId] = percent
    },

    setDevice(clientId, device) {
      this.devices[clientId] = device
    },

    removeDevice(clientId) {
      delete this.devices[clientId]
    },

    setManual(clientId, value) {
      this.manuallyDisconnecting[clientId] = value
    },

    clearManual(clientId) {
      delete this.manuallyDisconnecting[clientId]
    }
  }
})
