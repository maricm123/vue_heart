<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Chart from "primevue/chart";
import Skeleton from "primevue/skeleton";

import {
  getTrainingSessionDetailsAndMetrics,
  deleteTrainingSession,
} from "@/services/trainingSessionsService";

const toast = useToast();
const route = useRoute();
const router = useRouter();

const sessionId = route.params.id;

// UI
const loading = ref(true);
const displayConfirmation = ref(false);

// ✅ client je samo ID
const clientId = ref(null);

// (optional) ako backend vrati ime/prezime kao stringove
const clientLabel = ref(null);

const summary = ref({});
const zones = ref(null);
const hasHrZones = ref(false);

const chartData = ref({ labels: [], datasets: [] });
const chartOptions = ref({ responsive: true, maintainAspectRatio: false });

const zoneChartData = ref({ labels: [], datasets: [] });
const zoneChartOptions = ref({ responsive: true, maintainAspectRatio: false });

function openConfirmation() {
  displayConfirmation.value = true;
}
function closeConfirmation() {
  displayConfirmation.value = false;
}

function goBack() {
  if (clientId.value) {
    router.push(`/clientDetail/${clientId.value}?tab=sessions`);
    return;
  }
  router.back();
}

function goToClientMetrics() {
  if (!clientId.value) return;
  router.push(`/clientDetail/${clientId.value}?tab=metrics`);
}

async function deleteTrainingSessionFunction() {
  try {
    await deleteTrainingSession(sessionId);

    toast.add({
      severity: "success",
      summary: "Deleted",
      detail: "Training session deleted successfully!",
      life: 4000,
    });

    // ✅ posle brisanja vrati na client -> sessions tab
    if (clientId.value) router.push(`/clientDetail/${clientId.value}?tab=sessions`);
    else router.push("/ClientListOfCoach");
  } catch (err) {
    const msg =
      err?.response?.data?.errors?.[0]?.message || "Failed to delete session";

    toast.add({
      severity: "error",
      summary: "Error",
      detail: msg,
      life: 5000,
    });
  } finally {
    displayConfirmation.value = false;
  }
}

