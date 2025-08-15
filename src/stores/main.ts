// src/stores/main.ts
import { defineStore } from 'pinia'
import axios from "axios";

export interface Client {
  id: number
  first_name: string
  last_name: string
  bpm: number | null
  calories: number | null
  device: any | null
  server: any | null
  characteristic: any | null
  sessionActive: boolean
  sessionId: number | null
  timer: number
  timerInterval: any | null
  battery: number | null
}

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as Client[],
  }),
  getters: {
    activeUsers: (state) => state.users.filter(u => u.sessionActive),
  },
  actions: {
    setUsers(users: Client[]) {
      this.users = Array.isArray(users) ? users : []
    },
    addUser(user: Client) {
      const i = this.users.findIndex(u => u.id === user.id)
      if (i === -1) this.users.push(user)
      else this.users[i] = { ...this.users[i], ...user }
    },
    updateUser(id: number, data: Partial<Client>) {
      const i = this.users.findIndex(u => u.id === id)
      if (i !== -1) this.users[i] = { ...this.users[i], ...data }
    },
    removeUser(id: number) {
      this.users = this.users.filter(u => u.id !== id)
    },
  },
})