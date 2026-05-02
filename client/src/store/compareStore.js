import { create } from "zustand";

export const useCompareStore = create((set, get) => ({
  colleges: [],

  addCollege: (college) => {
    const { colleges } = get();
    if (colleges.length >= 3) return false;
    if (colleges.find((c) => c._id === college._id)) return false;
    set({ colleges: [...colleges, college] });
    return true;
  },

  removeCollege: (collegeId) => {
    set({ colleges: get().colleges.filter((c) => c._id !== collegeId) });
  },

  clearAll: () => set({ colleges: [] }),

  isInCompare: (collegeId) => {
    return get().colleges.some((c) => c._id === collegeId);
  },
}));

export default useCompareStore;
