<script setup>
import { ref, onMounted, watch  } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { api_coach, api_heart } from '@/api';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'

const route = useRoute()
const coachId = route.params.id

// states
const coach = ref({
  user: {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: null
  },
  specialty: null
})
const loading = ref(true)

const defaultAvatar = 'https://i.pravatar.cc/150?img=3'
// states
// const coach = ref(null)
const trainingSessions = ref([])
const filters = ref()
const options = ref(['Female', 'Male'])
const gender = ref('') // will hold selected gender

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

// Keep coach.gender in sync with SelectButton
watch(gender, (newVal) => {
    coach.value.gender = newVal
})

// 🔹 Fetch coach detail + training sessions
onMounted(async () => {
  try {
    // fetch coach
    const coachResponse = await api_coach.get(
      `/current-coach`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    )
    coach.value = coachResponse.data

  } catch (err) {
    console.error('Failed to fetch coach data', err)
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
// 🔹 Update coach
const updateCoach = async () => {
  try {
    const payload = {
    ...coach.value,
    user: {
        ...coach.value.user,
        birth_date: formatDateToYMD(coach.value.user.birth_date)
      }
    }
    
    await api_coach.patch(
      `/current-coach`,
      payload,
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    )
    alert('✅ Coach updated successfully!')
  } catch (err) {
    console.error('Update failed:', err.response?.data || err)
    alert('❌ Failed to update coach')
  }
}
</script>

<template>
<Fluid>
        <div class="flex flex-col md:flex-row gap-8 mb-8">
            <div class="md:w-1/2">
                <div v-if="coach">
                    <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-bold mb-4">Profile information</h2>
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
                        v-model="coach.user.first_name"
                        type="text"
                        placeholder="First Name"
                        class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                        />

                        <label class="mb-1 font-medium">Last Name</label>
                        <input
                        v-model="coach.user.last_name"
                        type="text"
                        placeholder="Last Name"
                        class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                        />

                        <label class="mb-1 font-medium">Email (cannot update)</label>
                        <input
                        v-model="coach.user.email"
                        type="email"
                        placeholder="Email"
                        readonly
                        class="border rounded-lg p-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                        />

                        <label class="mb-1 font-medium">Birth Date</label>
                        <Calendar
                        v-model="coach.user.birth_date"
                        dateFormat="yy-mm-dd"
                        showIcon
                        class="dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>

                    <button
                        @click="updateCoach"
                        class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                        Update
                    </button>
                    </div>
                </div>
            <div v-else>
                Loading data...
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

    </Fluid>
</template>
