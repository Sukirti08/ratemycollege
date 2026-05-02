import axiosInstance from './axiosInstance.js';

export const submitPlacement = async (formData) => {
  // formData: FormData instance (may include offer letter file)
  const response = await axiosInstance.post('/placements', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getPlacementStats = async (collegeId) => {
  const response = await axiosInstance.get(`/placements/college/${collegeId}`);
  return response.data; // { avg, median, max, min, verified, byCompany[], byBranch[] }
};
