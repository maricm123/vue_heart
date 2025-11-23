<template>
    <div class="h-screen bg-white text-slate-900 flex flex-col overflow-hidden">
        <!-- HEADER -->
        <header class="flex justify-between items-center px-10 py-5 shadow-lg" style="background-color: #ff474c; color: white">
            <!-- LEFT: Logo + Title -->
            <div class="flex items-center">
                <div>
                    <h1 class="text-2xl text-white font-bold">HeartApp</h1>
                </div>
            </div>

            <!-- RIGHT: Custom Clock -->
            <div class="flex flex-col items-end text-white">
                <div class="text-4xl font-bold leading-none">
                    {{ time }}
                </div>
                <div class="text-2xl opacity-90 -mt-1">
                    {{ date }}
                </div>
            </div>
        </header>

        <!-- MAIN CONTENT / GRID -->
        <main class="flex-1 px-8 py-6 overflow-hidden">
            <!-- No users -->
            <div v-if="activeUsers === 0" class="h-full flex items-center justify-center">
                <p class="text-slate-500 text-5xl">No active training sessions at the moment</p>
            </div>

            <!-- 1+ users → single dynamic grid -->
            <div v-else class="h-full">
                <div class="grid h-full gap-6" :style="gridStyle">
                    <div v-for="[clientId] in bpmsEntries" :key="clientId" :class="[cardBaseClass, { 'h-full': activeUsers === 1 }]">
                        <UserCardContent :client-id="clientId" />
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { computed, onMounted, watchEffect, ref, onBeforeUnmount } from 'vue';
import { webSocketStore } from '@/store/webSocketStore';
import { storeToRefs } from 'pinia';
import UserCardContent from '@/components/UserCardContent.vue';

const wsStore = webSocketStore();
const { bpmsForGym } = storeToRefs(wsStore);

// entries like before
const bpmsEntries = computed(() => Object.entries(bpmsForGym.value));

// number of active users
const activeUsers = computed(() => bpmsEntries.value.length);

// dynamic grid style
const gridStyle = ref({});

// base class for card
const cardBaseClass = 'bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col justify-between';

// adjust grid according to number of users
watchEffect(() => {
    const count = activeUsers.value;

    if (count <= 0) {
        gridStyle.value = {};
        return;
    }

    if (count === 1) {
        gridStyle.value = {
            gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr'
        };
    } else if (count === 2) {
        gridStyle.value = {
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr'
        };
    } else if (count <= 4) {
        gridStyle.value = {
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr'
        };
    } else if (count <= 6) {
        gridStyle.value = {
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows: '1fr 1fr'
        };
    } else {
        gridStyle.value = {
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows: '1fr 1fr 1fr'
        };
    }
});

// HEADER clock
const time = ref('');
const date = ref('');
let intervalId = null;

function updateClock() {
    const now = new Date();

    time.value = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    date.value = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

onMounted(() => {
    wsStore.connectWholeGym();
    updateClock();
    intervalId = setInterval(updateClock, 1000);
});

onBeforeUnmount(() => {
    clearInterval(intervalId);
});
</script>

<style scoped>
/* No scrollbars on TV */
::-webkit-scrollbar {
    display: none;
}
</style>
