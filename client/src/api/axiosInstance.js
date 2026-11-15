import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(error.response?.data?.message || error.message))
);

export default axiosInstance;
