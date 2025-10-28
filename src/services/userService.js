import { api_coach, api_heart } from './api.js'

export const getCurrentCoach = async () => {
    try {
        const response = await api_coach.get('/current-coach');
        return response.data;
    } catch (error) {
        console.error('Error fetching current coach:', error);
        throw error;
    }
};

export async function getClientsByCoach() {
  try {
    const response = await api_coach.get('/get-all-clients-based-on-coach', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    })
    return response.data
  } catch (err) {
    console.error('❌ Error loading clients:', err)
    throw err
  }
}

export async function createClient(payload = {}) {
  try {
    const allowed = {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      birth_date: payload.birthDate,
        // ? payload.birthDate.toISOString().split('T')[0]
        // : null,
      phone_number: payload.phoneNumber,
      gender: payload.gender,
      weight: payload.weight,
      height: payload.height,
    };

    const response = await api_coach.post('/create-client', allowed, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    });

    return response.data;
  } catch (err) {
    console.error('❌ Error creating client:', err.response?.data || err.message);
    throw err;
  }
}

export async function getClientDetail(clientId) {
  try {
    const response = await api_coach.get(`/client-detail/${clientId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error('❌ Error fetching client detail:', err);
    throw err;
  }
}

const formatDateToYMD = (date) => {
  if (!date) return null
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
export async function updateClient(clientId, client) {
  try {
    const payload = {
      ...client,
      user: {
        ...client.user,
        birth_date: formatDateToYMD(client.user.birth_date),
      },
    };

    const response = await api_coach.patch(`/client-detail/${clientId}`, payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    });

    return response.data;
  } catch (err) {
    console.error('❌ Error updating client:', err.response?.data || err.message);
    throw err;
  }
}