import { defineStore } from 'pinia'

export const useBleStore = defineStore('ble', {
  state: () => ({
    sessions: [] // [{ sessionId, deviceId, bpm, isConnected }]
  }),

  getters: {
    getSession: (state) => (sessionId) => {
      return state.sessions.find(s => s.sessionId === sessionId)
    },
    allSessions: (state) => state.sessions
  },

  actions: {
    addSession(sessionId, deviceId) {
      const existing = this.sessions.find(s => s.sessionId === sessionId)
      if (!existing) {
        this.sessions.push({
          sessionId,
          deviceId,
          bpm: null,
          isConnected: false
        })
      }
    },

    updateBpm(sessionId, bpm) {
      const session = this.sessions.find(s => s.sessionId === sessionId)
      if (session) {
        session.bpm = bpm
      }
    },

    setConnection(sessionId, isConnected) {
      const session = this.sessions.find(s => s.sessionId === sessionId)
      if (session) {
        session.isConnected = isConnected
      }
    },

    removeSession(sessionId) {
      this.sessions = this.sessions.filter(s => s.sessionId !== sessionId)
    }
  }
})
