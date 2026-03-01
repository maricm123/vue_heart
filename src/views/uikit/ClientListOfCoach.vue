<script setup>
import { onMounted, ref } from 'vue';
import { api_coach } from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();

const options = ref(['list', 'grid']);
const layout = ref('list');

const clients = ref([]);
const loading = ref(true);

const defaultAvatar = 'https://i.pravatar.cc/150?img=3';

onMounted(async () => {
  loading.value = true;

  try {
    const response = await api_coach.get('/get-all-clients-from-coach', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`
      }
    });

    clients.value = response.data;
  } catch (err) {
    console.error('Failed to fetch clients:', err);

    if (err.config) {
      console.log('Full request URL:', (err.config.baseURL || '') + err.config.url);
    }
  } finally {
    loading.value = false;
  }
});

function getSeverity(client) {
  return 'success';
}

function goToClientDetail(clientId) {
  router.push({ name: 'clientDetail', params: { id: clientId } });
}
</script>

<template>
  <!-- top action -->
  <div class="card flex flex-col">
    <div class="flex flex-wrap">
      <Button label="Add new client" @click="router.push({ name: 'createClient' })"></Button>
    </div>
  </div>

  <!-- LOADING -->
  <div v-if="loading" class="card">
    <div class="flex justify-between items-center mb-4">
      <div class="font-semibold text-xl">Your client list</div>
      <Skeleton width="7rem" height="2.2rem" />
    </div>

    <!-- list skeleton rows -->
    <div class="flex flex-col gap-3">
      <div v-for="i in 6" :key="i" class="p-4 border-b border-surface-200">
        <div class="flex items-center gap-4">
          <!-- avatar skeleton -->
          <Skeleton shape="circle" size="3.25rem" />

          <div class="flex-1">
            <Skeleton width="14rem" height="1.2rem" class="mb-2" />
            <Skeleton width="18rem" height="0.9rem" class="mb-3" />
            <div class="flex gap-3">
              <Skeleton width="7rem" height="0.9rem" />
              <Skeleton width="7rem" height="0.9rem" />
              <Skeleton width="7rem" height="0.9rem" />
            </div>
          </div>

          <div class="flex gap-2">
            <Skeleton width="6rem" height="2.2rem" />
            <Skeleton width="4rem" height="2.2rem" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CONTENT -->
  <div v-else class="flex flex-col">
    <div class="card">
      <div class="font-semibold text-xl">Your client list</div>

      <div v-if="clients.length === 0" class="py-12 text-center opacity-60">
        <i class="pi pi-inbox text-4xl mb-4 block"></i>
        <p class="text-lg">No clients yet</p>
        <p class="text-sm mt-2">Add a new client to get started</p>
      </div>

      <DataView v-else :value="clients" :layout="layout">
        <template #header>
          <div class="flex justify-end mb-4">
            <SelectButton v-model="layout" :options="options" :allowEmpty="false">
              <template #option="{ option }">
                <i :class="option === 'list' ? 'pi pi-bars' : 'pi pi-table'"></i>
              </template>
            </SelectButton>
          </div>
        </template>

        <!-- List layout -->
        <template #list="slotProps">
          <div class="flex flex-col">
            <div
              v-for="client in slotProps.items"
              :key="client.id"
              class="flex flex-col sm:flex-row sm:items-center p-4 border-b border-surface-200 gap-4"
            >
              <div class="flex-1">
                <div class="text-lg font-medium">
                  {{ client.user.first_name }} {{ client.user.last_name }}
                </div>
                <div class="text-sm text-surface-600">{{ client.user.email }}</div>
                <div class="flex gap-4 mt-2">
                  <span>Height: {{ client.height }} cm</span>
                  <span>Weight: {{ client.weight }} kg</span>
                  <span>Gender: {{ client.gender }}</span>
                </div>
              </div>

              <div class="flex gap-2 mt-2 sm:mt-0">
                <Button label="Detail" icon="pi pi-pencil" @click="goToClientDetail(client.id)"></Button>
                <Tag :value="'Active'" :severity="getSeverity(client)"></Tag>
              </div>
            </div>
          </div>
        </template>

        <!-- Grid layout -->
        <template #grid="slotProps">
          <div class="grid grid-cols-12 gap-4">
            <div
              v-for="client in slotProps.items"
              :key="client.id"
              class="col-span-12 sm:col-span-6 lg:col-span-4 p-2"
            >
              <div
                class="p-4 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col gap-4"
              >
                <div class="font-medium text-lg">
                  {{ client.user.first_name }} {{ client.user.last_name }}
                </div>
                <div class="text-sm text-surface-600">{{ client.user.email }}</div>
                <div class="flex gap-4">
                  <span>Height: {{ client.height }} cm</span>
                  <span>Weight: {{ client.weight }} kg</span>
                  <span>Gender: {{ client.gender }}</span>
                </div>
                <div class="flex gap-2 mt-2">
                  <Button label="Detail" icon="pi pi-pencil" @click="goToClientDetail(client.id)"></Button>
                  <Tag :value="'Active'" :severity="getSeverity(client)"></Tag>
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>
    </div>
  </div>
</template>