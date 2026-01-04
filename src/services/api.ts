import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// In development, use empty baseURL to leverage Vite proxy (avoids CORS)
// In production, set VITE_API_BASE_URL to your backend URL
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
