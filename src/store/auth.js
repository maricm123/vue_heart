import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('access') || null,
  }),
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('access', token)
    },
    clearToken() {
      this.token = null
      localStorage.removeItem('access')
    },
  },
})