// src/api.js
import axios from "axios";
import { useAuthStore } from '@/store/auth'


const api_coach = axios.create({
  baseURL: import.meta.env.VITE_COACH_API_URL, // 👈 baza
  // baseURL: 'https://192.168.0.2:8000/api_coach'

});

const api_heart = axios.create({
    baseURL: import.meta.env.VITE_HEART_API_URL, // 👈 baza
    // baseURL: 'https://192.168.0.2:8000/api_heart'
});


// 👇 helper za dodavanje tokena
const addAuthInterceptor = (instance) => {
  instance.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  });
};

// dodaj interceptor za oba
addAuthInterceptor(api_coach);
addAuthInterceptor(api_heart);


export { api_coach, api_heart };
