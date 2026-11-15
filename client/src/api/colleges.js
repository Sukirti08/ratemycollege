import axiosInstance from './axiosInstance.js';

const withId = (record) => ({ ...record, id: record._id });

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
  return response.data.colleges.map(withId);
};

export const getCollegeById = async (id) => {
  const response = await axiosInstance.get(`/colleges/${id}`);
  return withId(response.data.college);
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
  return response.data.professors.map(withId);
};

export const getCollegePlacements = async (id) => {
  const response = await axiosInstance.get(`/colleges/${id}/placements`);
  return response.data;
};

export const getCollegeQuestions = async (id) => {
  const response = await axiosInstance.get(`/colleges/${id}/questions`);
  return response.data.questions;
};

export const getLeaderboard = async ({
  category = 'overall',
  type = '',
  limit = 10,
} = {}) => {
  const response = await axiosInstance.get('/colleges/leaderboard', {
    params: { category, type, limit },
  });
  return response.data.colleges.map(withId);
};

export const getTrending = async () => {
  const response = await axiosInstance.get('/colleges/trending');
  return response.data;
};

export const getCollegeStats = async () => {
  const response = await axiosInstance.get('/colleges/stats');
  return response.data;
};
