import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const getTenant = () => localStorage.getItem('tenant');

const getBase = (template) => {
    const tenant = getTenant();
    console.log(tenant, 'tenant in getBase');
    if (!tenant) return null;
    return template.replace('{tenant}', tenant);
};

const api_coach = axios.create();
api_coach.defaults.__baseTemplate = import.meta.env.VITE_API_BASE_COACH_TEMPLATE;

const api_heart = axios.create();
api_heart.defaults.__baseTemplate = import.meta.env.VITE_API_BASE_HEART_TEMPLATE;


const addAuthInterceptor = (instance) => {
    instance.interceptors.request.use((config) => {
        const authStore = useAuthStore();

        const base = getBase(config.__baseTemplate);
        if (base) config.baseURL = base;

        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`;
        }

        return config;
    });
};

addAuthInterceptor(api_coach);
addAuthInterceptor(api_heart);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });

    failedQueue = [];
};

const addRefreshInterceptor = (instance) => {
    instance.interceptors.response.use(
        (res) => res,
        async (error) => {
            const originalRequest = error.config;
            const authStore = useAuthStore();

            if (error.response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        originalRequest.headers.Authorization = 'Bearer ' + token;
                        return instance(originalRequest);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refresh = authStore.refreshToken;

                    if (!refresh || refresh === 'null' || refresh === 'undefined') {
                        console.log('No refresh token in store/localStorage:', refresh);
                        authStore.logout();
                        return Promise.reject(error);
                    }

                    const res = await axios.post(`${import.meta.env.VITE_COACH_API_URL}/refresh-token`, { refresh });

                    const newAccess = res.data.access;
                    authStore.setToken(newAccess);

                    // if backend rotates refresh tokens, save it too
                    if (res.data.refresh) authStore.setRefresh(res.data.refresh);

                    processQueue(null, newAccess);
                    return instance(originalRequest);
                } catch (err) {
                    console.log('Refresh failed status:', err.response?.status);
                    console.log('Refresh failed data:', err.response?.data); // <-- super important
                    processQueue(err, null);
                    authStore.logout();
                    return Promise.reject(err);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );
};

addRefreshInterceptor(api_coach);
addRefreshInterceptor(api_heart);

export { api_coach, api_heart };
