import axiosInstance, { API_BASE_URL } from './axiosInstance.js';

export const googleLogin = () => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};

export const logout = () => axiosInstance.post('/auth/logout');

export const getMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data.user;
};
