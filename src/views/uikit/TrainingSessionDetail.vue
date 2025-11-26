<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'primevue/chart';
import { useRoute } from 'vue-router';
import { getTrainingSessionDetailsAndMetrics, deleteTrainingSession } from '@/services/trainingSessionsService'; // your API service
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

// Toast for notifications
const toast = useToast();
const route = useRoute();
const displayConfirmation = ref(false);
const chartData = ref({});
const chartOptions = ref({});
const summary = ref({});
const zones = ref({});

const bpmData = ref([]);

const zoneChartData = ref({});
const zoneChartOptions = ref({});

const breadcrumbHome = ref({ icon: 'pi pi-home', to: '/' });
const breadcrumbItems = ref([{ label: 'Client list' }, { label: 'Client detail' }, { label: 'Training Session Detail' }]);

const sessionId = route.params.id;
const router = useRouter();
const client = ref(null);

onMounted(async () => {
    const response = await getTrainingSessionDetailsAndMetrics(sessionId);

    client.value = response.client;

    const summaryMetrics = response.summary_metrics;
    const points = summaryMetrics.points;
    const summaryData = summaryMetrics.summary;

    // BPM array
    bpmData.value = points.map((p) => p.bpm);

    // Labels (X axis) — index or time
    // const labels = points.map((p, i) => `${i * summaryMetrics.points_per_minute * 10}s`)
    // ✅ REAL TIMESTAMPS FOR X-AXIS (format HH:MM:SS)
    const labels = points.map((p) => {
        const d = new Date(p.ts);
        return d.toLocaleTimeString('en-US', { hour12: false });
    });

    // Chart Data
    chartData.value = {
        labels,
        datasets: [
            {
                label: 'Heart Rate (BPM)',
                data: bpmData.value,
                borderColor: '#4CAF50',
                tension: 0.5,
                fill: false
            }
        ]
    };

    summary.value = summaryData;
    zones.value = summaryData.hr_zones_seconds;

    // chartOptions.value = {
    //   responsive: true,
    //   plugins: {
    //     legend: { labels: { color: '#fff' } }
    //   },
    //   scales: {
    //     x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
    //     y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    //   }
    // }

    // ✅ BAR CHART FOR ZONES
    zoneChartData.value = {
        labels: ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'],
        datasets: [
            {
                label: 'Time in Zone (seconds)',
                data: [zones.value.z1, zones.value.z2, zones.value.z3, zones.value.z4, zones.value.z5],
                backgroundColor: ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336']
            }
        ]
    };

    // zoneChartOptions.value = {
    //   responsive: true,
    //   plugins: {
    //     legend: { labels: { color: '#fff' } }
    //   },
    //   scales: {
    //     x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
    //     y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    //   }
    // }
});

function openConfirmation() {
    displayConfirmation.value = true;
}

function closeConfirmation() {
    displayConfirmation.value = false;
}

const deleteTrainingSessionFunction = async (sessionId, clientId) => {
    console.log(sessionId, clientId);
  try {
    await deleteTrainingSession(sessionId);
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Training session deleted successfully!', life: 5000 });
    // Redirect back to the client detail page
    router.push(`/uikit/clientDetail/${clientId}`);
  } catch (err) {
    const errorMsg = err.response?.data?.errors?.[0]?.message || 'Failed to delete session';
    toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
  }
};
</script>

<template>
    <div class="card">
        <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" />
    </div>

    <div class="card p-4">
        <h2 class="text-xl font-bold mb-4">Training Session Detail</h2>

        <!-- Heart Rate Chart -->
        <Chart type="line" :data="chartData" :options="chartOptions" class="mt-4" />

        <!-- Summary -->
        <div class="mt-6">
            <h3 class="text-lg font-semibold mb-2">Heart Rate Zones</h3>
            <Chart type="bar" :data="zoneChartData" :options="zoneChartOptions" class="mt-4" />
        </div>
        <div class="mt-6">
            <h3 class="text-lg font-semibold mb-2">Session Summary</h3>
            <p><strong>Max BPM:</strong> {{ summary.max_hr }}</p>
            <p><strong>Avg BPM:</strong> {{ summary.avg_hr }}</p>
            <p><strong>Duration:</strong> {{ summary.duration_seconds }} sec</p>
            <p><strong>Calories:</strong> {{ summary.calories }}</p>
        </div>
    </div>
    <h3>Danger zone</h3>
        <div class="card">
                <div class="font-semibold text-xl mb-4">Delete training session</div>
                <Button label="Delete" icon="pi pi-trash" severity="danger" style="width: auto" @click="openConfirmation" />
                <Dialog header="Confirmation" v-model:visible="displayConfirmation" :style="{ width: '350px' }" :modal="true">
                    <div class="flex items-center justify-center">
                        <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
                        <span>Are you sure you want to delete this training session?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" @click="closeConfirmation" text severity="secondary" />
                        <Button label="Yes" icon="pi pi-check" @click="deleteTrainingSessionFunction(sessionId, client)"  severity="danger" outlined autofocus />
                    </template>
                </Dialog>
            </div>
</template>
