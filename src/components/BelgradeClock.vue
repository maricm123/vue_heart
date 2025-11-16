<template>
    <!-- <Card class="clock-card">
    <div class="flex flex-col items-center justify-center text-center p-4">
      <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
        <i class="pi pi-map-marker text-primary"></i>
        Belgrade, Serbia (GMT+01)
      </div>

      <div class="text-5xl font-bold text-primary mb-2">
        {{ time || '--:--:--' }}
      </div>

      <div class="text-lg text-gray-500">
        {{ date || 'Loading date...' }}
      </div>
    </div>
  </Card> -->

    <div class="card">
        <div>
            <div class="font-semibold text-xl text-center">Current time</div>
        </div>

        <div class="font-semibold text-xl text-center">{{ time }}</div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const time = ref('');
const date = ref('');

function updateClock() {
    const now = new Date();

    const belgradeTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Belgrade',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(now);

    const belgradeDate = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Belgrade',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(now);

    time.value = belgradeTime;
    date.value = belgradeDate;
}

let interval = null;

onMounted(() => {
    updateClock();
    interval = setInterval(updateClock, 1000);
});

onUnmounted(() => {
    clearInterval(interval);
});
</script>

<style scoped>
.clock-card {
    width: 300px;
    border-radius: 16px;
    background: var(--surface-card);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.text-primary {
    color: var(--primary-color, #3b82f6);
}
.text-gray-400 {
    color: #9ca3af;
}
.text-gray-500 {
    color: #6b7280;
}
</style>
