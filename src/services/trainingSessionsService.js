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

export async function finishSession(sessionId, calories, seconds) {
  console.log("Finishing session with ID:", sessionId, "and calories:", typeof calories, calories)
  try {
    const response = await api_heart.patch(
      `/finish-session/${sessionId}`,
      { calories_at_end: calories || 0,
        seconds: seconds || 0
      },
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

export async function createSession(clientId) {
  const localISOTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString();
  console.log(new Date().toISOString())
  const localDate = new Date();
  const utcISOString = localDate.toISOString(); // this is the correct UTC time
  console.log("Creating session for client ID:", clientId, "at time:", utcISOString)

  try {
    const response = await api_heart.post(
      '/create-session',
      {
        client_id: clientId,
        start: utcISOString,
        title: 'New session',
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access')}`,
        },
      }
    )
    console.log("Backend start:", response.data.start);

    return response
  } catch (err) {
    console.error('❌ Failed to create session', err.response?.data || err)
    throw err
  }
}

export async function getTrainingSessionDetailsAndMetrics(sessionId) {
  try {
    const response = await api_coach.get(`/get-training-session-detail/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    })
    console.log('✅ Fetched session details and metrics:', response.data)
    return response.data
  } catch (err) {
    console.error('❌ Failed to fetch session details', err.response?.data || err)
    throw err
  }
}
