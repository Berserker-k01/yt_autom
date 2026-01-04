import axios from 'axios';

// Detect API URL based on environment and hostname
export const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    // Default to port 5001 on the same host
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    // If we're in development or local network, use the current host but port 5001
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
        return `${protocol}//${hostname}:5001`;
    }

    // Fallback for known production/dev environments
    return 'http://localhost:5001';
};

const API_URL = getApiUrl();
export { API_URL };

export const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('access_token');
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

export const refreshToken = async () => {
    try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) return false;

        const response = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refresh}` }
        });

        localStorage.setItem('access_token', response.data.access_token);
        return true;
    } catch (error) {
        logout();
        return false;
    }
};

// Axios interceptor for auto-retry with refresh token
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const success = await refreshToken();

            if (success) {
                originalRequest.headers = getAuthHeaders();
                return axios(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);
