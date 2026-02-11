<script setup>
import { onMounted } from 'vue'
import { useTenant } from '@/layout/composables/useTenant'
import { getCurrentTenant } from '@/services/tenantSevice'

const { tenant, tenantReady } = useTenant()

onMounted(async () => {
    try {
        tenant.value = await getCurrentTenant()
    } catch (e) {
        tenant.value = null
    } finally {
        tenantReady.value = true
    }
})
</script>

<template>
    <div v-if="!tenantReady" class="h-screen flex items-center justify-center">
        Loading...
    </div>

    <router-view v-else />
</template>

<style scoped></style>
