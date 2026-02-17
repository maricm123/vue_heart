import { defineStore } from 'pinia'
import { toClientId } from "@/utils/id";

export const useBleStore = defineStore('ble', {
  state: () => ({
    connectionStatus: {},       // { clientId: "connected" | "connecting" | etc }
    batteryLevel: {},           // { clientId: 88 }
    // devices: {},                // { clientId: { deviceId } }
    manuallyDisconnecting: {},  // { clientId: true/false }
    sessionsStarted: {},        // { clientId: true/false }
    sessionIds: {},              // { clientId: sessionId }
    connectedDevices: {} // { [clientId]: deviceId }
  }),

  getters: {
    getSessionId: (state) => (clientId) => {
      const id = toClientId(clientId);
      return id == null ? null : (state.sessionIds[id] || null);
    },
    isSessionStarted: (state) => (clientId) => {
      const id = toClientId(clientId);
      return id == null ? false : !!state.sessionsStarted[id];
    },
    getDeviceId: (state) => (clientId) => {
      const id = toClientId(clientId);
      return id == null ? null : state.connectedDevices[id];
    },
  },

  actions: {
    setSessionId(clientId, sessionId) {
      const id = toClientId(clientId);
      if (id == null) return;
      this.sessionIds[id] = sessionId;
    },

    setSessionStarted(clientId, value) {
      const id = toClientId(clientId);
      if (id == null) return;
      this.sessionsStarted[id] = value;
    },

    clearSession(clientId) {
      const id = toClientId(clientId);
      if (id == null) return;
      delete this.sessionIds[id];
      delete this.sessionsStarted[id];
    },

    setConnection(clientId, status) {
      const id = toClientId(clientId);
      if (id == null) return;
      this.connectionStatus[id] = status;
    },

    setBattery(clientId, percent) {
      const id = toClientId(clientId);
      if (id == null) return;
      this.batteryLevel[id] = percent;
    },

    setDevice(clientId, deviceId) {
      const id = toClientId(clientId);
      if (id == null) return;
      this.connectedDevices[id] = deviceId;
    },

    removeDevice(clientId) {
      const id = toClientId(clientId);
      if (id == null) return;
      delete this.connectedDevices[id];
    },

    setManual(clientId, value) {
      const id = toClientId(clientId);
      if (id == null) return;
      this.manuallyDisconnecting[id] = value;
    },

    clearManual(clientId) {
      const id = toClientId(clientId);
      if (id == null) return;
      delete this.manuallyDisconnecting[id];
    },
  },
});
