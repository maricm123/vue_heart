import { defineStore } from "pinia";

interface DeviceSession {
  sessionId: string;
  deviceId: string;
  bpm?: number;
  isConnected: boolean;
}