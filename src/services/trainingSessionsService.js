import { api_coach, api_heart } from './api.js'

export async function fetchActiveSessions() {
  try {
    const response = await api_coach.get('/active-training-sessions', {
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