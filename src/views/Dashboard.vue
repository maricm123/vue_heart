<script setup>
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import { getDashboardInfo } from '@/services/dashboardService';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const dashboardInfo = ref(null);
const loading = ref(true);

const displayName = computed(() => {
    if (loading.value) return '...';
    if (!dashboardInfo.value?.coach_name) return 'Guest';
    return dashboardInfo.value.coach_name;
});

onMounted(async () => {
    try {
        dashboardInfo.value = await getDashboardInfo();
    } catch (e) {
        dashboardInfo.value = null;
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 mb-6">
            <div class="p-6 rounded-xl shadow bg-white dark:bg-surface-900 flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Welcome, {{ displayName }}!</h1>

                    <p class="text-surface-600 dark:text-surface-400 text-lg">
                        Here’s what’s happening in <span class="font-bold">{{ dashboardInfo?.gym_name }}</span> right now.
                    </p>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="col-span-12">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Total Clients -->
                <div class="card p-6 flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase">Total Clients</h3>
                        <i class="pi pi-users text-2xl text-blue-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ dashboardInfo?.total_clients || 0 }}</div>
                    <p class="text-xs text-surface-500 dark:text-surface-400 mt-2">Active clients</p>
                </div>

                <!-- Total Sessions -->
                <div class="card p-6 flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase">Total Sessions</h3>
                        <i class="pi pi-chart-bar text-2xl text-green-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ dashboardInfo?.total_sessions || 0 }}</div>
                    <p class="text-xs text-surface-500 dark:text-surface-400 mt-2">All time</p>
                </div>

                <!-- Active Sessions -->
                <div class="card p-6 flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase">Active Now</h3>
                        <i class="pi pi-play-circle text-2xl text-orange-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ dashboardInfo?.active_sessions || 0 }}</div>
                    <p class="text-xs text-surface-500 dark:text-surface-400 mt-2">In progress</p>
                </div>

                <!-- Sessions This Month -->
                <div class="card p-6 flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase">This Month</h3>
                        <i class="pi pi-calendar text-2xl text-purple-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ dashboardInfo?.sessions_this_month || 0 }}</div>
                    <p class="text-xs text-surface-500 dark:text-surface-400 mt-2">Sessions</p>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="col-span-12">
            <div class="card p-6">
                <h3 class="text-lg font-bold mb-4 text-surface-900 dark:text-surface-0">Quick Actions</h3>
                <div class="flex flex-wrap gap-3">
                    <Button label="Add New Client" icon="pi pi-plus" @click="router.push({ name: 'createClient' })" />
                    <Button label="View All Clients" icon="pi pi-users" severity="info" @click="router.push({ name: 'clientListOfCoach' })" />
                    <Button label="Training Calendar" icon="pi pi-calendar" severity="success" @click="router.push({ name: 'trainingCalendar' })" />
                    <Button label="Active Sessions" icon="pi pi-play-circle" severity="warning" @click="router.push({ name: 'coachTvPreview' })" />
                </div>
            </div>
        </div>

        <!-- <StatsWidget />

        <div class="col-span-12 xl:col-span-6">
            <RecentSalesWidget />
            <BestSellingWidget />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <RevenueStreamWidget />
            <NotificationsWidget />
        </div> -->
    </div>
</template>
