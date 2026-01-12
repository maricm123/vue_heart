import { defineStore } from 'pinia'

export const useSessionControlStore = defineStore('sessionControl', {
    state: () => ({
        pausedSessions: {
            // clientId: true/false
        }
    }),

    getters: {
        isPaused: (state) => (clientId) => {
            return !!state.pausedSessions[clientId]
        }
    },

    actions: {
        stopSession(clientId) {
            this.pausedSessions[clientId] = true
        },

        startSession(clientId) {
            this.pausedSessions[clientId] = false
        },

        toggleSession(clientId) {
            if (this.pausedSessions[clientId]) {
                this.startSession(clientId)
            } else {
                this.stopSession(clientId)
            }
        },

        clear(clientId) {
            delete this.pausedSessions[clientId]
        }
    }
})