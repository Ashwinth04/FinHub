import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Portfolio from '../models/Portfolio.js';
import { Matrix } from 'ml-matrix';
import { PCA } from 'ml-pca';

const router = express.Router();

// Middleware to protect all routes
router.use(authenticate);

// Optimize a portfolio based on various strategies
router.post('/optimize', async (req, res) => {
  try {
    const { portfolioId, objective, riskTolerance } = req.body;
    
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Mock historical returns data
    // In a real implementation, this would come from stored historical data or API
    const mockHistoricalReturns = generateMockHistoricalReturns(portfolio.assets);
    
    let result;
    
    // Apply different optimization strategies based on objective
    switch (objective) {
      case 'maxSharpe':
        result = optimizeMaxSharpe(portfolio.assets, mockHistoricalReturns);
        break;
      case 'minVolatility':
        result = optimizeMinVolatility(portfolio.assets, mockHistoricalReturns);
        break;
      case 'equalRisk':
        result = optimizeEqualRiskContribution(portfolio.assets, mockHistoricalReturns);
        break;
      default:
        return res.status(400).json({ message: 'Invalid optimization objective' });
    }
    
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

// Helper function to generate mock historical returns
function generateMockHistoricalReturns(assets) {
  const returns = {};
  const periods = 52; // One year of weekly returns
  
  assets.forEach(asset => {
    returns[asset._id] = Array(periods).fill(0).map(() => {
      // Generate random returns with some correlation to asset type
      let baseReturn;
      
      switch (asset.type) {
        case 'stock':
          baseReturn = 0.002; // ~10% annually
          break;
        case 'bond':
          baseReturn = 0.0008; // ~4% annually
          break;
        case 'crypto':
          baseReturn = 0.005; // ~25% annually with high volatility
          break;
        case 'reit':
          baseReturn = 0.0015; // ~7.5% annually
          break;
        default:
          baseReturn = 0.001;
      }
      
      // Add volatility based on asset type
      let volatility;
      
      switch (asset.type) {
        case 'stock':
          volatility = 0.03;
          break;
        case 'bond':
          volatility = 0.01;
          break;
        case 'crypto':
          volatility = 0.08;
          break;
        case 'reit':
          volatility = 0.04;
          break;
        default:
          volatility = 0.02;
      }
      
      return baseReturn + (Math.random() - 0.5) * volatility;
    });
  });
  
  return returns;
}

// Optimization strategy 1: Maximum Sharpe Ratio
function optimizeMaxSharpe(assets, historicalReturns) {
  // Create a covariance matrix from historical returns
  const assetIds = assets.map(asset => asset._id.toString());
  const returns = assetIds.map(id => historicalReturns[id]);
  
  // Calculate mean returns
  const meanReturns = returns.map(r => r.reduce((a, b) => a + b, 0) / r.length);
  
  // Calculate covariance matrix
  const cov = calculateCovarianceMatrix(returns);
  
  // In a real implementation, this would solve the optimization problem
  // For this mock, we'll use a simplified approach
  
  // Simplified portfolio weights based on return/risk ratio
  const weights = [];
  const riskAdjustedReturns = [];
  
  for (let i = 0; i < meanReturns.length; i++) {
    // Use variance (diagonal of cov matrix) as risk measure
    const risk = Math.sqrt(cov[i][i]);
    riskAdjustedReturns.push(meanReturns[i] / risk);
  }
  
  // Normalize the risk-adjusted returns to get weights
  const sum = riskAdjustedReturns.reduce((a, b) => a + b, 0);
  for (let i = 0; i < riskAdjustedReturns.length; i++) {
    weights.push(riskAdjustedReturns[i] / sum);
  }
  
  // Calculate portfolio metrics
  const portfolioReturn = meanReturns.reduce((sum, r, i) => sum + r * weights[i], 0);
  
  // Calculate portfolio risk (simplified)
  let portfolioRisk = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      portfolioRisk += weights[i] * weights[j] * cov[i][j];
    }
  }
  portfolioRisk = Math.sqrt(portfolioRisk);
  
  // Calculate Sharpe ratio (assuming risk-free rate of 0 for simplicity)
  const sharpeRatio = portfolioReturn / portfolioRisk;
  
  // Prepare result with weights for each asset
  const result = {
    type: 'maximum_sharpe',
    weights: {},
    metrics: {
      expectedReturn: portfolioReturn * 52, // Annualized
      expectedRisk: portfolioRisk * Math.sqrt(52), // Annualized
      sharpeRatio
    }
  };
  
  assets.forEach((asset, i) => {
    result.weights[asset._id] = {
      symbol: asset.symbol,
      name: asset.name,
      weight: weights[i]
    };
  });
  
  return result;
}

// Optimization strategy 2: Minimum Volatility
function optimizeMinVolatility(assets, historicalReturns) {
  // Similar approach to maxSharpe, but prioritizing minimum variance
  const assetIds = assets.map(asset => asset._id.toString());
  const returns = assetIds.map(id => historicalReturns[id]);
  
  // Calculate mean returns
  const meanReturns = returns.map(r => r.reduce((a, b) => a + b, 0) / r.length);
  
  // Calculate covariance matrix
  const cov = calculateCovarianceMatrix(returns);
  
  // Simplified: inverse of variance as weights (higher variance → lower weight)
  const varianceInverse = [];
  for (let i = 0; i < meanReturns.length; i++) {
    varianceInverse.push(1 / cov[i][i]);
  }
  
  // Normalize to get weights
  const sum = varianceInverse.reduce((a, b) => a + b, 0);
  const weights = varianceInverse.map(v => v / sum);
  
  // Calculate portfolio metrics
  const portfolioReturn = meanReturns.reduce((sum, r, i) => sum + r * weights[i], 0);
  
  // Calculate portfolio risk
  let portfolioRisk = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      portfolioRisk += weights[i] * weights[j] * cov[i][j];
    }
  }
  portfolioRisk = Math.sqrt(portfolioRisk);
  
  // Prepare result
  const result = {
    type: 'minimum_volatility',
    weights: {},
    metrics: {
      expectedReturn: portfolioReturn * 52, // Annualized
      expectedRisk: portfolioRisk * Math.sqrt(52), // Annualized
      sharpeRatio: portfolioReturn / portfolioRisk
    }
  };
  
  assets.forEach((asset, i) => {
    result.weights[asset._id] = {
      symbol: asset.symbol,
      name: asset.name,
      weight: weights[i]
    };
  });
  
  return result;
}

