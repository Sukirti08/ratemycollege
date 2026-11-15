import axiosInstance from './axiosInstance.js';

export const submitReview = async (data) => {
  // data: { collegeId, ratings, text, tags, batchYear, branch, isAnonymous }
  const response = await axiosInstance.post('/reviews', data);
  return response.data;
};

export const toggleHelpful = async (reviewId) => {
  const response = await axiosInstance.put(`/reviews/${reviewId}/helpful`);
  return response.data;
};

export const flagReview = async (reviewId) => {
  const response = await axiosInstance.put(`/reviews/${reviewId}/flag`);
  return response.data;
};

export const deleteReview = async (reviewId) => {
  const response = await axiosInstance.delete(`/reviews/${reviewId}`);
  return response.data;
};

export const addQuestion = async (collegeId, { text }) => {
  const response = await axiosInstance.post('/reviews/question', { collegeId, text });
  return response.data.question;
};

export const addAnswer = async (questionId, { text }) => {
  const response = await axiosInstance.post(`/reviews/question/${encodeURIComponent(questionId)}/answer`, { text });
  return response.data.question;
};
