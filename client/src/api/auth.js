import axiosInstance from './axiosInstance.js';

export const googleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
};

export const logout = () => axiosInstance.post('/auth/logout');

export const getMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};
