import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { default: useAuthStore } = await import('../store/authStore.js');
      useAuthStore.getState().logout();
      window.location.href = '/';
    }
    return Promise.reject(error.response?.data?.message || error.message);
  }
);

export default axiosInstance;
