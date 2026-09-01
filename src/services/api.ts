import axios from 'axios';
import { Capacitor } from '@capacitor/core';

function getApiBaseUrl(): string {
  const webApiUrl = import.meta.env.VITE_API_URL;
  const androidApiUrl = import.meta.env.VITE_ANDROID_API_URL;

  // Native Android may need a different host than web (emulator vs device vs remote).
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    return androidApiUrl || 'http://10.0.2.2:3001/api';
  }

  if (webApiUrl) return webApiUrl;

  return 'http://localhost:3001/api';
}

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Note: Navigation should be handled by the component using this service
      // to avoid full page reload and work with React Router
    }
    return Promise.reject(error);
  }
);

export default api;
