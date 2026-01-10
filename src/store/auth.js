import { defineStore } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('access') || null,
    refreshToken: localStorage.getItem('refresh') || null,
  }),
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('access', token)
    },
    setRefresh(token) {
      this.refreshToken = token;
      localStorage.setItem('refresh', token);
    },
    clearToken() {
      this.token = null
      localStorage.removeItem('access')
    },
    logout() {
      this.token = null;
      this.refreshToken = null;
      localStorage.clear();
      router.push({ name: 'coach-login' });
    }
  },
})