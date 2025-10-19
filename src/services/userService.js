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
