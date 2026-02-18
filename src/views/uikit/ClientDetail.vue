<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api_coach } from '@/services/api';
import ClientHeartRateChart from '@/components/charts/ClientHeartRateChart.vue';
import ClientTrainingSessions from '@/views/uikit/ClientTrainingSessions.vue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { getClientDetail } from '@/services/userService';
import { updateClient } from '@/services/userService';
import { deleteClient } from '@/services/userService';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import MaxHeartRateField from '@/components/MaxHeartRateField.vue';
// Toast for notifications
const toast = useToast();
// route + base state
const route = useRoute();
const clientId = route.params.id;
const displayConfirmation = ref(false);

const hrZones = [540, 325, 702, 421, 237];

const client = ref({
    user: { first_name: '', last_name: '', email: '', birth_date: null },
    height: null,
    weight: null,
    gender: null,
    max_heart_rate: null
});

// Max HR local reactive state
const max_heart_rate = ref(null);
const auto_calculate_max_hr = ref(false);

// track touched fields
const touched = ref({
    max_heart_rate: false
});

const loading = ref(true);

const gender = ref("");
const options = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

const router = useRouter();

onMounted(async () => {
    try {
        const res = await getClientDetail(clientId);
        client.value = res;
        gender.value = res.gender;
        max_heart_rate.value = res.max_heart_rate;
        auto_calculate_max_hr.value = res.auto_calculate_max_hr ?? false;
    } catch (err) {
        console.error('Failed to fetch client:', err);
    } finally {
        loading.value = false;
    }
});

watch(gender, (val) => (client.value.gender = val));

const updateClientFunction = async () => {
    try {
        await updateClient(clientId, client.value, max_heart_rate.value, auto_calculate_max_hr.value);
        alert('✅ Client updated successfully!');
    } catch (err) {
        alert('❌ Failed to update client');
    }
};

function openConfirmation() {
    displayConfirmation.value = true;
}

function closeConfirmation() {
    displayConfirmation.value = false;
}

const deleteClientFunction = async () => {
    try {
        await deleteClient(clientId);

        toast.add({
            severity: 'success',
            summary: 'Client Deleted',
            detail: 'The client was deleted successfully.',
            life: 3000
        });

        router.push('/uikit/ClientListOfCoach');
    } catch (err) {
        // Extract backend error message
        const backendError = err.response?.data?.errors?.[0]?.message || 'An unexpected error occurred.';

        toast.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: backendError,
            life: 4000
        });
    }
};
</script>

<template>
    <div v-if="loading" class="card p-4">
        <Skeleton height="3rem" class="mb-2" />
        <div class="text-xl font-bold mb-4">Client Information</div>
        <div class="flex flex-col gap-3">
            <div class="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
            <div class="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
            <div class="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
            <div class="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
            <div class="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
        </div>
    </div>
    <div v-else>
        <Fluid>
            <!-- Sticky header -->
            <div class="client-header">
                <button class="client-back" @click="router.back()" aria-label="Back">
                    <i class="pi pi-arrow-left"></i>
                </button>

                <div class="client-title">
                    <div class="client-name">{{ client?.user?.first_name }} {{ client?.user?.last_name }}</div>
                    <div class="client-subtitle">Client detail</div>
                </div>
            </div>

            <!-- Content -->
            <div class="client-page">
                <TabView>
                    <!-- OVERVIEW -->
                    <TabPanel header="Overview">
                        <div class="grid gap-4">
                            <div class="card client-overview">
                                <h3 class="section-title">Client Information</h3>

                                <div class="flex flex-col gap-2 field">
                                    <label class="field-label">First Name</label>
                                    <input v-model="client.user.first_name" class="input" />

                                    <label class="field-label">Last Name</label>
                                    <input v-model="client.user.last_name" class="input" />

                                    <label class="field-label">Email (cannot update)</label>
                                    <input v-model="client.user.email" class="input input-readonly" readonly />

                                    <label class="field-label">Gender</label>
                                    <SelectButton v-model="gender" :options="options" option-label="label" optionValue="value" size="large" />

                                    <label class="field-label">Height</label>
                                    <input v-model="client.height" class="input" />

                                    <label class="field-label">Weight</label>
                                    <input v-model="client.weight" class="input" />

                                    <label class="field-label">Birth Date</label>
                                    <Calendar v-model="client.user.birth_date" dateFormat="yy-mm-dd" showIcon />
                                </div>

                                <button @click="updateClientFunction" class="btn-primary mt-4">Update</button>
                            </div>

                            <div class="card">
                                <MaxHeartRateField v-model="max_heart_rate" :autoCalculate="auto_calculate_max_hr" @update:autoCalculate="auto_calculate_max_hr = $event" :touched="touched.max_heart_rate" @blur="touched.max_heart_rate = true" />

                                <button @click="updateClientFunction" class="btn-primary mt-4">Update metrics</button>
                            </div>
                        </div>
                    </TabPanel>

                    <!-- SESSIONS -->
                    <TabPanel header="Training sessions">
                        <ClientTrainingSessions :clientId="clientId" />
                    </TabPanel>

                    <!-- METRICS -->
                    <TabPanel header="Metrics">
                        <div class="card">
                            <ClientHeartRateChart :clientId="clientId" />
                        </div>
                    </TabPanel>
                    <TabPanel header="Danger zone">
                        <div class="card danger-card">
                            <h3 class="section-title">Delete client</h3>
                            <p class="danger-text">This action cannot be undone. The client will be permanently removed.</p>

                            <Button label="Delete client" icon="pi pi-trash" severity="danger" class="w-full" @click="openConfirmation" />
                        </div>
                    </TabPanel>
                </TabView>
            </div>

            <!-- Delete confirm dialog stays same -->
            <Dialog header="Confirmation" v-model:visible="displayConfirmation" :style="{ width: '350px' }" :modal="true">
                <div class="flex items-center justify-center">
                    <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
                    <span>Are you sure you want to delete this client?</span>
                </div>
                <template #footer>
                    <Button label="No" icon="pi pi-times" @click="closeConfirmation" text severity="secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="deleteClientFunction" severity="danger" outlined autofocus />
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

.field-label {
    font-size: 13px;
    font-weight: 600;
    opacity: 0.85;
}

.input {
    border: 1px solid var(--surface-300);
    border-radius: 10px;
    padding: 10px 12px;
}

.input-readonly {
    opacity: 0.8;
    background: var(--surface-100);
}

.btn-primary {
    width: 100%;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 14px;
    font-weight: 700;
    cursor: pointer;
}
.danger-card {
    border: 1px solid rgba(239, 68, 68, 0.35); /* blago crveno */
}

.danger-text {
    opacity: 0.8;
    margin: 8px 0 14px;
    line-height: 1.4;
}
.client-overview input,
.client-overview select,
.client-overview textarea,
.client-overview .p-inputtext,
.client-overview .p-dropdown,
.client-overview .p-calendar .p-inputtext {
  border: 1px solid rgba(0,0,0,0.2) !important;
  border-radius: 12px;
  padding: 10px 12px;
}

.client-overview input:focus,
.client-overview .p-inputtext:focus,
.client-overview .p-dropdown:focus-within,
.client-overview .p-calendar:focus-within {
  border-color: rgba(59,130,246,0.8) !important; /* plava */
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
.dark .client-overview input,
.dark .client-overview .p-inputtext,
.dark .client-overview .p-dropdown,
.dark .client-overview .p-calendar .p-inputtext {
  border-color: rgba(255,255,255,0.25) !important;
}
</style>
