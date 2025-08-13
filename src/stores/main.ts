// src/stores/main.ts
import { defineStore } from 'pinia'

export interface User {
  id: number
  name: string
}

export const useMainStore = defineStore('main', {
  state: () => ({
    count: 0 as number,
    user: null as User | null,
  }),
  actions: {
    increment() {
      this.count++
    },
    setUser(userData: User) {
      this.user = userData
    }
  }
})
