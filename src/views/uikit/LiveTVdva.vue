<template>
  <div class="h-screen bg-white text-slate-900 flex flex-col overflow-hidden">
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
  <!-- No users -->
  <div v-if="activeUsers === 0" class="h-full flex items-center justify-center">
    <p class="text-slate-500 text-5xl">No active training sessions at the moment</p>
  </div>

  <!-- 1+ users → single dynamic grid -->
  <div v-else class="h-full">
    <div
      class="grid h-full gap-6"
      :style="gridStyle"
    >
      <div
        v-for="[clientId] in bpmsEntries"
        :key="clientId"
        :class="[cardBaseClass, { 'h-full': activeUsers === 1 }]"
      >
        <UserCardContent :client-id="clientId" />
      </div>
    </div>
  </div>
</main>
  </div>
</template>

<script setup>
import { computed, onMounted, watchEffect, ref, onBeforeUnmount } from 'vue'
import { webSocketStore } from '@/store/webSocketStore'
import { useSessionTimersStore } from '@/store/sessionTimerStore'
import { storeToRefs } from 'pinia'
import UserCardContent from '@/components/UserCardContent.vue'

const wsStore = webSocketStore()
const { bpmsForGym, caloriesForGym, client_name, seconds } = storeToRefs(wsStore)

const timersStore = useSessionTimersStore()
const { timers } = storeToRefs(timersStore)

// entries like before
const bpmsEntries = computed(() => Object.entries(bpmsForGym.value))

// number of active users
const activeUsers = computed(() => bpmsEntries.value.length)

// dynamic grid style
const gridStyle = ref({})

// base class for card
const cardBaseClass =
  'bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col justify-between'

// adjust grid according to number of users
watchEffect(() => {
  const count = activeUsers.value

  if (count <= 0) {
    gridStyle.value = {}
    return
  }

  if (count === 1) {
    // one big tile filling the screen
    gridStyle.value = {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr'
    }
  } else if (count === 2) {
    // two tiles: left / right
    gridStyle.value = {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr'
    }
  } else if (count <= 4) {
    // 2x2
    gridStyle.value = {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr'
    }
  } else if (count <= 6) {
    // 3x2
    gridStyle.value = {
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr'
    }
  } else {
    // 3x3 (or more, they’ll wrap inside)
    gridStyle.value = {
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr'
    }
  }
})
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
