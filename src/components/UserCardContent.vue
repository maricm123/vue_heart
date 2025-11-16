<template>
  <div class="flex flex-col h-full justify-between">
    <!-- TOP SECTION -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <img
          src="https://ui-avatars.com/api/?name=Client"
          alt="avatar"
          class="w-14 h-14 rounded-full border-2 border-slate-200"
        />
        <div>
          <h2 class="text-lg font-semibold">{{ name }}</h2>
          <p class="text-xs text-slate-400">Station {{ clientId }}</p>
        </div>
      </div>

      <span
        class="px-4 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
        :class="zoneColor(bpm)"
      >
        {{ zoneLabel(bpm) }}
      </span>
    </div>

    <!-- DATA SECTION -->
    <div class="space-y-3 text-sm">
      <div class="flex items-center justify-between">
        <span class="text-slate-500 text-2xl">Heart Rate</span>
        <span class="font-bold text-xl" :class="bpmTextColor(bpm)">
          {{ bpm }} BPM
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-slate-500 text-2xl">Calories Burned</span>
        <span class="text-orange-500 font-semibold text-lg">
          {{ calories }}
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-slate-500">Training Time</span>
        <span class="text-blue-600 font-bold text-lg">
          {{ duration }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { webSocketStore } from '@/store/webSocketStore'
import { useSessionTimersStore } from '@/store/sessionTimerStore'
import { storeToRefs } from 'pinia'

const props = defineProps({
  clientId: { type: String, required: true }
})

const wsStore = webSocketStore()
const timersStore = useSessionTimersStore()

const { bpmsForGym, caloriesForGym, client_name, seconds } = storeToRefs(wsStore)

const bpm = computed(() => bpmsForGym.value[props.clientId] || 0)
const calories = computed(() => caloriesForGym.value[props.clientId] || 0)
const name = computed(() => client_name.value[props.clientId] || 'Client Name')
const duration = computed(() =>
  timersStore.formatDuration(seconds.value[props.clientId])
)

/* COLOR HELPERS */
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
