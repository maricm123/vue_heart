<script setup>
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 mb-6">
    <div class="p-6 rounded-xl shadow bg-white flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold text-surface-900">Welcome, Coach!</h1>
            <p class="text-surface-600 text-lg">
                Here’s what’s happening in your gym right now.
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
