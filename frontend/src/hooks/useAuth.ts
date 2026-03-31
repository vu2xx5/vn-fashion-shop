"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, LoginCredentials, RegisterData } from "@/types";
import * as api from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication hook that manages user state, login, register, and logout.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      loadProfile();
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await api.getProfile();
      setState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      localStorage.removeItem("auth_token");
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await api.login(credentials);
      const { user, token } = response.data;
      localStorage.setItem("auth_token", token);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (err) {
      const message =
        err instanceof api.ApiError
          ? err.message
          : "Đăng nhập thất bại. Vui lòng thử lại.";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await api.register(data);
      const { user, token } = response.data;
      localStorage.setItem("auth_token", token);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (err) {
      const message =
        err instanceof api.ApiError
          ? err.message
          : "Đăng ký thất bại. Vui lòng thử lại.";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem("auth_token");
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    register,
    logout,
    loadProfile,
    clearError,
  };
}
