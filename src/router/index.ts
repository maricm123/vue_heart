// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import PreviewCoachTVNew from '../views/PreviewCoachTVNew.vue'
import LiveTV from '../views/LiveTV.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About },
  { path: '/coachtv', name: 'PreviewCoachTVNew', component: PreviewCoachTVNew },
  { path: '/livetv', name: 'LiveTV', component: LiveTV },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router