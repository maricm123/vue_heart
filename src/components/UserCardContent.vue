<template>
    <div class="flex flex-col h-full justify-between">
        <!-- TOP SECTION -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
                <img src="https://ui-avatars.com/api/?name=Client" alt="avatar" class="w-14 h-14 rounded-full border-2 border-slate-200" />
                <div>
                    <h2 class="text-lg font-semibold">{{ name }}</h2>
                </div>
            </div>

            <span v-if="max_heart_rate_value" :class="['px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wide shadow-sm opacity-90 backdrop-blur-sm', zoneColor(bpm)]">
                {{ zoneLabel(bpm, max_heart_rate_value) }}
            </span>

            <!-- Ako nema max HR, prikaži neutralni badge -->
            <span v-else class="px-4 py-1 rounded-full text-sm font-semibold bg-slate-300 text-slate-700 shadow-sm opacity-90 backdrop-blur-sm"> NO MAX HR </span>
        </div>

        <!-- DATA SECTION -->
        <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
                <span class="text-slate-500 text-2xl">Heart Rate</span>
                <span class="font-bold text-xl" :class="bpmTextColor(bpm)"> {{ bpm }} BPM </span>
            </div>

            <div class="flex items-center justify-between">
                <span class="text-slate-500 text-2xl">Calories Burned</span>
                <span class="text-orange-500 font-semibold text-lg">
                    {{ calories }}
                </span>
            </div>

            <div class="flex items-center justify-between">
                <span class="text-slate-500 text-2xl">Training Time</span>
                <span class="text-blue-600 font-bold text-lg">
                    {{ duration }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { webSocketStore } from '@/store/webSocketStore';
import { storeToRefs } from 'pinia';

const props = defineProps({
    clientId: { type: String, required: true }
});

const wsStore = webSocketStore();
const { bpmsForGym, caloriesForGym, client_name, startedAt, max_heart_rate } = storeToRefs(wsStore);

// osnovni podaci
const bpm = computed(() => bpmsForGym.value[props.clientId] || 0);
const calories = computed(() => caloriesForGym.value[props.clientId] || 0);
const name = computed(() => client_name.value[props.clientId] || 'Client Name');
const started_at = computed(() => startedAt.value[props.clientId] || null);
const max_heart_rate_value = computed(() => max_heart_rate.value[props.clientId] || null);

// lokalni timer u sekundama
const elapsedSeconds = ref(0);
let intervalId = null;

function recalcElapsed() {
    const start = started_at.value;
    if (!start) {
        elapsedSeconds.value = 0;
        return;
    }

    // u storu verovatno već čuvaš Date, ali budimo sigurni
    const startDate = start instanceof Date ? start : new Date(start);
    if (isNaN(startDate.getTime())) {
        elapsedSeconds.value = 0;
        return;
    }

    elapsedSeconds.value = Math.floor((Date.now() - startDate.getTime()) / 1000);
}

// format mm:ss
const duration = computed(() => {
    const total = elapsedSeconds.value;
    const mm = String(Math.floor(total / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
});

onMounted(() => {
    recalcElapsed();
    intervalId = setInterval(recalcElapsed, 1000);
});

// ako se started_at promeni (npr. novi trening) – reset i ponovni izračun
watch(started_at, () => {
    recalcElapsed();
});

onBeforeUnmount(() => {
    if (intervalId) clearInterval(intervalId);
});

function getPercentOfMax(bpm, max) {
    if (!max || max <= 0) return 0;
    return (bpm / max) * 100;
}

function getZone(bpm, max) {
    if (!bpm) return 0;
    const pct = getPercentOfMax(bpm, max);

    if (pct < 50) return 0;
    if (pct < 60) return 1;
    if (pct < 70) return 2;
    if (pct < 80) return 3;
    if (pct < 90) return 4;
    if (pct <= 100) return 5;
    return 6;
}

function zoneLabel(bpm, max) {
    const zone = getZone(bpm, max);
    return `Zone ${zone}`;
}

function zoneColor(bpm) {
    const max = max_heart_rate_value.value;
    if (!max) return 'bg-slate-400 text-white'; // default
    const zone = getZone(bpm, max);

    switch (zone) {
        case 0:
            return 'bg-slate-400 text-white';
        case 1:
            return 'bg-green-500 text-white';
        case 2:
            return 'bg-yellow-400 text-slate-900';
        case 3:
            return 'bg-orange-500 text-white';
        case 4:
            return 'bg-red-500 text-white';
        case 5:
            return 'bg-pink-500 text-white';
        case 6:
            return 'bg-rose-600 text-white'; // over MAX HR
        default:
            return 'bg-slate-400 text-white';
    }
}

function bpmTextColor(bpm) {
    const max = max_heart_rate_value.value;
    if (!max) return 'text-slate-400'; // default
    const zone = getZone(bpm, max);

    switch (zone) {
        case 0:
            return 'text-slate-400';
        case 1:
            return 'text-green-500';
        case 2:
            return 'text-yellow-500';
        case 3:
            return 'text-orange-500';
        case 4:
            return 'text-red-500';
        case 5:
            return 'text-pink-500';
        case 6:
            return 'text-rose-600';
        default:
            return 'text-slate-400';
    }
}
</script>
