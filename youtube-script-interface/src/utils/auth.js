import axios from 'axios';

// Detect API URL based on environment
export const getApiUrl = () => {
    // Build-time: chaîne vide = même origine (Nginx → backend), pratique pour Docker
    if (process.env.REACT_APP_API_URL !== undefined) {
        return process.env.REACT_APP_API_URL || '';
    }

    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // For local development directly on the machine or local network
    // This allows 'npm run dev' to work even without the Nginx proxy
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
        return `${protocol}//${hostname}:5001`;
    }

    // Default to relative path for Docker/Nginx proxy in production-like containers
    return '';
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
    const token = localStorage.getItem('access_token');
    const base = getApiUrl();
    if (token) {
        axios
            .post(`${base}/api/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 })
            .catch(() => {});
    }
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
