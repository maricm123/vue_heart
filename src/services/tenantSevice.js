import { api_coach, api_heart } from './api.js'

export async function getCurrentTenant() {
  try {
    const response = await api_coach.get(
      '/current-tenant',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access')}`,
        },
      }
    )

    console.log('✅ Fetched current tenant:', response.data)
    return response.data
  } catch (err) {
    console.error(
      '❌ Failed to fetch current tenant',
      err.response?.data || err
    )
    throw err
  }
}
