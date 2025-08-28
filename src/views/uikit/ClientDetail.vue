<script setup>
import { ref, onMounted, watch  } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'

const route = useRoute()
const clientId = route.params.id
// states
const client = ref({
  user: {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: null
  },
  height: null,
  weight: null,
  gender: null
})
const loading = ref(true)

const defaultAvatar = 'https://i.pravatar.cc/150?img=3'
// states
// const client = ref(null)
const trainingSessions = ref([])
const filters = ref()
const options = ref(['Female', 'Male'])
const value3 = ref('') // will hold selected gender

// ✅ initialize filters for PrimeVue DataTable
const initFilters = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    date: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
  }
}
initFilters()

// 🔹 Format helpers
const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const clearFilter = () => {
  initFilters()
}

// Keep client.gender in sync with SelectButton
watch(value3, (newVal) => {
    client.value.gender = newVal
})

// 🔹 Fetch client detail + training sessions
onMounted(async () => {
  try {
    // fetch client
    const clientResponse = await axios.get(
      `http://mygym.localhost:8000/api_coach/client-detail/${clientId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    )
    console.log('Client data:', clientResponse.data)
    client.value = clientResponse.data
    value3.value = client.value.gender
    // Convert birth_date string to Date object
    console.log('Raw birth_date:', client.value.user.birth_date)
    // client.value.user.birth_date = client.value.user.birth_date ? new Date(client.value.user.birth_date) : null
    console.log('Converted birth_date:', client.value.user.birth_date)
    // fetch training sessions
    // const sessionsResponse = await axios.get(
    //   `http://mygym.localhost:8000/api_coach/get-training-session/?client=${clientId}`,
    //   { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    // )
    // trainingSessions.value = sessionsResponse.data
  } catch (err) {
    console.error('Failed to fetch client or sessions:', err)
  } finally {
    loading.value = false
  }
})
function formatDateToYMD(date) {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}   
// 🔹 Update client
const updateClient = async () => {
  try {
    const payload = {
    ...client.value,
    user: {
        ...client.value.user,
        birth_date: formatDateToYMD(client.value.user.birth_date)
      }
    }

    console.log('Updating client with payload:', payload)
    
    await axios.patch(
      `http://mygym.localhost:8000/api_coach/client-detail/${clientId}`,
      payload,
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    )
    alert('✅ Client updated successfully!')
  } catch (err) {
    console.error('Update failed:', err.response?.data || err)
    alert('❌ Failed to update client')
  }
}
</script>

<template>
<Fluid>
        <div class="flex flex-col md:flex-row gap-8 mb-8">
        <div class="md:w-1/2">
            <div v-if="client">
                <div class="max-w-md mx-auto bg-white shadow-md rounded-xl p-6">
                    <h2 class="text-xl font-bold mb-4">Client Information</h2>

                    <div class="flex flex-col gap-2 field">
                        <label for="first_name" class="mb-1 text-gray-700 font-medium">First Name</label>
                        <input
                            v-model="client.user.first_name"
                            type="text"
                            placeholder="First Name"
                            class="border rounded-lg p-2"
                        />
                        <label for="first_name" class="mb-1 text-gray-700 font-medium">First Name</label>
                        <input
                            v-model="client.user.last_name"
                            type="text"
                            placeholder="Last Name"
                            class="border rounded-lg p-2"
                        />
                        <label for="first_name" class="mb-1 text-gray-700 font-medium">Email (cannot update)</label>
                        <input
                            v-model="client.user.email"
                            type="email"
                            placeholder="Email"
                            readonly
                            class="border rounded-lg p-2"
                        />
                        <label for="first_name" class="mb-1 text-gray-700 font-medium">Gender</label>
                        <!-- <input
                            v-model="client.gender"
                            type="text"
                            placeholder="Phone"
                            class="border rounded-lg p-2"
                        /> -->
                        <SelectButton v-model="value3" :options="options" size="large" />
                        <label for="first_name" class="mb-1 text-gray-700 font-medium">Height</label>
                        <input
                            v-model="client.height"
                            type="text"
                            placeholder="Phone"
                            class="border rounded-lg p-2"
                        />
                        <label for="first_name" class="mb-1 text-gray-700 font-medium">Weight</label>
                        <input
                            v-model="client.weight"
                            type="text"
                            placeholder="Phone"
                            class="border rounded-lg p-2"
                        />
                        <label>Birth Date</label>
                        <Calendar v-model="client.user.birth_date" dateFormat="yy-mm-dd" showIcon />
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
                    <div class="font-semibold text-xl">Other informations</div>
                    <div class="grid grid-cols-12 gap-2">
                        <label for="name3" class="flex items-center col-span-12 mb-2 md:col-span-2 md:mb-0">Calories</label>
                        <div class="col-span-12 md:col-span-10">
                            <InputText id="name3" type="text" />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-2">
                        <label for="email3" class="flex items-center col-span-12 mb-2 md:col-span-2 md:mb-0">Email</label>
                        <div class="col-span-12 md:col-span-10">
                            <InputText id="email3" type="text" />
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <DataTable
            v-model:filters="filters"
            :value="trainingSessions"
            paginator
            showGridlines
            :rows="10"
            dataKey="id"
            filterDisplay="menu"
            :loading="loading"
            :globalFilterFields="['name', 'date', 'status']"
        >
        <template #header>
            <div class="flex justify-between">
            <Button type="button" icon="pi pi-filter-slash" label="Clear" variant="outlined" @click="clearFilter()" />
            <IconField>
                <InputIcon>
                <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
            </IconField>
            </div>
        </template>

        <template #empty>No training sessions found.</template>
        <template #loading>Loading training sessions...</template>

        <!-- Columns -->
        <Column field="name" header="Session Name" style="min-width: 12rem">
            <template #body="{ data }">{{ data.name }}</template>
        </Column>

        <Column field="date" header="Date" style="min-width: 10rem">
            <template #body="{ data }">{{ formatDate(data.date) }}</template>
        </Column>

        <Column field="status" header="Status" style="min-width: 10rem">
            <template #body="{ data }">
            <Tag :value="data.status" :severity="data.status === 'completed' ? 'success' : 'info'" />
            </template>
        </Column>
        </DataTable>

    </Fluid>
</template>
