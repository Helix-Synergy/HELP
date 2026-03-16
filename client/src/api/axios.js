import axios from 'axios';

const getBaseURL = () => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    // If the URL is provided via env but doesn't include the version prefix, add it.
    // This handles cases where Render env var is just the domain.
    if (import.meta.env.VITE_API_URL && !url.includes('/api/v1')) {
        return `${url.replace(/\/$/, '')}/api/v1`;
    }
    return url;
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Important for cookies/sessions if used, but we use Authorization header usually
});

// Request interceptor to add the auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('hems_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
