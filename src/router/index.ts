// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import HeartRateTV from '../views/HeartRateTV.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About },
  { path: '/tv', name: 'HeartRateTV', component: HeartRateTV },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router