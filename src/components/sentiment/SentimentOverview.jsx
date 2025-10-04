import React from 'react';
import { FiTwitter, FiMessageCircle, FiBookOpen, FiArrowUp, FiArrowDown } from 'react-icons/fi';

export default function SentimentOverview({ sentimentData, selectedAsset, onAssetChange }) {
  const assets = Object.keys(sentimentData);
  
  // Get sentiment data for the selected asset
  const assetSentiment = sentimentData[selectedAsset];
  
  if (!assetSentiment) {
    return <div className="card">Loading sentiment data...</div>;
  }
  
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
      
      {/* Asset Selection Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {assets.map(asset => (
          <button
            key={asset}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedAsset === asset
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
            onClick={() => onAssetChange(asset)}
          >
            {asset}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Side - Company Info and Overall Sentiment */}
        <div>
          <h4 className="text-base font-medium text-neutral-900 dark:text-white mb-4">
            {assetSentiment.company || selectedAsset}
          </h4>
          
          <div className="mb-6">
            <h5 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Overall Sentiment</h5>
            <div className={`p-4 rounded-lg ${getSentimentBgColor(assetSentiment.overall_sentiment.score)}`}>
              <div className={`text-2xl font-bold mb-2 ${getSentimentColor(assetSentiment.overall_sentiment.score)}`}>
                {assetSentiment.overall_sentiment.label}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                Score: {assetSentiment.overall_sentiment.score.toFixed(1)} / 5.0
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {assetSentiment.overall_sentiment.summary}
              </div>
            </div>
          </div>
          
          {/* Sentiment Trends */}
          <div>
            <h5 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Sentiment Trends</h5>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                <div className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">Daily Change</div>
                <div className="flex items-center">
                  <div className={`text-lg font-semibold ${assetSentiment.sentiment_trends.daily_change >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                    {assetSentiment.sentiment_trends.daily_change >= 0 ? '+' : ''}{assetSentiment.sentiment_trends.daily_change.toFixed(1)}
                  </div>
                  <div className="ml-2">
                    {assetSentiment.sentiment_trends.daily_change >= 0 ? (
                      <FiArrowUp className="w-4 h-4 text-success-500" />
                    ) : (
                      <FiArrowDown className="w-4 h-4 text-error-500" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                <div className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">Weekly Change</div>
                <div className="flex items-center">
                  <div className={`text-lg font-semibold ${assetSentiment.sentiment_trends.weekly_change >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                    {assetSentiment.sentiment_trends.weekly_change >= 0 ? '+' : ''}{assetSentiment.sentiment_trends.weekly_change.toFixed(1)}
                  </div>
                  <div className="ml-2">
                    {assetSentiment.sentiment_trends.weekly_change >= 0 ? (
                      <FiArrowUp className="w-4 h-4 text-success-500" />
                    ) : (
                      <FiArrowDown className="w-4 h-4 text-error-500" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                <div className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">Monthly Change</div>
                <div className="flex items-center">
                  <div className={`text-lg font-semibold ${assetSentiment.sentiment_trends.monthly_change >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                    {assetSentiment.sentiment_trends.monthly_change >= 0 ? '+' : ''}{assetSentiment.sentiment_trends.monthly_change.toFixed(1)}
                  </div>
                  <div className="ml-2">
                    {assetSentiment.sentiment_trends.monthly_change >= 0 ? (
                      <FiArrowUp className="w-4 h-4 text-success-500" />
                    ) : (
                      <FiArrowDown className="w-4 h-4 text-error-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Sentiment by Source */}
        <div>
          <h5 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Sentiment by Source
          </h5>
          
          <div className="space-y-4">
            {Object.entries(assetSentiment.sentiment_by_source).map(([source, data]) => (
              <div 
                key={source}
                className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getSourceIcon(source)}
                    <span className="ml-2 text-neutral-900 dark:text-white capitalize font-medium">{source}</span>
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {data.mentions.toLocaleString()} mentions
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`font-semibold ${getSentimentColor(getSentimentScoreFromLabel(data.label))}`}>
                    {data.label}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getSentimentProgressColor(data.label)}`}
                        style={{ width: `${getSentimentProgress(data.label)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getSentimentScoreFromLabel(label) {
  switch (label.toLowerCase()) {
    case 'very positive': return 4;
    case 'positive': return 2;
    case 'neutral': return 0;
    case 'negative': return -2;
    case 'very negative': return -4;
    default: return 0;
  }
}

function getSentimentProgress(label) {
  switch (label.toLowerCase()) {
    case 'very positive': return 90;
    case 'positive': return 70;
    case 'neutral': return 50;
    case 'negative': return 30;
    case 'very negative': return 10;
    default: return 50;
  }
}

function getSentimentProgressColor(label) {
  switch (label.toLowerCase()) {
    case 'very positive': return 'bg-emerald-500';
    case 'positive': return 'bg-green-500';
    case 'neutral': return 'bg-yellow-500';
    case 'negative': return 'bg-orange-500';
    case 'very negative': return 'bg-red-500';
    default: return 'bg-neutral-500';
  }
}