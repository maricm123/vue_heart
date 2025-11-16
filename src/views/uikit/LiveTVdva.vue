<template>
  <div class="min-h-screen bg-white text-slate-900 flex flex-col overflow-hidden">
    <!-- HEADER -->
    <header
  class="flex justify-between items-center px-10 py-5 shadow-lg"
  style="background-color: #FF474C; color: white;"
>
  <!-- LEFT: Logo + Title -->
  <div class="flex items-center">
    <div>
      <h1 class="text-2xl text-white font-bold">
        HeartApp
      </h1>
    </div>
  </div>

  <!-- RIGHT: Clock -->
  <!-- RIGHT: Custom Clock -->
<div class="flex flex-col items-end text-white">
  <div class="text-4xl font-bold leading-none">
    {{ time }}
  </div>
  <div class="text-2xl opacity-90 -mt-1">
    {{ date }}
  </div>
</div>
</header>

    <!-- MAIN CONTENT / GRID -->
    <main class="flex-1 px-8 py-6 overflow-hidden">
      <div v-if="activeUsers === 0" class="h-full flex items-center justify-center mt-44">
        <p class="text-slate-500 text-5xl">No active sessions at the moment</p>
      </div>

      <!-- Single big card -->
      <div
        v-else-if="activeUsers === 1"
        class="h-full grid grid-cols-1 auto-rows-fr"
      >
        <div
          v-for="[clientId] in bpmsEntries"
          :key="clientId"
          class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full"
        >
          <UserCardContent :client-id="clientId" />
        </div>
      </div>

      <!-- Two big cards -->
      <div
        v-else-if="activeUsers === 2"
        class="h-full grid grid-cols-2 gap-6 auto-rows-fr"
      >
        <div
          v-for="[clientId] in bpmsEntries"
          :key="clientId"
          class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full"
        >
          <UserCardContent :client-id="clientId" />
        </div>
      </div>

      <!-- 3+ users: responsive grid like the screenshot (up to 4 columns) -->
      <div
        v-else
        class="h-full grid gap-6 auto-rows-fr"
        :class="gridColsClass"
      >
        <div
          v-for="[clientId] in bpmsEntries"
          :key="clientId"
          class="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg flex flex-col justify-between"
        >
          <UserCardContent :client-id="clientId" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, defineComponent, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { webSocketStore } from '@/store/webSocketStore'
import { useSessionTimersStore } from '@/store/sessionTimerStore'
import UserCardContent from '@/components/UserCardContent.vue'
import { ref} from 'vue'

const time = ref('')
const date = ref('')
let intervalId = null

function updateClock() {
  const now = new Date()

  // 24-hour time HH:MM:SS
  time.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  // Date example: Thursday, November 13, 2025
  date.value = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
const wsStore = webSocketStore()
const { bpmsForGym, caloriesForGym, client_name, seconds } = storeToRefs(wsStore)

const timersStore = useSessionTimersStore()
const { timers } = storeToRefs(timersStore)

const bpmsEntries = computed(() => Object.entries(bpmsForGym.value))
const activeUsers = computed(() => bpmsEntries.value.length)

const avgCalories = computed(() => {
  const values = Object.values(caloriesForGym.value || {}).filter(
    v => typeof v === 'number' && v > 0
  )
  if (!values.length) return 0
  const total = values.reduce((sum, v) => sum + v, 0)
  return Math.round(total / values.length)
})

const avgBpm = computed(() => {
  const values = Object.values(bpmsForGym.value || {}).filter(
    v => typeof v === 'number' && v > 0
  )
  if (!values.length) return 0
  const total = values.reduce((sum, v) => sum + v, 0)
  return Math.round(total / values.length)
})

const gridColsClass = computed(() => {
  const count = activeUsers.value
  if (count === 3) return 'grid-cols-3'
  if (count === 4) return 'grid-cols-4'
  if (count <= 6) return 'grid-cols-3 xl:grid-cols-3'
  return 'grid-cols-4 xl:grid-cols-4'
})

onMounted(() => {
  updateClock()
  intervalId = setInterval(updateClock, 1000)
  Object.keys(wsStore.bpmsForGym).forEach(clientId => {
    if (!timersStore.timers[clientId]) timersStore.startTimerFor(clientId)
  })
})

onBeforeUnmount(() => {
  clearInterval(intervalId)
})

// --- helpers for color coding ---
function zoneColor(bpm) {
  if (!bpm) return 'bg-slate-400 text-white'
  if (bpm < 100) return 'bg-green-500 text-white'
  if (bpm < 130) return 'bg-yellow-400 text-slate-900'
  if (bpm < 160) return 'bg-orange-500 text-white'
  if (bpm < 190) return 'bg-red-500 text-white'
  return 'bg-pink-500 text-white'
}

function bpmTextColor(bpm) {
  if (!bpm) return 'text-slate-400'
  if (bpm < 100) return 'text-green-500'
  if (bpm < 130) return 'text-yellow-500'
  if (bpm < 160) return 'text-orange-500'
  if (bpm < 190) return 'text-red-500'
  return 'text-pink-500'
}

function zoneLabel(bpm) {
  if (!bpm) return 'Zone 0'
  if (bpm < 100) return 'Zone 1'
  if (bpm < 130) return 'Zone 2'
  if (bpm < 160) return 'Zone 3'
  if (bpm < 190) return 'Zone 4'
  return 'Zone 5'
}

</script>

<style scoped>
/* No scrollbars on TV */
::-webkit-scrollbar {
  display: none;
}
</style>
