import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(token);
  return config;
});

// Portfolio API calls
export const portfolioAPI = {
  getAll: () => api.get('/portfolio'),
  getById: (id) => api.get(`/portfolio/${id}`),
  create: (data) => api.post('/portfolio', data),
  update: (id, data) => api.put(`/portfolio/${id}`, data),
  delete: (id) => api.delete(`/portfolio/${id}`),
  addAsset: (portfolioId, assetData) => api.post(`/portfolio/${portfolioId}/assets`, assetData),
  updateAsset: (portfolioId, assetId, data) => api.put(`/portfolio/${portfolioId}/assets/${assetId}`, data),
  deleteAsset: (portfolioId, assetId) => api.delete(`/portfolio/${portfolioId}/assets/${assetId}`),
};

// Risk API calls
export const riskAPI = {
  getMetrics: (portfolioId) => api.get(`/risk/${portfolioId}/metrics`),
  runMonteCarloSimulation: (portfolioId, params) => api.post(`/risk/${portfolioId}/monte-carlo`, params),
};

// Optimization API calls
export const optimizationAPI = {
  optimize: (data) => api.post('/optimization/optimize', data),
};

export default api;