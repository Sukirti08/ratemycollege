import { create } from "zustand";
import { getMe, logout as logoutApi } from "../api/auth";

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try { await logoutApi(); } catch {}
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));

export default useAuthStore;
