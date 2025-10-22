<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'primevue/chart'

const bpmData = ref([])
const chartData = ref({})
const chartOptions = ref({})

const breadcrumbHome = ref({ icon: 'pi pi-home', to: '/' });
const breadcrumbItems = ref([{ label: 'Client list' }, { label: 'Client detail' }, { label: 'Training Session Detail' }]);

onMounted(() => {
  // Hardcoded BPM values (kasnije iz API-ja)
  bpmData.value = [95, 101, 110, 123, 141, 150, 147, 132, 120, 109, 102, 96]

  const labels = bpmData.value.map((_, i) => `${i} min`)

  chartData.value = {
    labels: labels,
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: bpmData.value,
        borderColor: '#4CAF50',
        tension: 0.4,
        fill: false
      }
    ]
  }

  chartOptions.value = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#fff' } }
    },
    scales: {
      x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  }
})
</script>

<template>
    <div class="card">
          <!-- <div class="font-semibold text-xl mb-4">Breadcrumb</div> -->
          <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" />
      </div>
  <div class="card p-4">
    <h2 class="text-xl font-bold mb-4">Training Session Detail</h2>

    <!-- Heart Rate Chart -->
    <Chart type="line" :data="chartData" :options="chartOptions" class="mt-4" />

    <!-- Summary -->
    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-2">Session Summary</h3>
      <p><strong>Max BPM:</strong> {{ Math.max(...bpmData) }}</p>
      <p><strong>Min BPM:</strong> {{ Math.min(...bpmData) }}</p>
      <p><strong>Avg BPM:</strong> {{ (bpmData.reduce((a,b) => a+b, 0) / bpmData.length).toFixed(1) }}</p>
    </div>
  </div>
</template>
