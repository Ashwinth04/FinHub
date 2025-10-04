import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import AppLayout from '../../components/layout/AppLayout';
import SentimentOverview from '../../components/sentiment/SentimentOverview';
import SentimentTrends from '../../components/sentiment/SentimentTrends';
import SentimentCorrelation from '../../components/sentiment/SentimentCorrelation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useSentiment } from '../../hooks/useSentiment';

export default function SentimentPage() {
  const { sentimentData, loading, error, searchedTokens, searchToken } = useSentiment();
  const [selectedAsset, setSelectedAsset] = useState('AAPL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      await searchToken(searchQuery.trim());
      setSelectedAsset(searchQuery.trim().toUpperCase());
      setSearchQuery('');
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleAssetChange = (symbol) => {
    setSelectedAsset(symbol);
  };
  
  if (loading && Object.keys(sentimentData).length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Sentiment Analysis</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Track market sentiment for your portfolio assets from social media and news sources
          </p>
        </div>
        
        <div className="mb-6">
          <form onSubmit={handleSearch} className="max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 pr-20"
                placeholder="Search token (e.g., AAPL, BTC)"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute inset-y-0 right-0 px-4 py-2 bg-primary-500 text-white rounded-r-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-500/10 text-error-500 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <SentimentOverview 
            sentimentData={sentimentData}
            selectedAsset={selectedAsset}
            onAssetChange={handleAssetChange}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SentimentTrends 
            assetSymbol={selectedAsset}
            sentimentData={sentimentData[selectedAsset]}
          />
          
          <SentimentCorrelation 
            correlationData={sentimentData[selectedAsset]}
          />
        </div>
      </div>
    </AppLayout>
  );
}