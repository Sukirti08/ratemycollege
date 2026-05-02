import axiosInstance from './axiosInstance.js';

export const getColleges = async ({
  search = '',
  type = '',
  sortBy = 'overall',
  page = 1,
  limit = 12,
} = {}) => {
  const response = await axiosInstance.get('/colleges', {
    params: { search, type, sortBy, page, limit },
  });
  return response.data; // { colleges, total, page, totalPages }
};

export const getCollegeById = async (id) => {
  const response = await axiosInstance.get(`/colleges/${id}`);
  return response.data;
};

export const getCollegeReviews = async (
  id,
  { sort = 'createdAt', branch = '', batch = '', page = 1, limit = 10 } = {}
) => {
  const response = await axiosInstance.get(`/colleges/${id}/reviews`, {
    params: { sort, branch, batch, page, limit },
  });
  return response.data;
};

export const getCollegeProfessors = async (id) => {
  const response = await axiosInstance.get(`/colleges/${id}/professors`);
  return response.data;
};

export const getCollegePlacements = async (id) => {
  const response = await axiosInstance.get(`/colleges/${id}/placements`);
  return response.data;
};

export const getCollegeQuestions = async (id) => {
  const response = await axiosInstance.get(`/colleges/${id}/questions`);
  return response.data;
};

export const getLeaderboard = async ({
  category = 'overall',
  type = '',
  limit = 10,
} = {}) => {
  const response = await axiosInstance.get('/colleges/leaderboard', {
    params: { category, type, limit },
  });
  return response.data;
};

export const getTrending = async () => {
  const response = await axiosInstance.get('/colleges/trending');
  return response.data;
};

export const getCollegeStats = async () => {
  const response = await axiosInstance.get('/colleges/stats');
  return response.data;
};
