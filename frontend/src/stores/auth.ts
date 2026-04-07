import { create } from "zustand";
import type { User, LoginCredentials, RegisterData } from "@/types";
import * as api from "@/lib/api";
import { useCartStore } from "@/stores/cart";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProfile: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  loadProfile: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      set({ isLoading: true, error: null });
      const response = await api.getProfile();
      set({ user: response.data, isAuthenticated: true, isLoading: false, error: null });
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.login(credentials);
      const { user, token } = response.data;
      localStorage.setItem("auth_token", token);
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return { success: true };
    } catch (err) {
      const message =
        err instanceof api.ApiError
          ? err.message
          : "Đăng nhập thất bại. Vui lòng thử lại.";
      set((state) => ({ ...state, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.register(data);
      const { user, token } = response.data;
      localStorage.setItem("auth_token", token);
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return { success: true };
    } catch (err) {
      const message =
        err instanceof api.ApiError
          ? err.message
          : "Đăng ký thất bại. Vui lòng thử lại.";
      set((state) => ({ ...state, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem("auth_token");
      // Clear cart on logout so it doesn't leak to other accounts
      useCartStore.getState().clearCart();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
