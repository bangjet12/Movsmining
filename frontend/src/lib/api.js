import axios from 'axios';

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
export const API = `${BACKEND_URL}/api`;

export const apiClient = axios.create({
    baseURL: API,
    timeout: 30000,
});

export function setAuthToken(token) {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('movs_jwt', token);
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
        localStorage.removeItem('movs_jwt');
    }
}

// Hydrate token on load
const stored = localStorage.getItem('movs_jwt');
if (stored) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
}
