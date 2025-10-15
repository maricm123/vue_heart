<script setup>
import { ProductService } from '@/service/ProductService';
import { onMounted, ref } from 'vue';
import axios from 'axios'
import { api_coach, api_heart } from '@/services/api';
const products = ref(null);
const picklistProducts = ref(null);
const orderlistProducts = ref(null);
const options = ref(['list', 'grid']);
const layout = ref('list');
const clients = ref([])
const defaultAvatar = 'https://i.pravatar.cc/150?img=3' // placeholder image
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {
    try {
        const response = await api_coach.get('/get-all-clients-based-on-coach', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('access')}`
            }
        })
        clients.value = response.data  // assuming API returns an array of clients
    } catch (err) {
        
        console.error('Failed to fetch clients:', err)

        if (err.config) {
            console.log('Full request URL:', (err.config.baseURL || '') + err.config.url)
        }
    }
});

// Map API response to severity for Tag color
function getSeverity(client) {
    return 'success' // You can customize based on client status if needed
}

function goToClientDetail(clientId) {
    router.push({ name: 'clientDetail', params: { id: clientId } })
}

</script>

<template>
    <div class="card flex flex-col">
        <div class="flex flex-wrap">
            <Button label="Add new client" @click="router.push({ name: 'addClient' })"></Button>
        </div>
    </div>
    <div class="flex flex-col">
        <div class="card">
            <div class="font-semibold text-xl">Your client list</div>
            <DataView :value="clients" :layout="layout">
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
                    <div v-for="(client, index) in slotProps.items" :key="client.id" class="flex flex-col sm:flex-row sm:items-center p-4 border-b border-surface-200 gap-4">
                        <!-- Photo -->
                        <div class="w-16 h-16 flex-shrink-0">
                            <img :src="client.user.avatar || defaultAvatar" alt="Avatar" class="w-full h-full rounded-full object-cover" />
                        </div>
                        <!-- Client info -->
                        <div class="flex-1">
                        <div class="text-lg font-medium">{{ client.user.first_name }} {{ client.user.last_name }}</div>
                        <div class="text-sm text-surface-600">{{ client.user.email }}</div>
                        <div class="flex gap-4 mt-2">
                            <span>Height: {{ client.height }} cm</span>
                            <span>Weight: {{ client.weight }} kg</span>
                            <span>Gender: {{ client.gender }}</span>
                        </div>
                        </div>

                        <!-- Actions -->
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
                    <div v-for="client in slotProps.items" :key="client.id" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                        <div class="p-4 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col gap-4">
                        <div class="font-medium text-lg">{{ client.user.first_name }} {{ client.user.last_name }}</div>
                        <div class="text-sm text-surface-600">{{ client.user.email }}</div>
                        <div class="flex gap-4">
                            <span>Height: {{ client.height }} cm</span>
                            <span>Weight: {{ client.weight }} kg</span>
                            <span>Gender: {{ client.gender }}</span>
                        </div>
                        <div class="flex gap-2 mt-2">
                            <Button label="Detail" icon="pi pi-pencil"></Button>
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
