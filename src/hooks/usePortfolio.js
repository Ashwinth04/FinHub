import { useState, useEffect } from 'react';
import { portfolioAPI } from '../utils/api';

export const usePortfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [currentPortfolio, setCurrentPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getAll();
      setPortfolios(response.data);
      
      // Set default portfolio if exists
      const defaultPortfolio = response.data.find(p => p.is_default) || response.data[0];
      if (defaultPortfolio) {
        // Fetch full portfolio details including assets
        await fetchPortfolioDetails(defaultPortfolio.id);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch portfolios');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioDetails = async (portfolioId) => {
    try {
      const response = await portfolioAPI.getById(portfolioId);
      setCurrentPortfolio(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch portfolio details');
      throw err;
    }
  };

  const createPortfolio = async (portfolioData) => {
    try {
      const response = await portfolioAPI.create(portfolioData);
      await fetchPortfolios(); // Refresh the list
      setCurrentPortfolio(response.data); // Set as current
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create portfolio');
      throw err;
    }
  };

  const addAsset = async (portfolioId, assetData) => {
    try {
      const response = await portfolioAPI.addAsset(portfolioId, assetData);
      setCurrentPortfolio(response.data); // Update current portfolio with new asset
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add asset');
      throw err;
    }
  };

  const updateAsset = async (portfolioId, assetId, data) => {
    try {
      await portfolioAPI.updateAsset(portfolioId, assetId, data);
      await fetchPortfolioDetails(portfolioId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update asset');
      throw err;
    }
  };

  const deleteAsset = async (portfolioId, assetId) => {
    try {
      await portfolioAPI.deleteAsset(portfolioId, assetId);
      await fetchPortfolioDetails(portfolioId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete asset');
      throw err;
    }
  };

  // Fetch portfolio details when currentPortfolio ID changes
  useEffect(() => {
    if (currentPortfolio?.id) {
      fetchPortfolioDetails(currentPortfolio.id);
    }
  }, [currentPortfolio?.id]);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  return {
    portfolios,
    currentPortfolio,
    loading,
    error,
    fetchPortfolios,
    fetchPortfolioDetails,
    createPortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
    setCurrentPortfolio
  };
};