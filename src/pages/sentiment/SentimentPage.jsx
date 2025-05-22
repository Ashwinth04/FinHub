import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import SentimentOverview from '../../components/sentiment/SentimentOverview';
import SentimentTrends from '../../components/sentiment/SentimentTrends';
import SentimentCorrelation from '../../components/sentiment/SentimentCorrelation';

export default function SentimentPage() {
  const [selectedAsset, setSelectedAsset] = useState('AAPL');
  
  // Mock sentiment data
  const sentimentData = {
    assets: [
      { id: 1, symbol: 'AAPL', name: 'Apple Inc.' },
      { id: 2, symbol: 'MSFT', name: 'Microsoft Corp.' },
      { id: 3, symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { id: 4, symbol: 'BTC', name: 'Bitcoin' },
      { id: 5, symbol: 'ETH', name: 'Ethereum' },
    ],
    sentiment: {
      'AAPL': {
        overall: { score: 1.8, sentiment: 'positive' },
        twitter: { score: 2.1, sentiment: 'positive', volume: 7850 },
        reddit: { score: 1.6, sentiment: 'positive', volume: 4320 },
        news: { score: 1.7, sentiment: 'positive', volume: 2145 },
        trend: { daily: 0.3, weekly: -0.5, monthly: 1.2 }
      },
      'MSFT': {
        overall: { score: 2.2, sentiment: 'positive' },
        twitter: { score: 2.4, sentiment: 'positive', volume: 6540 },
        reddit: { score: 2.1, sentiment: 'positive', volume: 3870 },
        news: { score: 2.0, sentiment: 'positive', volume: 1980 },
        trend: { daily: 0.2, weekly: 0.8, monthly: 1.5 }
      },
      'AMZN': {
        overall: { score: -0.7, sentiment: 'negative' },
        twitter: { score: -1.2, sentiment: 'negative', volume: 8920 },
        reddit: { score: -0.4, sentiment: 'neutral', volume: 5210 },
        news: { score: -0.5, sentiment: 'negative', volume: 2340 },
        trend: { daily: -0.3, weekly: -1.2, monthly: -2.1 }
      },
      'BTC': {
        overall: { score: 0.9, sentiment: 'positive' },
        twitter: { score: 1.5, sentiment: 'positive', volume: 12450 },
        reddit: { score: 0.7, sentiment: 'positive', volume: 9870 },
        news: { score: 0.5, sentiment: 'neutral', volume: 3560 },
        trend: { daily: -0.8, weekly: 1.7, monthly: 0.5 }
      },
      'ETH': {
        overall: { score: 1.3, sentiment: 'positive' },
        twitter: { score: 1.8, sentiment: 'positive', volume: 9560 },
        reddit: { score: 1.2, sentiment: 'positive', volume: 7840 },
        news: { score: 0.9, sentiment: 'positive', volume: 2780 },
        trend: { daily: 0.5, weekly: 1.2, monthly: 0.8 }
      }
    }
  };
  
  // Mock correlation data for the selected asset
  const getCorrelationData = (symbol) => {
    // Generate 30 days of sentiment and price data
    const today = new Date();
    const dates = [];
    const sentiment = [];
    const prices = [];
    
    let sentimentBase;
    let priceBase;
    
    switch (symbol) {
      case 'AAPL':
        sentimentBase = 1.8;
        priceBase = 175;
        break;
      case 'MSFT':
        sentimentBase = 2.2;
        priceBase = 290;
        break;
      case 'AMZN':
        sentimentBase = -0.7;
        priceBase = 170;
        break;
      case 'BTC':
        sentimentBase = 0.9;
        priceBase = 51250;
        break;
      case 'ETH':
        sentimentBase = 1.3;
        priceBase = 3120;
        break;
      default:
        sentimentBase = 0;
        priceBase = 100;
    }
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
      
      // Generate sentiment with some randomness and trend
      const randomSentiment = Math.random() * 2 - 1;
      const sentimentValue = Math.min(5, Math.max(-5, sentimentBase + randomSentiment));
      sentiment.push(sentimentValue);
      
      // Generate price data with some correlation to sentiment
      const sentimentEffect = sentimentValue * 0.5;
      const randomEffect = (Math.random() * 2 - 1) * 5;
      const priceValue = Math.max(1, priceBase + sentimentEffect + randomEffect);
      prices.push(priceValue);
      
      // Update for the next point
      sentimentBase = sentimentValue;
      priceBase = priceValue;
    }
    
    // Calculate a simplified correlation coefficient
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < sentiment.length; i++) {
      sumX += sentiment[i];
      sumY += prices[i];
      sumXY += sentiment[i] * prices[i];
      sumX2 += sentiment[i] * sentiment[i];
      sumY2 += prices[i] * prices[i];
    }
    
    const n = sentiment.length;
    const correlation = ((n * sumXY) - (sumX * sumY)) / Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
    
    return {
      symbol,
      dates,
      sentiment,
      prices,
      correlation
    };
  };
  
  const handleAssetChange = (symbol) => {
    setSelectedAsset(symbol);
  };
  
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
          <SentimentOverview 
            sentimentData={sentimentData}
            selectedAsset={selectedAsset}
            onAssetChange={handleAssetChange}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SentimentTrends 
            assetSymbol={selectedAsset}
            sentimentData={sentimentData.sentiment[selectedAsset]}
          />
          
          <SentimentCorrelation 
            correlationData={getCorrelationData(selectedAsset)}
          />
        </div>
      </div>
    </AppLayout>
  );
}