onMounted(async () => {
  loading.value = true;

  try {
    const response = await getTrainingSessionDetailsAndMetrics(sessionId);

    console.log("TRAINING DETAIL RESPONSE:", response);

    // ✅ client is ID
    clientId.value =
      response?.client ?? // <-- glavni slučaj kod tebe
      response?.client_id ??
      response?.clientId ??
      null;

    // OPTIONAL: ako backend nekad šalje ime/prezime kao string
    // (ako nema — ostaće null i nećemo prikazati)
    clientLabel.value =
      response?.client_name ??
      response?.client_full_name ??
      null;

    const summaryMetrics = response?.summary_metrics ?? {};
    const points = summaryMetrics?.points ?? [];
    const summaryData = summaryMetrics?.summary ?? {};

    summary.value = summaryData;
    zones.value = summaryData?.hr_zones_seconds ?? null;
    hasHrZones.value = !!summaryData?.has_max_hr;

    // ✅ LINE chart BPM — STARE BOJE
    if (points.length) {
      const bpm = points.map((p) => p.bpm);
      const labels = points.map((p) => {
        const d = new Date(p.ts);
        return d.toLocaleTimeString("en-US", { hour12: false });
      });

      chartData.value = {
        labels,
        datasets: [
          {
            label: "Heart Rate (BPM)",
            data: bpm,
            borderColor: "#4CAF50",
            tension: 0.5,
            fill: false,
          },
        ],
      };
    } else {
      chartData.value = { labels: [], datasets: [] };
    }

    // ✅ ZONES chart — STARE BOJE
    if (zones.value) {
      zoneChartData.value = {
        labels: ["Z1", "Z2", "Z3", "Z4", "Z5"],
        datasets: [
          {
            label: "Time in Zone (seconds)",
            data: [
              zones.value?.z1 ?? 0,
              zones.value?.z2 ?? 0,
              zones.value?.z3 ?? 0,
              zones.value?.z4 ?? 0,
              zones.value?.z5 ?? 0,
            ],
            backgroundColor: [
              "#4CAF50",
              "#8BC34A",
              "#FFC107",
              "#FF9800",
              "#F44336",
            ],
          },
        ],
      };
    } else {
      zoneChartData.value = { labels: [], datasets: [] };
    }
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail:
        err?.response?.data?.errors?.[0]?.message ||
        "Failed to load training session.",
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="loading" class="card p-4">
    <Skeleton height="3rem" class="mb-2" />
    <div class="text-xl font-bold mb-4">Training session detail</div>
    <div class="flex flex-col gap-3">
      <div class="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
      <div class="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
      <div class="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
      <div class="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
    </div>
  </div>

  <div v-else>
    <Fluid>
      <!-- Sticky header (isti stil kao client detail) -->
      <div class="client-header">
        <button class="client-back" @click="goBack" aria-label="Back">
          <i class="pi pi-arrow-left"></i>
        </button>

        <div class="client-title">
          <div class="client-name">Training session</div>
          <div class="client-subtitle">
            <span v-if="clientLabel">{{ clientLabel }}</span>
            <span v-else>Training detail</span>
          </div>
        </div>

        <!-- Optional: shortcut to client -->
        <div v-if="clientId" class="flex items-center gap-2">
          <Button
            icon="pi pi-user"
            text
            rounded
            @click="router.push(`/clientDetail/${clientId}?tab=sessions`)"
            aria-label="Client"
          />
        </div>
      </div>

      <div class="client-page">
        <TabView>
          <TabPanel header="Overview">
            <div class="card">
              <h3 class="section-title">Session Summary</h3>

              <div class="grid gap-2">
                <p><strong>Max BPM:</strong> {{ summary.max_hr }}</p>
                <p><strong>Avg BPM:</strong> {{ summary.avg_hr }}</p>
                <p><strong>Duration:</strong> {{ summary.duration_seconds }} sec</p>
                <p><strong>Calories:</strong> {{ summary.calories }}</p>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Charts">
            <div class="card">
              <h3 class="section-title">Heart Rate</h3>

              <div v-if="!chartData?.datasets?.length" class="p-4 border rounded bg-gray-50">
                <i class="pi pi-info-circle mr-2"></i>
                No BPM data recorded for this session.
              </div>

              <div v-else style="height: 340px">
                <Chart type="line" :data="chartData" :options="chartOptions" style="height: 100%" />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Zones">
            <div class="card">
              <h3 class="section-title">Heart Rate Zones</h3>

              <div v-if="hasHrZones && zoneChartData?.datasets?.length" style="height: 320px">
                <Chart type="bar" :data="zoneChartData" :options="zoneChartOptions" style="height: 100%" />
              </div>

              <div v-else class="mt-2 p-4 border border-cyan-300 bg-cyan-50 text-cyan-800 rounded">
                <i class="pi pi-info-circle mr-2"></i>
                For this training session, a maximum heart rate was not available, so time spent in heart rate zones could not be calculated. If you haven’t already, please set a maximum heart rate for this client to enable zone analysis in future
                <div class="mt-3">
                  <Button
                    v-if="clientId"
                    label="Set Max HR for client"
                    icon="pi pi-sliders-h"
                    severity="info"
                    @click="goToClientMetrics"
                  />
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Danger zone">
            <div class="card danger-card">
              <h3 class="section-title">Delete training session</h3>
              <p class="danger-text">
                This action cannot be undone. The training session will be permanently removed.
              </p>

              <Button
                label="Delete session"
                icon="pi pi-trash"
                severity="danger"
                class="w-full"
                @click="openConfirmation"
              />
            </div>
          </TabPanel>
        </TabView>
      </div>

      <Dialog
        header="Confirmation"
        v-model:visible="displayConfirmation"
        :style="{ width: '350px' }"
        :modal="true"
      >
        <div class="flex items-center justify-center">
          <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
          <span>Are you sure you want to delete this training session?</span>
        </div>

        <template #footer>
          <Button label="No" icon="pi pi-times" @click="closeConfirmation" text severity="secondary" />
          <Button label="Yes" icon="pi pi-check" @click="deleteTrainingSessionFunction" severity="danger" outlined autofocus />
        </template>
      </Dialog>
    </Fluid>
  </div>
</template>

<style scoped>
.client-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface-0);
  border-bottom: 1px solid var(--surface-200);
}

.client-back {
  border: none;
  background: transparent;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.client-title {
  flex: 1;
  min-width: 0;
}

.client-name {
  font-weight: 700;
  font-size: 18px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-subtitle {
  font-size: 13px;
  opacity: 0.7;
}

.client-page {
  padding-top: 12px;
}

.card {
  background: var(--surface-0);
  border: 1px solid var(--surface-200);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
}

.danger-card {
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.danger-text {
  opacity: 0.8;
  margin: 8px 0 14px;
  line-height: 1.4;
}
</style>
