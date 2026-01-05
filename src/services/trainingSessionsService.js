import { api_coach, api_heart } from './api.js'
import { storeToRefs } from 'pinia';
import { useSessionTimersStore } from '@/store/sessionTimerStore';
const timersStore = useSessionTimersStore();
const { timers } = storeToRefs(timersStore);

export async function getActiveTrainingSessions() {
  try {
    const response = await api_coach.get('/get-active-training-sessions', {
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

export async function deleteTrainingSession(sessionId) {
  try {
    const response = await api_coach.delete(`/delete-training-session-detail/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error('❌ Error deleting training session:', err);
    throw err;
  }
}


export async function sendBpmToBackend(client, bpm, device, sessionId) {
    try {
        const response = await api_heart.post('/save-heartbeat', {
            // client: client.id,
            bpm: bpm,
            device_id: device.name || device.deviceId || device || 'unknown',
            seconds: timersStore.timers[client.id] || 0,
            training_session_id: sessionId || null, // Ako je sesija aktivna
            timestamp: new Date().toISOString() // opcionalno, ako backend koristi
        });
    } catch (err) {
        console.error('❌ Error sending BPM:', err);
    }
}


export async function forceDeleteActiveTrainingSession(sessionId) {
  try {
    const response = await api_coach.delete(`/force-delete-training-session/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error('❌ Error deleting training session:', err);
    throw err;
  }
}
