import { useState, useEffect } from 'react';
import { riskAPI } from '../utils/api';

export const useRiskMetrics = (portfolioId) => {
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [monteCarloData, setMonteCarloData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRiskMetrics = async () => {
    if (!portfolioId) return;
    
    try {
      setLoading(true);
      const response = await riskAPI.getMetrics(portfolioId);
      setRiskMetrics(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch risk metrics');
    } finally {
      setLoading(false);
    }
  };

  const runMonteCarloSimulation = async (params) => {
    if (!portfolioId) return;
    
    try {
      setLoading(true);
      const response = await riskAPI.runMonteCarloSimulation(portfolioId, params);
      setMonteCarloData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run Monte Carlo simulation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskMetrics();
  }, [portfolioId]);

  return {
    riskMetrics,
    monteCarloData,
    loading,
    error,
    fetchRiskMetrics,
    runMonteCarloSimulation
  };
};