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


export async function finishSession(sessionId, calories) {
  console.log("Finishing session with ID:", sessionId, "and calories:", typeof calories, calories)
  try {
    const response = await api_heart.patch(
      `/finish-session/${sessionId}`,
      { calories_at_end: calories || 0 },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access')}`,
        },
      }
    )
    return response.data
  } catch (err) {
    console.error('❌ Failed to finish session', err.response?.data || err)
    throw err
  }
}