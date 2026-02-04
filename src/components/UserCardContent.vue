<!-- OLD LOOK -->
<!-- <template>
    <div class="flex flex-col h-full justify-between">
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

            <span v-else class="px-4 py-1 rounded-full text-sm font-semibold bg-slate-300 text-slate-700 shadow-sm opacity-90 backdrop-blur-sm"> NO MAX HR </span>
        </div>

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
</template> -->
<template>
  <div class="h-full w-full flex items-center justify-center">
    <div
      class="w-full h-full flex flex-col items-center justify-center text-center
             rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200
             shadow-md px-12 py-10"
    >
      <!-- Header -->
      <div class="flex flex-col items-center gap-5 mb-10">
        <img
          src="https://ui-avatars.com/api/?name=Client"
          alt="avatar"
          class="w-28 h-28 rounded-full border-4 border-slate-200 shadow-md"
        />

        <h2 class="text-5xl font-extrabold text-slate-900 leading-tight">
          {{ name }}
        </h2>

        <!-- Zone badge -->
        <span
          v-if="max_heart_rate_value"
          :class="[
            'px-8 py-3 rounded-full text-2xl font-extrabold uppercase tracking-wide shadow-md opacity-95',
            zoneColor(bpm),
          ]"
        >
          {{ zoneLabel(bpm, max_heart_rate_value) }}
        </span>

        <span
          v-else
          class="px-8 py-3 rounded-full text-2xl font-extrabold bg-slate-200 text-slate-700 shadow-md opacity-95"
        >
          NO MAX HR
        </span>
      </div>

      <!-- Hero HR -->
      <div class="mb-12">
        <div class="text-slate-500 text-2xl font-semibold uppercase tracking-wide mb-4">
          Heart Rate
        </div>

        <div class="flex items-baseline justify-center gap-6">
          <span class="text-9xl font-black leading-none" :class="bpmTextColor(bpm)">
            {{ bpm }}
          </span>
          <span class="text-4xl text-slate-400 font-bold">BPM</span>
        </div>
      </div>

      <!-- Secondary metrics -->
      <div class="w-full grid grid-cols-2 gap-8">
        <div class="rounded-2xl border border-slate-200 bg-white/75 p-8 shadow-md">
          <div class="text-slate-500 text-xl font-semibold uppercase tracking-wide mb-4">
            Calories Burned
          </div>
          <div class="text-orange-500 text-6xl font-black leading-none tabular-nums">
            {{ calories }}
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white/75 p-8 shadow-md">
          <div class="text-slate-500 text-xl font-semibold uppercase tracking-wide mb-4">
            Training Time
          </div>
          <div class="text-blue-600 text-6xl font-black leading-none tabular-nums">
            {{ duration }}
          </div>
        </div>
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
const { pausedByClient, pausedAtByClient, pausedSecondsByClient } = storeToRefs(wsStore);

// osnovni podaci
const bpm = computed(() => bpmsForGym.value[props.clientId] || 0);
const calories = computed(() => caloriesForGym.value[props.clientId] || 0);
const name = computed(() => client_name.value[props.clientId] || 'Client Name');
const started_at = computed(() => startedAt.value[props.clientId] || null);
const max_heart_rate_value = computed(() => max_heart_rate.value[props.clientId] || null);
const paused = computed(() => pausedByClient.value?.[props.clientId] ?? false);
const pausedAt = computed(() => pausedAtByClient.value?.[props.clientId] ?? null);
const pausedSeconds = computed(() => pausedSecondsByClient.value?.[props.clientId] ?? 0);


// lokalni timer u sekundama
const elapsedSeconds = ref(0);
let intervalId = null;

function startTicking() {
  if (intervalId) return;
  intervalId = setInterval(recalcElapsed, 1000);
}

function stopTicking() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
}

function recalcElapsed() {
  const start = started_at.value;
  if (!start) { elapsedSeconds.value = 0; return; }

  const startMs = (start instanceof Date ? start : new Date(start)).getTime();
  if (Number.isNaN(startMs)) { elapsedSeconds.value = 0; return; }

  const pausedTotal = Number(pausedSeconds.value || 0);

  if (pausedAt.value) {
    const pauseMs = new Date(pausedAt.value).getTime();
    elapsedSeconds.value = Math.max(0, Math.floor((pauseMs - startMs) / 1000) - pausedTotal);
    return;
  }

  elapsedSeconds.value = Math.max(0, Math.floor((Date.now() - startMs) / 1000) - pausedTotal);
}

function formatDuration(totalSec = 0) {
  totalSec = Math.max(0, Number(totalSec) || 0);

  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const duration = computed(() => formatDuration(elapsedSeconds.value));

onMounted(() => {
  recalcElapsed();
  if (!paused.value) startTicking();
});


watch([paused, pausedAt, pausedSeconds, started_at], () => {
  recalcElapsed();
  if (paused.value) stopTicking();
  else startTicking();
});

onBeforeUnmount(() => {
    // if (intervalId) clearInterval(intervalId);
    stopTicking();
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
