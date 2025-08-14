<template>
  <div class="flex justify-center items-center min-h-screen bg-gray-50">
    <Button 
      label="➕ Add New User" 
      icon="pi pi-plus" 
      class="p-button-lg p-button-rounded shadow-l mb-6"
      @click="showUserModal = true"
    />

    <!-- Modal za dodavanje usera -->
    <Dialog 
      v-model:visible="showUserModal" 
      header="Select a User" 
      :modal="true" 
      :closable="true"
      class="w-96"
    >
      <Listbox
        :options="availableUsers"
        optionLabel="first_name"
        optionValue="id"
        @change="selectUserFromList"
        class="w-full"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Listbox from 'primevue/listbox'

interface BackendUser {
  id: number
  first_name: string
  last_name: string
}

const showUserModal = ref(false)
const availableUsers = ref<BackendUser[]>([])

const selectUserFromList = (event: any) => {
  console.log('User selected:', event.value)
  showUserModal.value = false
}

onMounted(() => {
  fetch("http://mygym.localhost:8000/api_heart/get-all-users")
    .then(res => res.json())
    .then(data => availableUsers.value = data)
    .catch(err => console.error("Failed to fetch users:", err))
})
</script>

<style scoped>
/* Ovde možeš dodati custom stilove ako želiš */
</style>