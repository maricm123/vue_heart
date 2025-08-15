<template>
  <div class="flex justify-center items-center h-screen bg-surface-50">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">Welcome to Live TV</h1>
      </div>
      <div class="grid gap-4">
  <div v-for="u in activeUsers" :key="u.id" class="col-12 md:col-4">
    <!-- Vuetify or PrimeVue card — just show some fields -->
    <div class="p-4 rounded border">
      <div class="font-semibold">{{ u.user.first_name }} {{ u.user.last_name }}</div>
      <div v-if="u.bpm !== null">❤️ {{ u.bpm }} bpm</div>
      <div v-if="u.sessionActive">▶️ Active</div>
    </div>
  </div>
</div>

  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useUserStore } from '../stores/main';
// LiveTV

const store = useUserStore()
const activeUsers = computed(() => store.activeUsers)

watch(activeUsers, v => console.log('Active users changed:', v))
console.log('Active Users now:', activeUsers.value)


function onAddUserClick() {
  console.log("Add New User clicked");
  // Ovdje ćemo kasnije otvoriti modal
}
</script>