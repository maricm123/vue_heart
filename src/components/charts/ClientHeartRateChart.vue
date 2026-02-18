<script setup>
import { ref, onMounted, watch } from "vue";
import { useLayout } from "@/layout/composables/layout";

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const pieData = ref(null);
const pieOptions = ref(null);

const setPieData = () => {
  const style = getComputedStyle(document.documentElement);
  pieData.value = {
    labels: ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"],
    datasets: [
      {
        data: [540, 325, 702, 421, 237],
        backgroundColor: [
          style.getPropertyValue("--p-indigo-500"),
          style.getPropertyValue("--p-purple-500"),
          style.getPropertyValue("--p-teal-500"),
        ],
      },
    ],
  };
  pieOptions.value = {
    plugins: {
      legend: {
        labels: { color: style.getPropertyValue("--text-color") },
      },
    },
  };
};

onMounted(() => setPieData());
watch([getPrimary, getSurface, isDarkTheme], () => setPieData());
</script>

<template>
  <div class="card flex flex-col items-center">
    <h3 class="mb-4 font-semibold text-lg">Soon ...</h3>
    <Chart type="doughnut" :data="pieData" :options="pieOptions" />
  </div>
</template>
