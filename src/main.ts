// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// Kreiranje Vue aplikacije
const app = createApp(App)

// Dodavanje Pinia store-a
app.use(createPinia())

// Dodavanje router-a
app.use(router)

// Montiranje aplikacije
app.mount('#app')