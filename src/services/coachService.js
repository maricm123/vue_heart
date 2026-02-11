import { api_coach } from './api.js';

const formatDateToYMD = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const updateCurrentCoach = async (coach) => {
    const payload = {
        ...coach,
        user: {
            ...coach.user,
            birth_date: formatDateToYMD(coach.user.birth_date)
        }
    };

    return api_coach.patch('/update-current-coach', payload, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`
        }
    });
};

export const getCurrentCoach = async () => {
    try {
        const response = await api_coach.get('/current-coach');
        return response.data;
    } catch (error) {
        console.error('Error fetching current coach:', error);
        throw error;
    }
};

export async function loginCoach(email, password, tenant) {
    return api_coach.post('/login-coach', {
        email,
        password,
        tenant
    });
}

export const logoutCoach = async () => {
    const refreshToken = localStorage.getItem('refresh');

    if (!refreshToken) {
        localStorage.clear();
        return;
    }

    try {
        await api_coach.post(
            '/logout-coach',
            { refresh: refreshToken },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`
                }
            }
        );
    } catch (err) {
        // čak i ako backend pukne, radimo lokalni logout
        console.warn('Logout API failed:', err.response?.data || err);
    } finally {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('tenant');
    }
};
