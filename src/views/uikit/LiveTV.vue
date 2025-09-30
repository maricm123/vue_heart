<template>
  <div class="livetv-container" :style="gridStyle">
    <div
      v-for="[clientId, bpm] in bpmsEntries"
      :key="clientId"
      class="session-tile"
    >
      <h2>Client {{ clientId }}</h2>
      <p>BPM: {{ bpmsForGym[clientId] }}</p>
      <p>Calories: {{ caloriesForGym[clientId] }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watchEffect } from "vue";
import { webSocketStore } from '@/store/webSocketStore'
import { storeToRefs } from 'pinia'

const wsStore = webSocketStore()
const { bpmsForGym, caloriesForGym } = storeToRefs(wsStore)

const bpmsEntries = computed(() => Object.entries(bpmsForGym.value))

const gridStyle = ref({})

watchEffect(() => {
  const count = 1

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

<style scoped> .livetv-container { width: 100vw; height: 100vh; display: grid; gap: 10px; background: black; overflow: hidden; /* bez skrola */ padding: 10px; } .session-tile { background: #222; color: white; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 1.5rem; } </style>