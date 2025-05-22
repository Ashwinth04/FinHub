import React from 'react';
import { FiTwitter, FiMessageCircle, FiBookOpen } from 'react-icons/fi';

export default function SentimentOverview({ sentimentData, selectedAsset, onAssetChange }) {
  const { assets, sentiment } = sentimentData;
  
  // Get sentiment data for the selected asset
  const assetSentiment = sentiment[selectedAsset];
  
  // Helper to determine sentiment color
  const getSentimentColor = (score) => {
    if (score >= 2) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 0.5) return 'text-green-500 dark:text-green-400';
    if (score >= -0.5) return 'text-yellow-500 dark:text-yellow-400';
    if (score >= -2) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };
  
  const getSentimentBgColor = (score) => {
    if (score >= 2) return 'bg-emerald-100 dark:bg-emerald-900/20';
    if (score >= 0.5) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= -0.5) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (score >= -2) return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };
  
  const getSentimentLabel = (score) => {
    if (score >= 2) return 'Very Positive';
    if (score >= 0.5) return 'Positive';
    if (score >= -0.5) return 'Neutral';
    if (score >= -2) return 'Negative';
    return 'Very Negative';
  };
  
  const getSourceIcon = (source) => {
    switch (source) {
      case 'twitter':
        return <FiTwitter className="h-5 w-5 text-blue-400" />;
      case 'reddit':
        return <FiMessageCircle className="h-5 w-5 text-orange-500" />;
      case 'news':
        return <FiBookOpen className="h-5 w-5 text-neutral-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Sentiment Overview</h3>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {assets.map(asset => (
          <button
            key={asset.id}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedAsset === asset.symbol
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
            onClick={() => onAssetChange(asset.symbol)}
          >
            {asset.symbol}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1">
          <h4 className="text-base font-medium text-neutral-900 dark:text-white mb-4">
            {assets.find(a => a.symbol === selectedAsset)?.name || selectedAsset}
          </h4>
          
          <div className={`p-4 rounded-lg ${getSentimentBgColor(assetSentiment.overall.score)}`}>
            <div className="text-lg font-semibold mb-1 text-neutral-900 dark:text-white">Overall Sentiment</div>
            <div className={`text-2xl font-bold mb-2 ${getSentimentColor(assetSentiment.overall.score)}`}>
              {getSentimentLabel(assetSentiment.overall.score)}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Score: {assetSentiment.overall.score.toFixed(1)} / 5.0
            </div>
            <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
              {generateSentimentSummary(selectedAsset, assetSentiment.overall.score)}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3">
          <h4 className="text-base font-medium text-neutral-900 dark:text-white mb-4">
            Sentiment by Source
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['twitter', 'reddit', 'news'].map(source => (
              <div 
                key={source}
                className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg"
              >
                <div className="flex items-center mb-2">
                  {getSourceIcon(source)}
                  <span className="ml-2 text-neutral-900 dark:text-white capitalize">{source}</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSentimentColor(assetSentiment[source].score)}`}
                      style={{ width: `${((assetSentiment[source].score + 5) / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className={`font-medium ${getSentimentColor(assetSentiment[source].score)}`}>
                    {getSentimentLabel(assetSentiment[source].score)}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {assetSentiment[source].volume.toLocaleString()} mentions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-base font-medium text-neutral-900 dark:text-white mb-4">
          Sentiment Trends
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">Daily Change</div>
            <div className="flex items-center">
              <div className={`text-lg font-semibold ${assetSentiment.trend.daily >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                {assetSentiment.trend.daily >= 0 ? '+' : ''}{assetSentiment.trend.daily.toFixed(1)}
              </div>
              <div className="ml-2">
                {assetSentiment.trend.daily >= 0 ? (
                  <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">Weekly Change</div>
            <div className="flex items-center">
              <div className={`text-lg font-semibold ${assetSentiment.trend.weekly >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                {assetSentiment.trend.weekly >= 0 ? '+' : ''}{assetSentiment.trend.weekly.toFixed(1)}
              </div>
              <div className="ml-2">
                {assetSentiment.trend.weekly >= 0 ? (
                  <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">Monthly Change</div>
            <div className="flex items-center">
              <div className={`text-lg font-semibold ${assetSentiment.trend.monthly >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                {assetSentiment.trend.monthly >= 0 ? '+' : ''}{assetSentiment.trend.monthly.toFixed(1)}
              </div>
              <div className="ml-2">
                {assetSentiment.trend.monthly >= 0 ? (
                  <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate a sentiment summary
function generateSentimentSummary(symbol, score) {
  if (score >= 2) {
    return `${symbol} is receiving overwhelmingly positive sentiment across social media and news sources. Users are expressing strong confidence in its future performance.`;
  } else if (score >= 0.5) {
    return `${symbol} is generally viewed positively across platforms. Most discussions highlight its strengths with some minor concerns noted.`;
  } else if (score >= -0.5) {
    return `Sentiment around ${symbol} is mixed, with both positive and negative opinions being expressed relatively equally.`;
  } else if (score >= -2) {
    return `${symbol} is facing criticism across platforms. Users are expressing concerns about its near-term prospects.`;
  } else {
    return `${symbol} is receiving strongly negative sentiment across social media and news sources. There appears to be significant concern about its performance.`;
  }
}