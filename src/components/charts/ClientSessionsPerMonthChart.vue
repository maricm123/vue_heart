<script setup>
import { ref, onMounted, watch } from "vue";
import { useLayout } from "@/layout/composables/layout";

const props = defineProps({
  zones: {
    type: Object,
    required: true,
    default: () => ({
      zone1: 0,
      zone2: 0,
      zone3: 0,
      zone4: 0,
      zone5: 0,
      avg_bpm: 0
    })
  }
});

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const pieData = ref(null);
const pieOptions = ref(null);

// ✅ Heart icon
const heartIcon = "❤️";

const setPieData = () => {
  const style = getComputedStyle(document.documentElement);

  // ✅ 5 unique colors (Option B)
  const colors = [
    style.getPropertyValue("--p-indigo-500"),
    style.getPropertyValue("--p-purple-500"),
    style.getPropertyValue("--p-teal-500"),
    style.getPropertyValue("--p-orange-500"),
    style.getPropertyValue("--p-pink-500"),
  ];

  pieData.value = {
    labels: ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"],
    datasets: [
      {
        data: [
          props.zones.zone1,
          props.zones.zone2,
          props.zones.zone3,
          props.zones.zone4,
          props.zones.zone5
        ],
        backgroundColor: colors,
        hoverBackgroundColor: colors
      }
    ]
  };

  pieOptions.value = {
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: style.getPropertyValue("--text-color") }
      }
    }
  };
};

onMounted(() => setPieData());
watch([getPrimary, getSurface, isDarkTheme], () => setPieData());
</script>

<template>
  <div class="card flex flex-col items-center">
    <h3 class="mb-4 font-semibold text-lg">
      Heart Rate Zones
    </h3>

    <!-- ✅ Doughnut chart -->
    <div class="relative w-64 h-64">
      <Chart type="doughnut" :data="pieData" :options="pieOptions" />

      <!-- ✅ Center overlay with BPM -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span class="text-4xl font-bold">{{ heartIcon }} {{ zones.avg_bpm }}</span>
        <span class="text-sm opacity-70">avg bpm</span>
      </div>
    </div>
  </div>
</template>
