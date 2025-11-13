<template>
  <div class="min-h-screen bg-[#0E1628] text-white flex flex-col overflow-hidden">
    <!-- HEADER -->
    <header class="flex justify-between items-center px-8 py-4 border-b border-gray-700">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <i class="pi pi-heart-fill text-blue-500 text-3xl"></i>
          FitZone Dashboard
        </h1>
        <p class="text-sm text-gray-400">Real-time Training Monitor</p>
      </div>

      <div class="flex flex-col items-end">
        <BelgradeClock />
      </div>
    </header>

    <!-- STATS -->
    <!-- <div class="flex justify-center gap-16 text-center mt-4">
      <div>
        <p class="text-blue-400 text-3xl font-semibold">12</p>
        <p class="text-gray-400 text-sm">Active Users</p>
      </div>
      <div>
        <p class="text-green-400 text-3xl font-semibold">315</p>
        <p class="text-gray-400 text-sm">Avg Calories</p>
      </div>
      <div>
        <p class="text-red-400 text-3xl font-semibold">141</p>
        <p class="text-gray-400 text-sm">Avg BPM</p>
      </div>
    </div> -->

    <!-- GRID -->
    <div class="grid gap-6 p-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-hidden">
      <div
        v-for="[clientId] in bpmsEntries"
        :key="clientId"
        class="bg-[#1C2940] rounded-xl p-5 shadow-lg border border-gray-700 flex flex-col justify-between"
      >
        <!-- TOP SECTION -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <img
              src="https://ui-avatars.com/api/?name=Client"
              alt="avatar"
              class="w-12 h-12 rounded-full border-2 border-gray-600"
            />
            <div>
              <h2 class="text-lg font-semibold">{{ client_name[clientId] || 'Client Name' }}</h2>
              <!-- <p class="text-gray-400 text-sm">Station {{ clientId }}</p> -->
            </div>
          </div>
          <span
            class="px-3 py-1 rounded-full text-sm font-semibold"
            :class="zoneColor(bpmsForGym[clientId])"
          >
            {{ zoneLabel(bpmsForGym[clientId]) }}
          </span>
        </div>

        <!-- DATA SECTION -->
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Heart Rate</span>
            <span
              class="font-bold text-xl"
              :class="bpmTextColor(bpmsForGym[clientId])"
            >
              {{ bpmsForGym[clientId] || 0 }} BPM
            </span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-400">Calories Burned</span>
            <span class="text-orange-400 font-semibold text-lg">
              {{ caloriesForGym[clientId] || 0 }}
            </span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-400">Training Time</span>
            <span class="text-blue-400 font-bold text-lg">
              {{ timersStore.formatDuration(seconds[clientId]) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BelgradeClock from '@/components/BelgradeClock.vue'
import { computed, onMounted } from 'vue'
import { webSocketStore } from '@/store/webSocketStore'
import { useSessionTimersStore } from '@/store/sessionTimerStore'
import { storeToRefs } from 'pinia'

const wsStore = webSocketStore()
const { bpmsForGym, caloriesForGym, coach, client_name, seconds } = storeToRefs(wsStore)

const timersStore = useSessionTimersStore()
const { timers } = storeToRefs(timersStore)

const bpmsEntries = computed(() => Object.entries(bpmsForGym.value))

onMounted(() => {
  Object.keys(wsStore.bpmsForGym).forEach(clientId => {
    if (!timersStore.timers[clientId]) timersStore.startTimerFor(clientId)
  })
})

// --- helpers for color coding ---
function zoneColor(bpm) {
  if (!bpm) return 'bg-gray-600 text-white'
  if (bpm < 100) return 'bg-green-600 text-white'
  if (bpm < 130) return 'bg-yellow-500 text-gray-900'
  if (bpm < 160) return 'bg-orange-500 text-white'
  if (bpm < 190) return 'bg-red-600 text-white'
  return 'bg-pink-600 text-white'
}

function bpmTextColor(bpm) {
  if (!bpm) return 'text-gray-400'
  if (bpm < 100) return 'text-green-400'
  if (bpm < 130) return 'text-yellow-400'
  if (bpm < 160) return 'text-orange-400'
  if (bpm < 190) return 'text-red-400'
  return 'text-pink-400'
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
