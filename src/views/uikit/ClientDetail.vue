<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api_coach } from '@/services/api'
import ClientHeartRateChart from "@/components/charts/ClientHeartRateChart.vue";
import ClientTrainingSessions from "@/views/uikit/ClientTrainingSessions.vue"; // ✅ NEW IMPORT
import { FilterMatchMode, FilterOperator } from '@primevue/core/api' // (you can remove if unused now)

// route + base state
const route = useRoute()
const clientId = route.params.id

const breadcrumbHome = ref({ icon: 'pi pi-home', to: '/' });
const breadcrumbItems = ref([{ label: 'Client list' }, { label: 'Client detail' }]);

// backend values later, static for now
const hrZones = [540, 325, 702, 421, 237];

const client = ref({
  user: { first_name: '', last_name: '', email: '', birth_date: null },
  height: null,
  weight: null,
  gender: null
})

const gender = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api_coach.get(
      `/client-detail/${clientId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    )
    client.value = res.data
    gender.value = res.data.gender
  } catch (err) {
    console.error('Failed to fetch client:', err)
  } finally {
    loading.value = false
  }
})

watch(gender, (val) => client.value.gender = val)

const formatDateToYMD = (date) => {
  if (!date) return null
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const updateClient = async () => {
  try {
    await api_coach.patch(
      `/client-detail/${clientId}`,
      {
        ...client.value,
        user: { ...client.value.user, birth_date: formatDateToYMD(client.value.user.birth_date) }
      },
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    )
    alert('✅ Client updated successfully!')
  } catch (err) {
    alert('❌ Failed to update client')
  }
}
</script>

<template>
  <Fluid>
    <div class="card">
          <!-- <div class="font-semibold text-xl mb-4">Breadcrumb</div> -->
          <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" />
      </div>
        <div class="flex flex-col md:flex-row gap-8 mb-8">
            <div class="md:w-1/2">
                <div v-if="client">
                    <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-bold mb-4">Client Information</h2>
                    <div class="flex flex-col gap-2 field">
                        <div class="card flex justify-center">
                          <Image alt="Profile Image" preview>
                            <template #previewicon>
                              <i class="pi pi-search"></i>
                            </template>

                            <!-- Thumbnail -->
                            <template #image>
                              <img
                                src="https://primefaces.org/cdn/primevue/images/galleria/galleria11.jpg"
                                width="200"
                                alt="avatar"
                                class="rounded-full object-cover ring-4 ring-green-700"
                              />
                            </template>

                            <!-- Fullscreen Preview -->
                            <template #preview="slotProps">
                              <img
                                src="https://primefaces.org/cdn/primevue/images/galleria/galleria11.jpg"
                                alt="profile-preview"
                                :style="slotProps.style"
                                @click="slotProps.onClick"
                                class="rounded-full"
                              />
                            </template>
                          </Image>
                        </div>
                        <label class="mb-1 font-medium">First Name</label>
                        <input
                        v-model="client.user.first_name"
                        type="text"
                        placeholder="First Name"
                        class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                        />

                        <label class="mb-1 font-medium">Last Name</label>
                        <input
                        v-model="client.user.last_name"
                        type="text"
                        placeholder="Last Name"
                        class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                        />

                        <label class="mb-1 font-medium">Email (cannot update)</label>
                        <input
                        v-model="client.user.email"
                        type="email"
                        placeholder="Email"
                        readonly
                        class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                        />

                        <label class="mb-1 font-medium">Gender</label>
                        <SelectButton
                        v-model="gender"
                        :options="options"
                        size="large"
                        class="dark:bg-gray-700  dark:text-gray-100"
                        />

                        <label class="mb-1 font-medium">Height</label>
                        <input
                        v-model="client.height"
                        type="text"
                        class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                        />

                        <label class="mb-1 font-medium">Weight</label>
                        <input
                        v-model="client.weight"
                        type="text"
                        class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                        />

                        <label class="mb-1 font-medium">Birth Date</label>
                        <Calendar
                        v-model="client.user.birth_date"
                        dateFormat="yy-mm-dd"
                        showIcon
                        class="dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>

                    <button
                        @click="updateClient"
                        class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                        Update
                    </button>
                    </div>
                </div>
            <div v-else>
                Loading client data...
            </div>
        </div>
            <div class="md:w-1/2">
                <div class="card flex flex-col gap-4">
                    <div class="font-semibold text-xl">Client sessions diagrams</div>
                    <div class="grid grid-cols-12 gap-2">
                        <!-- <label for="name3" class="flex items-center md:col-span-2 md:mb-0">Number of sessions this month</label> -->
                         <div class="col-span-12 md:col-span-10">
                            Number of sessions this month:
                        </div>
                        <div class="col-span-12 md:col-span-10">
                            {{client.sessions_this_month}}
                        </div>
                    </div>

                </div>
                <ClientHeartRateChart :zones="hrZones" />
            </div>
        </div>
    <ClientTrainingSessions :clientId="clientId" />
  </Fluid>
</template>
