import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Portfolio from '../models/Portfolio.js';
import natural from 'natural';

const router = express.Router();

// Middleware to protect all routes
router.use(authenticate);

// Get sentiment data for assets in a portfolio
router.get('/:portfolioId/sentiment', async (req, res) => {
  try {
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      _id: req.params.portfolioId,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Generate sentiment data for each asset
    const sentimentData = await generateSentimentData(portfolio.assets);
    
    res.json(sentimentData);
  } catch (err) {
    console.error('Sentiment analysis error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sentiment and price correlation for a specific asset
router.get('/assets/:symbol/correlation', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days } = req.query;
    
    // Generate historical sentiment and price data
    const correlationData = await generateCorrelationData(
      symbol,
      parseInt(days) || 30
    );
    
    res.json(correlationData);
  } catch (err) {
    console.error('Correlation data error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate sentiment data
async function generateSentimentData(assets) {
  const result = {};
  
  // Initialize sentiment analyzer
  const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  
  for (const asset of assets) {
    // Generate mock data
    const sources = ['twitter', 'reddit', 'news'];
    const sentimentBySource = {};
    
    sources.forEach(source => {
      // Generate random sentiment data for each source
      const sentimentScore = generateRandomSentiment(asset.symbol, source);
      const normalizedScore = (sentimentScore + 5) / 10; // Normalize to 0-1
      
      sentimentBySource[source] = {
        score: sentimentScore,
        normalizedScore: normalizedScore,
        sentiment: interpretSentiment(sentimentScore),
        volume: Math.floor(Math.random() * 10000) + 1000
      };
    });
    
    // Calculate overall sentiment as weighted average
    const weights = {
      twitter: 0.3,
      reddit: 0.3,
      news: 0.4
    };
    
    const overallScore = Object.keys(sentimentBySource).reduce((sum, source) => {
      return sum + sentimentBySource[source].score * weights[source];
    }, 0);
    
    // Generate mock trend data
    const trendData = {
      daily: (Math.random() * 2 - 1) * 0.5,
      weekly: (Math.random() * 2 - 1) * 1.5,
      monthly: (Math.random() * 2 - 1) * 3.0
    };
    
    // Add sentiment changes to result
    result[asset._id] = {
      symbol: asset.symbol,
      name: asset.name,
      overall: {
        score: overallScore,
        normalizedScore: (overallScore + 5) / 10,
        sentiment: interpretSentiment(overallScore)
      },
      bySource: sentimentBySource,
      trend: trendData,
      updatedAt: new Date()
    };
  }
  
  return result;
}

// Helper function to generate random sentiment with some bias based on symbol and source
function generateRandomSentiment(symbol, source) {
  // This would be replaced with actual sentiment analysis in a real implementation
  
  // Generate a base sentiment with some randomness
  let baseSentiment;
  
  // First character code as a source of deterministic "bias"
  const symbolValue = symbol.charCodeAt(0) % 5;
  
  switch (source) {
    case 'twitter':
      baseSentiment = (Math.random() * 6) - 3 + symbolValue * 0.5;
      break;
    case 'reddit':
      baseSentiment = (Math.random() * 8) - 4 + symbolValue * 0.7;
      break;
    case 'news':
      baseSentiment = (Math.random() * 4) - 2 + symbolValue * 0.3;
      break;
    default:
      baseSentiment = (Math.random() * 6) - 3;
  }
  
  // Clamp to [-5, 5] range
  return Math.max(-5, Math.min(5, baseSentiment));
}

// Helper function to interpret sentiment score
function interpretSentiment(score) {
  if (score < -3) return 'very negative';
  if (score < -1) return 'negative';
  if (score < 1) return 'neutral';
  if (score < 3) return 'positive';
  return 'very positive';
}

// Helper function to generate correlation data
async function generateCorrelationData(symbol, days) {
  const dates = [];
  const sentimentScores = [];
  const prices = [];
  
  // Generate dates
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Generate sentiment scores with some randomness and trend
  let basePrice = 100 + (symbol.charCodeAt(0) % 10) * 10;
  let sentiment = 0;
  
  for (let i = 0; i <= days; i++) {
    // Add some random change to sentiment
    sentiment = Math.max(-5, Math.min(5, sentiment + (Math.random() * 2 - 1) * 0.7));
    sentimentScores.push(sentiment);
    
    // Generate price with some correlation to sentiment
    const sentimentEffect = sentiment * 0.5;
    const randomEffect = (Math.random() * 2 - 1) * 5;
    basePrice = Math.max(10, basePrice + sentimentEffect + randomEffect);
    prices.push(basePrice);
  }
  
  // Calculate correlation
  const correlation = calculateCorrelation(sentimentScores, prices);
  
  return {
    symbol,
    days,
    dates,
    sentimentScores,
    prices,
    correlation
  };
}

// Helper function to calculate Pearson correlation
function calculateCorrelation(x, y) {
  const n = x.length;
  
  // Calculate means
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate correlation
  let numerator = 0;
  let xSS = 0;
  let ySS = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    
    numerator += xDiff * yDiff;
    xSS += xDiff * xDiff;
    ySS += yDiff * yDiff;
  }
  
  const correlation = numerator / (Math.sqrt(xSS) * Math.sqrt(ySS));
  
  return correlation;
}

export default router;