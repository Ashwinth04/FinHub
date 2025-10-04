import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const SENTIMENT_API_BASE_URL = 'http://localhost:8001/';
const RISK_API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sentimentApi = axios.create({
  baseURL: SENTIMENT_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const riskApi = axios.create({
  baseURL: RISK_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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
  updateWeights: (portfolioId, weights) => api.put(`/portfolio/${portfolioId}/weights`, weights),
  deleteAsset: (portfolioId, assetId) => api.delete(`/portfolio/${portfolioId}/assets/${assetId}`),
};

// Risk API calls
export const riskAPI = {
  getMetrics: (portfolioId) => api.get(`/risk/${portfolioId}/metrics`),
  runMonteCarloSimulation: (portfolioId, params) => api.post(`/risk/${portfolioId}/monte-carlo`, params),
};

export const sentimentAPI = {
  getSentimentData: (ticker) => sentimentApi.get(`/sentiment/${ticker}`),
  optimizePortfolio: (data) => sentimentApi.post('/optimize', data),
  checkHealth: () => sentimentApi.get('/health'),
}

// export const riskAPI = {
//   calculateRiskMetrics: (RiskCalculationRequest) => riskApi.post('/calculate-risk', RiskCalculationRequest),
//   getSamplePortfolio: () => riskApi.get('/sample-portfolio'),
//   checkHealth: () => riskApi.get('/health'),
// }

// Optimization API calls
export const optimizationAPI = {
  optimize: (data) => sentimentApi.post('/optimize', data),
};

export default api;