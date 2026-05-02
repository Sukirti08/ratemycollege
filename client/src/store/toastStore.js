import { create } from "zustand";

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: ({ message, type = "info", duration = 3000 }) => {
    const id = Date.now();
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().removeToast(id), duration);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  success: (message) => get().addToast({ message, type: "success" }),
  error: (message) => get().addToast({ message, type: "error" }),
  info: (message) => get().addToast({ message, type: "info" }),
}));

export default useToastStore;
