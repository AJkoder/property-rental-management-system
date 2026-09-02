import apiClient from './client';

export const getContractors = () => apiClient.get('/auth/contractors');