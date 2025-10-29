<script setup>
import { ref, onMounted } from 'vue';
import { api_coach } from '@/services/api';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

const props = defineProps({ clientId: Number });

const trainingSessions = ref([]);
const filters = ref();
const loading = ref(true);

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        date: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] }
    };
};
initFilters();

const clearFilter = () => initFilters();

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

onMounted(async () => {
    try {
        const res = await api_coach.get(`/get-training-sessions-per-client/${props.clientId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } });
        trainingSessions.value = res.data;
    } catch (err) {
        console.error('Failed to load training sessions:', err);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="card mt-6">
        <h3>Training sessions</h3>

        <DataTable v-model:filters="filters" :value="trainingSessions" paginator showGridlines :rows="10" dataKey="id" filterDisplay="menu" :loading="loading" :globalFilterFields="['title', 'calories_burned', 'duration_in_minutes']">
            <template #header>
                <div class="flex justify-between">
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" variant="outlined" @click="clearFilter()" />
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
                    </IconField>
                </div>
            </template>

            <template #empty>No training sessions found.</template>
            <template #loading>Loading training sessions...</template>

            <Column field="title" header="Session Name" style="min-width: 12rem" />
            <Column field="start" header="Date" style="min-width: 10rem">
                <template #body="{ data }">{{ formatDate(data.start) }}</template>
            </Column>

            <Column field="calories_burned" header="Cal" />
            <Column field="duration" header="Duration" />
            <Column header="Actions" style="min-width: 8rem">
                <template #body="{ data }">
                    <Button label="Detail" size="small" icon="pi pi-arrow-right" @click="$router.push({ name: 'trainingSessionDetail', params: { id: data.id } })" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
