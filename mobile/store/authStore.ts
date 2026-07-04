import { create } from "zustand";
import { saveToken, clearToken } from "@/services/api";
import apiClient from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string, user: User) => Promise<void>;
  clearAuth: () => Promise<void>;
  fetchMe: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });
      const { user, token } = response.data;
      await saveToken(token);
      set({ user, token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post(API_ENDPOINTS.SIGNUP, {
        name,
        email,
        password,
      });
      const { user, token } = response.data;
      await saveToken(token);
      set({ user, token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
    } catch {
      // Ignore logout errors
    }
    await clearToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  setToken: async (token: string, user: User) => {
    await saveToken(token);
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: async () => {
    await clearToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.ME);
      set({ user: res.data.user, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },
}));
