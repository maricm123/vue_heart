// src/main.ts
import { createApp } from 'vue'
import "./assets/styles/main.css";
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
// PrimeVue imports
import PrimeVue from 'primevue/config'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Listbox from 'primevue/listbox'  // za listu korisnika
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import ProgressBar from 'primevue/progressbar'
// @ts-ignore:next-line
import { HeartPreset } from "../preset.config.js";

// Kreiranje Vue aplikacije
const app = createApp(App)

// Dodavanje Pinia store-a
app.use(createPinia())

// Dodavanje router-a
app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: HeartPreset,
    options: {
      darkModeSelector: ".my-app-dark",
      order: "tailwind-base, primevue, tailwind-utilities",
    },
  },
});

// Registracija globalnih komponenti
app.component('Button', Button)
app.component('Dialog', Dialog)
app.component('Listbox', Listbox)
app.component('Card', Card)
app.component('Badge', Badge)
app.component('ProgressBar', ProgressBar)

// Montiranje aplikacije

app.mount('#app')