import { defineStore } from 'pinia'

export const useBleStore = defineStore('ble', {
  state: () => ({
    sessions: [], // [{ sessionId, clientId, deviceId, bpm, isConnected }]

    // novo ↓↓↓
    connectionStatus: {},       // { clientId: "connected" | etc }
    batteryLevel: {},           // { clientId: 88 }
    devices: {},                // { clientId: { deviceId } }
    manuallyDisconnecting: {},  // { clientId: true/false }
    sessionsStarted: {},        // { clientId: true/false }
    sessionIds: {}              // { clientId: sessionId }
  }),

  getters: {
    getSession: (state) => (clientId) => {
      const sessionId = state.sessionIds[clientId]
      return state.sessions.find(s => s.sessionId === sessionId)
    },
    allSessions: (state) => state.sessions
  },

  actions: {
    // ⬇ sessions
    addSession(clientId, sessionId, deviceId) {
      const existing = this.sessions.find(s => s.sessionId === sessionId)
      if (!existing) {
        this.sessions.push({
          sessionId,
          clientId,
          deviceId,
          bpm: null,
          isConnected: false
        })
      }
      this.sessionIds[clientId] = sessionId
      this.sessionsStarted[clientId] = true
    },

    updateBpm(clientId, bpm) {
      const sessionId = this.sessionIds[clientId]
      if (!sessionId) return

      const session = this.sessions.find(s => s.sessionId === sessionId)
      if (session) session.bpm = bpm
    },

    setConnection(clientId, status) {
      this.connectionStatus[clientId] = status

      const sessionId = this.sessionIds[clientId]
      const session = this.sessions.find(s => s.sessionId === sessionId)
      if (session) session.isConnected = (status === 'connected')
    },

    setBattery(clientId, percent) {
      this.batteryLevel[clientId] = percent
    },

    setDevice(clientId, device) {
      this.devices[clientId] = device
    },

    setManual(clientId, value) {
      this.manuallyDisconnecting[clientId] = value
    },

    clearManual(clientId) {
      delete this.manuallyDisconnecting[clientId]
    },

    removeSession(clientId) {
      const sessionId = this.sessionIds[clientId]
      this.sessions = this.sessions.filter(s => s.sessionId !== sessionId)

      delete this.sessionIds[clientId]
      delete this.sessionsStarted[clientId]
    }
  }
})
