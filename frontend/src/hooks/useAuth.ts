"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

/**
 * Authentication hook backed by a shared Zustand store.
 * All components share the same auth state — only one /auth/profile call is made.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);

  // Initialize auth state once on first mount (store ensures single call via isLoading guard)
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadProfile,
    clearError,
  };
}
