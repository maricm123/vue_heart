<template>
  <div class="livetv-container" :style="gridStyle">
    <div
      v-if="bpmsEntries.length === 0"
      class="no-sessions"
      style="display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;grid-column:1/-1;"
    >
      <h1>No active sessions yet</h1>
      <p>Waiting for clients to connect.</p>
    </div>
    <div
      v-for="[clientId] in bpmsEntries"
      :key="clientId"
      class="session-tile"
    >
      <h1>{{ client_name[1] }}</h1>
      <h1>BPM: {{ bpmsForGym[clientId] }}</h1>
      <h1>Calories: {{ caloriesForGym[clientId] }}</h1>
      <h1>Coach: {{ coach[clientId] }}</h1>
      <h1>⏱️ Time: {{ timersStore.formatDuration(seconds[clientId]) }}</h1>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watchEffect } from "vue";
import { webSocketStore } from '@/store/webSocketStore'
import { useSessionTimersStore } from '@/store/sessionTimerStore'
import { storeToRefs } from 'pinia'


const wsStore = webSocketStore()
const { bpmsForGym, caloriesForGym, coach, client_name, seconds } = storeToRefs(wsStore)

const timersStore = useSessionTimersStore()
const { timers } = storeToRefs(timersStore)

const bpmsEntries = computed(() => Object.entries(bpmsForGym.value))

const gridStyle = ref({})

onMounted(() => {
  // populate timers for all current active sessions
  Object.keys(wsStore.bpmsForGym).forEach(clientId => {
    if (!timersStore.timers[clientId]) {
      timersStore.startTimerFor(clientId) // optional: pass start time if available
    }
  })
})

watchEffect(() => {
  const count = bpmsEntries.value.length
  console.log("Updating grid layout for", count, "sessions")

  if (count === 1) {
    gridStyle.value = {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
    }
  } else if (count === 2) {
    gridStyle.value = {
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr",
    }
  } else if (count <= 4) {
    gridStyle.value = {
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr 1fr",
    }
  } else if (count <= 6) {
    gridStyle.value = {
      gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "1fr 1fr",
    }
  } else {
    gridStyle.value = {
      gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "1fr 1fr 1fr",
    }
  }
})
</script>

<style scoped> .livetv-container { width: 100vw; height: 100vh; display: grid; gap: 10px; background: black; overflow: hidden; /* bez skrola */ padding: 10px; } .session-tile { background: #ffffff; color: white; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 3.5rem;  }
h1 { margin: 0.2em 0; font-size: 4rem; }
</style>