// Optimization strategy 3: Equal Risk Contribution
function optimizeEqualRiskContribution(assets, historicalReturns) {
  const assetIds = assets.map(asset => asset._id.toString());
  const returns = assetIds.map(id => historicalReturns[id]);
  
  // Calculate mean returns
  const meanReturns = returns.map(r => r.reduce((a, b) => a + b, 0) / r.length);
  
  // Calculate covariance matrix
  const cov = calculateCovarianceMatrix(returns);
  
  // For ERC, we want each asset to contribute equally to portfolio risk
  // This is complex to solve exactly, so we'll use a simplified approach
  // using marginal risk contributions
  
  // Start with equal weights
  const n = assets.length;
  let weights = Array(n).fill(1/n);
  
  // Simplified iterative approach to approximate ERC weights
  // In a real implementation, this would use optimization techniques
  for (let iter = 0; iter < 10; iter++) {
    // Calculate portfolio variance with current weights
    let portfolioVariance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        portfolioVariance += weights[i] * weights[j] * cov[i][j];
      }
    }
    
    // Calculate marginal risk contribution for each asset
    const riskContributions = [];
    for (let i = 0; i < n; i++) {
      let mrc = 0;
      for (let j = 0; j < n; j++) {
        mrc += weights[j] * cov[i][j];
      }
      riskContributions.push(weights[i] * mrc / portfolioVariance);
    }
    
    // Adjust weights based on risk contributions
    const targetRisk = 1/n;
    for (let i = 0; i < n; i++) {
      weights[i] = weights[i] * (targetRisk / riskContributions[i]);
    }
    
    // Normalize weights
    const weightSum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / weightSum);
  }
  
  // Calculate portfolio metrics with final weights
  const portfolioReturn = meanReturns.reduce((sum, r, i) => sum + r * weights[i], 0);
  
  // Calculate portfolio risk
  let portfolioRisk = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      portfolioRisk += weights[i] * weights[j] * cov[i][j];
    }
  }
  portfolioRisk = Math.sqrt(portfolioRisk);
  
  // Prepare result
  const result = {
    type: 'equal_risk_contribution',
    weights: {},
    metrics: {
      expectedReturn: portfolioReturn * 52, // Annualized
      expectedRisk: portfolioRisk * Math.sqrt(52), // Annualized
      sharpeRatio: portfolioReturn / portfolioRisk
    }
  };
  
  assets.forEach((asset, i) => {
    result.weights[asset._id] = {
      symbol: asset.symbol,
      name: asset.name,
      weight: weights[i]
    };
  });
  
  return result;
}

// Helper function to calculate covariance matrix
function calculateCovarianceMatrix(returns) {
  const n = returns.length;
  const periods = returns[0].length;
  
  // Mean returns
  const means = returns.map(assetReturns => 
    assetReturns.reduce((sum, val) => sum + val, 0) / periods
  );
  
  // Initialize covariance matrix
  const cov = Array(n).fill().map(() => Array(n).fill(0));
  
  // Calculate covariance values
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let t = 0; t < periods; t++) {
        sum += (returns[i][t] - means[i]) * (returns[j][t] - means[j]);
      }
      cov[i][j] = sum / (periods - 1);
      
      // Covariance matrix is symmetric
      if (i !== j) {
        cov[j][i] = cov[i][j];
      }
    }
  }
  
  return cov;
}

export default router;