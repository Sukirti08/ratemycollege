import axiosInstance from './axiosInstance.js';

export const getProfessor = async (id) => {
  const response = await axiosInstance.get(`/professors/${id}`);
  return response.data; // professor + reviews
};

export const submitProfessorReview = async (professorId, data) => {
  const response = await axiosInstance.post(`/professors/${professorId}/reviews`, data);
  return response.data;
};

export const getTopProfessors = async ({ page = 1, limit = 20 } = {}) => {
  const response = await axiosInstance.get('/professors/top', {
    params: { page, limit },
  });
  return response.data;
};
