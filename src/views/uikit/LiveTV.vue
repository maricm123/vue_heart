<!-- <template>
  <div class="livetv-container" :style="gridStyle">
    <div
      v-for="session in activeSessions"
      :key="session.id"
      class="session-tile"
    >
      <h2>{{ session.clientName }}</h2>
      <p>BPM: {{ session.bpm }}</p>
      <p>Timer: {{ session.timer }}</p>
      <p>Calories: {{ session.calories }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect } from "vue";

// hardkodovani primer sesija
const activeSessions = ref([
  { id: 1, clientName: "Marko", bpm: 120, timer: "00:12:34", calories: 90 },
  { id: 2, clientName: "Jelena", bpm: 98, timer: "00:10:12", calories: 75 },
  { id: 3, clientName: "Stefan", bpm: 135, timer: "00:08:45", calories: 110 },
  { id: 4, clientName: "Ana", bpm: 105, timer: "00:15:00", calories: 130 },
  { id: 5, clientName: "Ana", bpm: 105, timer: "00:15:00", calories: 130 },
]);

const gridStyle = ref({});

watchEffect(() => {
  const count = activeSessions.value.length;

  if (count === 1) {
    gridStyle.value = {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
    };
  } else if (count === 2) {
    gridStyle.value = {
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr",
    };
  } else if (count <= 4) {
    gridStyle.value = {
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr 1fr",
    };
  } else if (count <= 6) {
    gridStyle.value = {
      gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "1fr 1fr",
    };
  } else {
    gridStyle.value = {
      gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "1fr 1fr 1fr",
    };
  }
});
</script>

<style scoped>
.livetv-container {
  width: 100vw;
  height: 100vh;
  display: grid;
  gap: 10px;
  background: black;
  overflow: hidden; /* bez skrola */
  padding: 10px;
}

.session-tile {
  background: #222;
  color: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
}
</style> -->


<!-- <template>
  <div class="livetv-container" :style="gridStyle">
    <div
      v-for="session in activeSessions"
      :key="session.id"
      class="session-tile"
    >
      <h2>{{ session.clientName }}</h2>
      <p>BPM: {{ session.bpm ?? '-' }}</p>
      <p>Timer: {{ session.timer ?? '00:00' }}</p>
      <p>Calories: {{ session.calories ?? 0 }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from "vue"
import { webSocketStore } from "@/store/webSocketStore"
import { useSessionTimersStore } from "@/store/sessionTimerStore" // ako si prebacio timere u pinia

const wsStore = webSocketStore()
const timerStore = useSessionTimersStore()

// Ove sesije bi trebalo da povlačiš sa backenda (ko je trenutno aktivan)
const activeSessions = computed(() => {
  // primer kombinacije podataka iz wsStore i timerStore
  return Object.keys(wsStore.bpms).map(clientId => ({
    id: clientId,
    // clientName: `Client ${clientId}`, // zameni stvarnim imenom iz baze
    bpm: wsStore.bpms[clientId],
    calories: wsStore.calories[clientId],
    timer: timerStore.formatDuration(timerStore.timers[clientId] || 0)
  }))
})

const gridStyle = ref({})

watchEffect(() => {
  const count = activeSessions.value.length
  if (count === 1) {
    gridStyle.value = { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" }
  } else if (count === 2) {
    gridStyle.value = { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" }
  } else if (count <= 4) {
    gridStyle.value = { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }
  } else if (count <= 6) {
    gridStyle.value = { gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr" }
  } else {
    gridStyle.value = { gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr" }
  }
})
</script> -->

<style scoped>
.livetv-container {
  width: 100vw;
  height: 100vh;
  display: grid;
  gap: 10px;
  background: black;
  overflow: hidden; /* bez skrola */
  padding: 10px;
}

.session-tile {
  background: #222;
  color: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
}
</style>

<script setup>
import { computed } from "vue"
import { webSocketStore } from "@/store/webSocketStore"
import { useSessionTimersStore } from "@/store/sessionTimerStore" // ako si prebacio timere u pinia
import { ref, watchEffect } from "vue"
const wsStore = webSocketStore()
const timerStore = useSessionTimersStore()

// napravi computed da spoji podatke
const activeSessions = computed(() => {
  return Object.keys(wsStore.bpms).map(clientId => ({
    id: clientId,
    bpm: wsStore.bpms[clientId] ?? 0,
    calories: wsStore.calories[clientId] ?? 0,
    timer: timerStore.formatDuration(timerStore.timers[clientId] ?? 0)
  }))
})

const gridStyle = ref({})

watchEffect(() => {
  console.log("🔥 Active Sessions Debug:", activeSessions.value)
  const count = activeSessions.value.length
  if (count === 1) {
    gridStyle.value = { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" }
  } else if (count === 2) {
    gridStyle.value = { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" }
  } else if (count <= 4) {
    gridStyle.value = { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }
  } else if (count <= 6) {
    gridStyle.value = { gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr" }
  } else {
    gridStyle.value = { gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr" }
  }
})

</script>

<template>
  <div class="livetv-container" :style="gridStyle">
    <div
      v-for="session in activeSessions"
      :key="session.id"
      class="session-tile"
    >
      <h2>Client {{ session.id }}</h2>
      <p>BPM: {{ session.bpm }}</p>
      <p>Timer: {{ session.timer }}</p>
      <p>Calories: {{ session.calories }}</p>
    </div>
  </div>
</template>