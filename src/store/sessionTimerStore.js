// /src/store/sessionTimersStore.js
import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useSessionTimersStore = defineStore('sessionTimers', () => {
  const timers = reactive({})       // { [id]: elapsedSeconds }
  const startTimes = reactive({})   // { [id]: Date }
  const _intervals = {}             // { [id]: intervalId }

  function formatDuration(totalSec = 0) {
    totalSec = Math.max(0, Number(totalSec) || 0)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)  
    const s = totalSec % 60
    return h > 0
      ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  function startTimerFor(id, startIso) {
    const start = startIso ? new Date(startIso) : new Date()
    if (Number.isNaN(start.getTime())) return

    startTimes[id] = start
    timers[id] = Math.floor((Date.now() - start.getTime()) / 1000)

    if (_intervals[id]) clearInterval(_intervals[id])
    _intervals[id] = setInterval(() => {
      timers[id] = Math.floor((Date.now() - start.getTime()) / 1000)
    }, 1000)
  }

  function stopTimerFor(id) {
    if (_intervals[id]) {
      clearInterval(_intervals[id])
      delete _intervals[id]
    }
    const total = timers[id] ?? 0
    delete timers[id]
    delete startTimes[id]
    return total
  }

  function clearAllTimers() {
    Object.values(_intervals).forEach(clearInterval)
    Object.keys(_intervals).forEach(k => delete _intervals[k])
  }

  return {
    timers,
    startTimes,
    formatDuration,
    startTimerFor,
    stopTimerFor,
    clearAllTimers,
  }
})
