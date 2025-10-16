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

export async function createClient({
  first_name,
  last_name,
  email,
  phone,
  dob,
  gender,
  notes
} = {}) {
  try {
    const payload = { first_name, last_name, email, phone, dob, gender, notes };
    const response = await api_coach.post('/create-client', payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access')}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error('❌ Error creating client:', err);
    throw err;
  }
}