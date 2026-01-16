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
//     const startIsoo = new Date().toISOString();
//     const startUtc = Date.parse(startIsoo); // UTC epoch ms
//     const nowUtc = Date.now();             // UTC epoch ms
//     const diffSec = Math.floor((nowUtc - startUtc) / 1000);

//     timers[id] = diffSec;
//     startTimes[id] = new Date(startUtc);

//     if (_intervals[id]) clearInterval(_intervals[id]);
//     _intervals[id] = setInterval(() => {
//       timers[id] = Math.floor((Date.now() - startUtc) / 1000);
//     }, 1000);
// }

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


// /src/store/sessionTimersStore.js
import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useSessionTimersStore = defineStore('sessionTimers', () => {
  const timers = reactive({})     // { [id]: elapsedSeconds }
  const _intervals = {}           // { [id]: intervalId }

  function formatDuration(totalSec = 0) {
    totalSec = Math.max(0, Number(totalSec) || 0)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return h > 0
      ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  // start from backend start time (or now)
  function startTimerFor(id, startIso) {
    const startUtc = startIso ? Date.parse(startIso) : Date.now()
    const nowUtc = Date.now()
    timers[id] = Math.max(0, Math.floor((nowUtc - startUtc) / 1000))

    if (_intervals[id]) clearInterval(_intervals[id])
    _intervals[id] = setInterval(() => {
      timers[id] = (timers[id] ?? 0) + 1
    }, 1000)
  }

  // pause without deleting state
  function pauseTimerFor(id) {
    if (_intervals[id]) {
      clearInterval(_intervals[id])
      delete _intervals[id]
    }
    return timers[id] ?? 0
  }

  // resume from current timers[id]
  function resumeTimerFor(id) {
    if (_intervals[id]) return // already running
    if (timers[id] == null) timers[id] = 0

    _intervals[id] = setInterval(() => {
      timers[id] = (timers[id] ?? 0) + 1
    }, 1000)
  }

  // finish: clear interval and delete state, return total
  function stopTimerFor(id) {
    if (_intervals[id]) {
      clearInterval(_intervals[id])
      delete _intervals[id]
    }
    const total = timers[id] ?? 0
    delete timers[id]
    return total
  }

  function clearAllTimers() {
    Object.values(_intervals).forEach(clearInterval)
    Object.keys(_intervals).forEach(k => delete _intervals[k])
    Object.keys(timers).forEach(k => delete timers[k])
  }

  return {
    timers,
    formatDuration,
    startTimerFor,
    pauseTimerFor,
    resumeTimerFor,
    stopTimerFor,
    clearAllTimers,
  }
})