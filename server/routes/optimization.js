import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Portfolio from '../models/Portfolio.js';
import Asset from '../models/Asset.js';
import { dbRun, dbGet } from '../database/database.js';

const router = express.Router();

// Middleware to protect all routes
router.use(authenticate);

// Optimize a portfolio based on various strategies
router.post('/optimize', async (req, res) => {
  try {
    const { portfolioId, objective, riskTolerance } = req.body;
    
    const portfolio = await Portfolio.findById(portfolioId);
    
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const assets = await Asset.findByPortfolioId(portfolio.id);
    
    if (assets.length === 0) {
      return res.status(400).json({ message: 'Portfolio has no assets to optimize' });
    }

    // Generate mock historical returns data
    const mockHistoricalReturns = generateMockHistoricalReturns(assets);
    
    let result;
    
    // Apply different optimization strategies
    switch (objective) {
      case 'maxSharpe':
        result = optimizeMaxSharpe(assets, mockHistoricalReturns);
        break;
      case 'minVolatility':
        result = optimizeMinVolatility(assets, mockHistoricalReturns);
        break;
      case 'equalRisk':
        result = optimizeEqualRiskContribution(assets, mockHistoricalReturns);
        break;
      default:
        return res.status(400).json({ message: 'Invalid optimization objective' });
    }
    
    // Save optimization result to database
    await dbRun(`
      INSERT INTO optimization_results (portfolio_id, strategy, risk_tolerance, expected_return, expected_risk, sharpe_ratio, weights)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      portfolio.id,
      objective,
      riskTolerance,
      parseFloat(result.metrics.expectedReturn),
      parseFloat(result.metrics.expectedRisk),
      parseFloat(result.metrics.sharpeRatio),
      JSON.stringify(result.weights)
    ]);

    // Add optimization metadata
    result.objective = objective;
    result.riskTolerance = riskTolerance;
    result.optimizedAt = new Date();
    
    res.json(result);
  } catch (err) {
    console.error('Portfolio optimization error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get optimization history for a portfolio
router.get('/:portfolioId/history', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const history = await dbAll(
      'SELECT * FROM optimization_results WHERE portfolio_id = ? ORDER BY created_at DESC LIMIT 10',
      [portfolio.id]
    );

    res.json(history);
  } catch (err) {
    console.error('Get optimization history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions (simplified versions of the original complex calculations)
function generateMockHistoricalReturns(assets) {
  const returns = {};
  const periods = 52;
  
  assets.forEach(asset => {
    returns[asset.id] = Array(periods).fill(0).map(() => {
      let baseReturn;
      let volatility;
      
      switch (asset.type) {
        case 'stock':
          baseReturn = 0.002;
          volatility = 0.03;
          break;
        case 'bond':
          baseReturn = 0.0008;
          volatility = 0.01;
          break;
        case 'crypto':
          baseReturn = 0.005;
          volatility = 0.08;
          break;
        case 'reit':
          baseReturn = 0.0015;
          volatility = 0.04;
          break;
        default:
          baseReturn = 0.001;
          volatility = 0.02;
      }
      
      return baseReturn + (Math.random() - 0.5) * volatility;
    });
  });
  
  return returns;
}

function optimizeMaxSharpe(assets, historicalReturns) {
  const assetIds = assets.map(asset => asset.id);
  const returns = assetIds.map(id => historicalReturns[id]);
  
  const meanReturns = returns.map(r => r.reduce((a, b) => a + b, 0) / r.length);
  const cov = calculateCovarianceMatrix(returns);
  
  const weights = [];
  const riskAdjustedReturns = [];
  
  for (let i = 0; i < meanReturns.length; i++) {
    const risk = Math.sqrt(cov[i][i]);
    riskAdjustedReturns.push(meanReturns[i] / risk);
  }
  
  const sum = riskAdjustedReturns.reduce((a, b) => a + b, 0);
  for (let i = 0; i < riskAdjustedReturns.length; i++) {
    weights.push(riskAdjustedReturns[i] / sum);
  }
  
  const portfolioReturn = meanReturns.reduce((sum, r, i) => sum + r * weights[i], 0);
  let portfolioRisk = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      portfolioRisk += weights[i] * weights[j] * cov[i][j];
    }
  }
  portfolioRisk = Math.sqrt(portfolioRisk);
  
  const result = {
    type: 'maximum_sharpe',
    weights: {},
    metrics: {
      expectedReturn: (portfolioReturn * 52).toFixed(2),
      expectedRisk: (portfolioRisk * Math.sqrt(52)).toFixed(2),
      sharpeRatio: (portfolioReturn / portfolioRisk).toFixed(2)
    }
  };
  
  assets.forEach((asset, i) => {
    result.weights[asset.id] = {
      symbol: asset.symbol,
      name: asset.name,
      weight: weights[i],
      currentAllocation: (1 / assets.length) * 100, // Mock current allocation
      optimizedAllocation: weights[i] * 100
    };
  });
  
  return result;
}

function optimizeMinVolatility(assets, historicalReturns) {
  const assetIds = assets.map(asset => asset.id);
  const returns = assetIds.map(id => historicalReturns[id]);
  
  const meanReturns = returns.map(r => r.reduce((a, b) => a + b, 0) / r.length);
  const cov = calculateCovarianceMatrix(returns);
  
  const varianceInverse = [];
  for (let i = 0; i < meanReturns.length; i++) {
    varianceInverse.push(1 / cov[i][i]);
  }
  
  const sum = varianceInverse.reduce((a, b) => a + b, 0);
  const weights = varianceInverse.map(v => v / sum);
  
  const portfolioReturn = meanReturns.reduce((sum, r, i) => sum + r * weights[i], 0);
  let portfolioRisk = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      portfolioRisk += weights[i] * weights[j] * cov[i][j];
    }
  }
  portfolioRisk = Math.sqrt(portfolioRisk);
  
  const result = {
    type: 'minimum_volatility',
    weights: {},
    metrics: {
      expectedReturn: (portfolioReturn * 52).toFixed(2),
      expectedRisk: (portfolioRisk * Math.sqrt(52)).toFixed(2),
      sharpeRatio: (portfolioReturn / portfolioRisk).toFixed(2)
    }
  };
  
  assets.forEach((asset, i) => {
    result.weights[asset.id] = {
      symbol: asset.symbol,
      name: asset.name,
      weight: weights[i],
      currentAllocation: (1 / assets.length) * 100,
      optimizedAllocation: weights[i] * 100
    };
  });
  
  return result;
}

function optimizeEqualRiskContribution(assets, historicalReturns) {
  const n = assets.length;
  let weights = Array(n).fill(1/n);
  
  // Simplified ERC calculation
  for (let iter = 0; iter < 10; iter++) {
    const targetRisk = 1/n;
    for (let i = 0; i < n; i++) {
      weights[i] = weights[i] * (targetRisk / (weights[i] + 0.01));
    }
    
    const weightSum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / weightSum);
  }
  
  const assetIds = assets.map(asset => asset.id);
  const returns = assetIds.map(id => historicalReturns[id]);
  const meanReturns = returns.map(r => r.reduce((a, b) => a + b, 0) / r.length);
  const cov = calculateCovarianceMatrix(returns);
  
  const portfolioReturn = meanReturns.reduce((sum, r, i) => sum + r * weights[i], 0);
  let portfolioRisk = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      portfolioRisk += weights[i] * weights[j] * cov[i][j];
    }
  }
  portfolioRisk = Math.sqrt(portfolioRisk);
  
  const result = {
    type: 'equal_risk_contribution',
    weights: {},
    metrics: {
      expectedReturn: (portfolioReturn * 52).toFixed(2),
      expectedRisk: (portfolioRisk * Math.sqrt(52)).toFixed(2),
      sharpeRatio: (portfolioReturn / portfolioRisk).toFixed(2)
    }
  };
  
  assets.forEach((asset, i) => {
    result.weights[asset.id] = {
      symbol: asset.symbol,
      name: asset.name,
      weight: weights[i],
      currentAllocation: (1 / assets.length) * 100,
      optimizedAllocation: weights[i] * 100
    };
  });
  
  return result;
}

function calculateCovarianceMatrix(returns) {
  const n = returns.length;
  const periods = returns[0].length;
  
  const means = returns.map(assetReturns => 
    assetReturns.reduce((sum, val) => sum + val, 0) / periods
  );
  
  const cov = Array(n).fill().map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let t = 0; t < periods; t++) {
        sum += (returns[i][t] - means[i]) * (returns[j][t] - means[j]);
      }
      cov[i][j] = sum / (periods - 1);
      
      if (i !== j) {
        cov[j][i] = cov[i][j];
      }
    }
  }
  
  return cov;
}

export default router;