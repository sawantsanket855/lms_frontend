import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string, interests?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: { name?: string; bio?: string; interests?: string[] }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (email: string, password: string, name: string, role = 'student', interests = []) => {
    
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
        role,
        interests,
      });
      const { access_token, user } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
        
        // Verify token is still valid
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data });
          await AsyncStorage.setItem('user', JSON.stringify(response.data));
        } catch {
          // Token invalid, logout
          await get().logout();
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      const params = new URLSearchParams();
      if (data.name) params.append('name', data.name);
      if (data.bio !== undefined) params.append('bio', data.bio);
      
      let url = '/auth/profile';
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await api.put(url, { interests: data.interests });
      set({ user: response.data });
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Update failed');
    }
  },
}));
