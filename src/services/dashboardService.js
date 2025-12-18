import { api_coach, api_heart } from './api.js'
import { storeToRefs } from 'pinia';

export async function getDashboardInfo() {
  try {
    const response = await api_coach.get('/dashboard-info', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    })
    return response.data
  } catch (err) {
    console.error('❌ Failed to fetch active sessions', err.response?.data || err)
    throw err
  }
}