<script setup>
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import { getDashboardInfo } from '@/services/dashboardService';
import { ref, computed, onMounted } from 'vue';

const dashboardInfo = ref(null)
const loading = ref(true)

const displayName = computed(() => {
    if (loading.value) return '...'
    if (!dashboardInfo.value?.coach_name) return 'Guest'
    return dashboardInfo.value.coach_name
})

onMounted(async () => {
    try {
        dashboardInfo.value = await getDashboardInfo()
    } catch (e) {
        dashboardInfo.value = null
    } finally {
        loading.value = false
    }
});

</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 mb-6">
            <div class="p-6 rounded-xl shadow 
            bg-white dark:bg-surface-900 
            flex justify-between items-center">
    <div>
        <h1 class="text-3xl font-bold 
                   text-surface-900 dark:text-surface-0">
            Welcome, {{ displayName }}!
        </h1>

        <p class="text-surface-600 dark:text-surface-400 text-lg">
            Here’s what’s happening in <span class="font-bold">{{ dashboardInfo?.gym_name }}</span> right now.
        </p>
    </div>
</div>
        </div>

        <StatsWidget />

        <div class="col-span-12 xl:col-span-6">
            <RecentSalesWidget />
            <BestSellingWidget />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <RevenueStreamWidget />
            <NotificationsWidget />
        </div>
    </div>
</template>
