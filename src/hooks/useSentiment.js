import { useState, useEffect } from 'react';
import { sentimentAPI } from '../utils/api';

export const useSentiment = () => {
  const [sentimentData, setSentimentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchedTokens, setSearchedTokens] = useState(['AAPL', 'GOOGL', 'AMZN', 'BTC']);

  const fetchSentiment = async (token) => {
    try {
      setLoading(true);
      const response = await sentimentAPI.getSentimentData(token);
      
      setSentimentData(prev => ({
        ...prev,
        [token]: response.data
      }));
      
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to fetch sentiment for ${token}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchToken = async (token) => {
    const upperToken = token.toUpperCase();
    
    if (!searchedTokens.includes(upperToken)) {
      setSearchedTokens(prev => [...prev, upperToken]);
    }
    
    await fetchSentiment(upperToken);
  };

  const fetchDefaultTokens = async () => {
    setLoading(true);
    try {
      const promises = searchedTokens.map(token => fetchSentiment(token));
      await Promise.allSettled(promises);
      console.log("Fetched all the default tokens!!!!!!!")
    } catch (err) {
      console.error('Error fetching default tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaultTokens();
  }, []);

  return {
    sentimentData,
    loading,
    error,
    searchedTokens,
    searchToken,
    fetchSentiment
  };
};