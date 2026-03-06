import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const API_URL = "https://lms-backend-tp4y.onrender.com"

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    // Suppress automatic error display and let components handle errors
    return Promise.reject(error);
  }
);

export const getMediaUrl = (mid: string) => `${API_URL}/api/media/stream/${mid}`;

export default api;
