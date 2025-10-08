// // /src/store/sessionTimersStore.js
// import { defineStore } from 'pinia'
// import { reactive } from 'vue'

// export const useSessionTimersStore = defineStore('sessionTimers', () => {
//   const timers = reactive({})       // { [id]: elapsedSeconds }
//   const startTimes = reactive({})   // { [id]: Date }
//   const _intervals = {}             // { [id]: intervalId }

//   function formatDuration(totalSec = 0) {
//     totalSec = Math.max(0, Number(totalSec) || 0)
//     const h = Math.floor(totalSec / 3600)
//     const m = Math.floor((totalSec % 3600) / 60)
//     const s = totalSec % 60
//     return h > 0
//       ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
//       : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
//   }

//   function startTimerFor(id, startIso) {
//     const start = startIso ? new Date(startIso) : new Date()
//     if (Number.isNaN(start.getTime())) return

//     startTimes[id] = start
//     timers[id] = Math.floor((Date.now() - start.getTime()) / 1000)

//     if (_intervals[id]) clearInterval(_intervals[id])
//     _intervals[id] = setInterval(() => {
//       timers[id] = Math.floor((Date.now() - start.getTime()) / 1000)
//     }, 1000)
//   }

//   function stopTimerFor(id) {
//     if (_intervals[id]) {
//       clearInterval(_intervals[id])
//       delete _intervals[id]
//     }
//     const total = timers[id] ?? 0
//     delete timers[id]
//     delete startTimes[id]
//     return total
//   }

//   function clearAllTimers() {
//     Object.values(_intervals).forEach(clearInterval)
//     Object.keys(_intervals).forEach(k => delete _intervals[k])
//   }

//   return {
//     timers,
//     startTimes,
//     formatDuration,
//     startTimerFor,
//     stopTimerFor,
//     clearAllTimers,
//   }
// })


import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useSessionTimersStore = defineStore('sessionTimers', () => {
  const timers = reactive({})
  const startTimes = reactive({})

  function startTimerFor(clientId, startIso) {
    const start = startIso ? new Date(startIso) : new Date()
    startTimes[clientId] = start
    if (!timers[clientId]) timers[clientId] = 0

    // start interval to increment timer
    const interval = setInterval(() => {
      timers[clientId]++
    }, 1000)

    timers[clientId + '_interval'] = interval
  }

  function stopTimerFor(clientId) {
    clearInterval(timers[clientId + '_interval'])
    const elapsed = timers[clientId] || 0
    delete timers[clientId]
    delete startTimes[clientId]
    delete timers[clientId + '_interval']
    return elapsed
  }

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2,'0')
    const s = (seconds % 60).toString().padStart(2,'0')
    return `${m}:${s}`
  }

  function clearAllTimers() {
    Object.keys(timers).forEach(key => {
      if (key.includes('_interval')) clearInterval(timers[key])
    })
    Object.keys(timers).forEach(key => delete timers[key])
    Object.keys(startTimes).forEach(key => delete startTimes[key])
  }

  return {
    timers,
    startTimes,
    startTimerFor,
    stopTimerFor,
    formatDuration,
    clearAllTimers
  }
})