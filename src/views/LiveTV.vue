<template>
  <div class="flex justify-center items-center h-screen bg-surface-50">
    <Button
      label="➕ Add New User"
      icon="pi pi-plus"
      class="p-button-raised p-button-lg"
      @click="onAddUserClick"
    />
  </div>
</template>

<script setup lang="ts">
function onAddUserClick() {
  console.log("Add New User clicked");
  // Ovdje ćemo kasnije otvoriti modal
}
</script>