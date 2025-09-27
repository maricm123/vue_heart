// src/store/sessionStore.js
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useSessionStore = defineStore('sessions', () => {
  // reactive object gde držimo sve aktivne sesije
  const activeSessions = ref([]) // niz objekata { id, client, start, ... }

  // dodaj novu sesiju
//   function addSession(session) {
//     // proveri da li već postoji session sa istim ID
//     const exists = activeSessions.find(s => s.id === session.id)
//     if (!exists) activeSessions.push(session)
//     console.log("Active sessions:", activeSessions)
//   }
function addSession(session) {
    const exists = activeSessions.value.find(s => s.id === session.id)
    if (!exists) activeSessions.value.push(session)
    console.log("Active sessions in store:", activeSessions.value)
  }

  // ukloni sesiju
  function removeSession(sessionId) {
    const index = activeSessions.findIndex(s => s.id === sessionId)
    if (index !== -1) activeSessions.splice(index, 1)
  }

  // update session (npr. BPM, calories, timer)
  function updateSession(sessionId, updates) {
    const session = activeSessions.find(s => s.id === sessionId)
    if (session) Object.assign(session, updates)
  }

  // clear sve sesije (npr. logout)
  function clearAll() {
    activeSessions.splice(0, activeSessions.length)
  }

  return {
    activeSessions,
    addSession,
    removeSession,
    updateSession,
    clearAll
  }
})
