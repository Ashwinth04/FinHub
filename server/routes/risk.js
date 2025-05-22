import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Portfolio from '../models/Portfolio.js';

const router = express.Router();

// Middleware to protect all routes
router.use(authenticate);

// Calculate risk metrics for a portfolio
router.get('/:portfolioId/metrics', async (req, res) => {
  try {
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      _id: req.params.portfolioId,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Generate mock historical data
    const historicalData = generateMockHistoricalData(portfolio.assets);
    
    // Calculate metrics
    const volatility = calculateVolatility(historicalData);
    const sharpeRatio = calculateSharpeRatio(historicalData);
    const maxDrawdown = calculateMaxDrawdown(historicalData);
    const valueAtRisk = calculateValueAtRisk(historicalData, portfolio);
    
    // Calculate correlation matrix between assets
    const correlationMatrix = calculateCorrelationMatrix(historicalData);
    
    res.json({
      volatility,
      sharpeRatio,
      maxDrawdown,
      valueAtRisk,
      correlationMatrix,
      beta: 1.15, // Mocked beta value
      alpha: 0.28  // Mocked alpha value
    });
  } catch (err) {
    console.error('Risk metrics calculation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Run Monte Carlo simulation for a portfolio
router.post('/:portfolioId/monte-carlo', async (req, res) => {
  try {
    const { simulations, years, confidenceLevel } = req.body;
    
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      _id: req.params.portfolioId,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Run Monte Carlo simulation
    const results = runMonteCarloSimulation(
      portfolio,
      simulations || 1000,
      years || 10,
      confidenceLevel || 0.95
    );
    
    res.json(results);
  } catch (err) {
    console.error('Monte Carlo simulation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate mock historical data for assets
function generateMockHistoricalData(assets) {
  const data = {
    dates: [],
    assetValues: {},
    portfolioValues: []
  };
  
  // Generate dates for the past year (daily)
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    data.dates.push(date.toISOString().split('T')[0]);
  }
  
  // Generate mock values for each asset
  assets.forEach(asset => {
    const values = [];
    let currentValue = asset.purchasePrice;
    
    // Set volatility based on asset type
    let volatility;
    switch (asset.type) {
      case 'stock':
        volatility = 0.015;
        break;
      case 'bond':
        volatility = 0.005;
        break;
      case 'crypto':
        volatility = 0.04;
        break;
      case 'reit':
        volatility = 0.02;
        break;
      default:
        volatility = 0.01;
    }
    
    // Generate daily values with random walk
    for (let i = 0; i < 365; i++) {
      const change = currentValue * (Math.random() * 2 - 1) * volatility;
      currentValue += change;
      
      if (currentValue < 0) currentValue = 0.01; // Prevent negative values
      
      values.push(currentValue);
    }
    
    data.assetValues[asset._id] = values;
  });
  
  // Calculate portfolio values
  for (let i = 0; i < 365; i++) {
    let portfolioValue = 0;
    
    assets.forEach(asset => {
      portfolioValue += data.assetValues[asset._id][i] * asset.quantity;
    });
    
    data.portfolioValues.push(portfolioValue);
  }
  
  return data;
}

// Calculate volatility (standard deviation of returns)
function calculateVolatility(historicalData) {
  const returns = calculateDailyReturns(historicalData.portfolioValues);
  
  // Calculate standard deviation
  const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const squaredDiffs = returns.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to annualized volatility
  const annualizedVolatility = stdDev * Math.sqrt(252); // Assuming 252 trading days
  
  return {
    daily: stdDev,
    annualized: annualizedVolatility
  };
}

// Calculate Sharpe ratio
function calculateSharpeRatio(historicalData) {
  const returns = calculateDailyReturns(historicalData.portfolioValues);
  
  // Calculate average return
  const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  
  // Calculate standard deviation
  const squaredDiffs = returns.map(val => Math.pow(val - avgReturn, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Assume risk-free rate
  const riskFreeRate = 0.035 / 252; // Approximate daily rate from 3.5% annual
  
  // Calculate Sharpe ratio
  const dailySharpe = (avgReturn - riskFreeRate) / stdDev;
  
  // Annualize
  const annualizedSharpe = dailySharpe * Math.sqrt(252);
  
  return {
    daily: dailySharpe,
    annualized: annualizedSharpe
  };
}

// Calculate maximum drawdown
function calculateMaxDrawdown(historicalData) {
  const values = historicalData.portfolioValues;
  
  let maxValue = values[0];
  let maxDrawdown = 0;
  let drawdownStart = 0;
  let drawdownEnd = 0;
  let currentDrawdownStart = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > maxValue) {
      maxValue = values[i];
      currentDrawdownStart = i;
    }
    
    const drawdown = (maxValue - values[i]) / maxValue;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      drawdownStart = currentDrawdownStart;
      drawdownEnd = i;
    }
  }
  
  return {
    maxDrawdown: maxDrawdown,
    startDate: historicalData.dates[drawdownStart],
    endDate: historicalData.dates[drawdownEnd],
    durationDays: drawdownEnd - drawdownStart
  };
}

// Calculate Value at Risk (VaR)
function calculateValueAtRisk(historicalData, portfolio) {
  const returns = calculateDailyReturns(historicalData.portfolioValues);
  
  // Sort returns in ascending order
  returns.sort((a, b) => a - b);
  
  // Calculate VaR at different confidence levels
  const portfolioValue = portfolio.assets.reduce(
    (total, asset) => total + asset.currentPrice * asset.quantity, 
    0
  );
  
  // Calculate VaR at 95% and 99% confidence levels
  const var95Index = Math.floor(returns.length * 0.05);
  const var99Index = Math.floor(returns.length * 0.01);
  
  const var95 = -returns[var95Index] * portfolioValue;
  const var99 = -returns[var99Index] * portfolioValue;
  
  return {
    portfolioValue,
    var95,
    var99,
    var95Percent: -returns[var95Index] * 100,
    var99Percent: -returns[var99Index] * 100
  };
}

// Calculate correlation matrix between assets
function calculateCorrelationMatrix(historicalData) {
  const assetIds = Object.keys(historicalData.assetValues);
  const correlationMatrix = {};
  
  // Calculate returns for each asset
  const assetReturns = {};
  
  assetIds.forEach(id => {
    assetReturns[id] = calculateDailyReturns(historicalData.assetValues[id]);
  });
  
  // Calculate correlation between each pair of assets
  assetIds.forEach(id1 => {
    correlationMatrix[id1] = {};
    
    assetIds.forEach(id2 => {
      const correlation = calculateCorrelation(
        assetReturns[id1],
        assetReturns[id2]
      );
      
      correlationMatrix[id1][id2] = correlation;
    });
  });
  
  return correlationMatrix;
}

// Calculate correlation between two series
function calculateCorrelation(series1, series2) {
  const n = Math.min(series1.length, series2.length);
  
  // Calculate means
  const mean1 = series1.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = series2.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate covariance and variances
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = series1[i] - mean1;
    const diff2 = series2[i] - mean2;
    
    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }
  
  covariance /= n;
  variance1 /= n;
  variance2 /= n;
  
  // Calculate correlation
  const correlation = covariance / (Math.sqrt(variance1) * Math.sqrt(variance2));
  
  return correlation;
}

// Calculate daily returns from prices
function calculateDailyReturns(prices) {
  const returns = [];
  
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  return returns;
}

// Run Monte Carlo simulation
function runMonteCarloSimulation(portfolio, simulations, years, confidenceLevel) {
  // Calculate initial portfolio value
  const initialValue = portfolio.assets.reduce(
    (total, asset) => total + asset.currentPrice * asset.quantity,
    0
  );
  
  // Set up result structure
  const results = {
    initialValue,
    simulations: [],
    statistics: {}
  };
  
  // Generate return assumptions for each asset
  const assetAssumptions = portfolio.assets.map(asset => {
    // Set mean return based on asset type
    let meanReturn;
    switch (asset.type) {
      case 'stock':
        meanReturn = 0.08;
        break;
      case 'bond':
        meanReturn = 0.04;
        break;
      case 'crypto':
        meanReturn = 0.12;
        break;
      case 'reit':
        meanReturn = 0.06;
        break;
      default:
        meanReturn = 0.05;
    }
    
    // Set volatility based on asset type
    let volatility;
    switch (asset.type) {
      case 'stock':
        volatility = 0.18;
        break;
      case 'bond':
        volatility = 0.05;
        break;
      case 'crypto':
        volatility = 0.60;
        break;
      case 'reit':
        volatility = 0.15;
        break;
      default:
        volatility = 0.10;
    }
    
    return {
      id: asset._id,
      symbol: asset.symbol,
      weight: (asset.currentPrice * asset.quantity) / initialValue,
      meanReturn,
      volatility
    };
  });
  
  // Calculate portfolio-level assumptions (simplified)
  const portfolioMeanReturn = assetAssumptions.reduce(
    (sum, asset) => sum + asset.meanReturn * asset.weight,
    0
  );
  
  // Simplified calculation - in reality would use correlation matrix
  const portfolioVolatility = Math.sqrt(
    assetAssumptions.reduce(
      (sum, asset) => sum + Math.pow(asset.volatility * asset.weight, 2),
      0
    )
  );
  
  // Run simulations
  const finalValues = [];
  const timeSteps = years * 12; // Monthly steps
  
  for (let sim = 0; sim < simulations; sim++) {
    const pathValues = [initialValue];
    let currentValue = initialValue;
    
    for (let t = 0; t < timeSteps; t++) {
      // Generate random return from normal distribution
      const randomReturn = generateNormalRandom(portfolioMeanReturn / 12, portfolioVolatility / Math.sqrt(12));
      
      // Update value
      currentValue = currentValue * (1 + randomReturn);
      pathValues.push(currentValue);
    }
    
    results.simulations.push({
      id: sim,
      path: pathValues,
      finalValue: currentValue
    });
    
    finalValues.push(currentValue);
  }
  
  // Calculate statistics
  finalValues.sort((a, b) => a - b);
  
  // Calculate confidence intervals
  const lowerIndex = Math.floor(simulations * (1 - confidenceLevel) / 2);
  const upperIndex = Math.floor(simulations * (1 + confidenceLevel) / 2);
  
  results.statistics = {
    median: finalValues[Math.floor(simulations / 2)],
    mean: finalValues.reduce((sum, val) => sum + val, 0) / simulations,
    min: finalValues[0],
    max: finalValues[simulations - 1],
    confidenceInterval: {
      level: confidenceLevel,
      lower: finalValues[lowerIndex],
      upper: finalValues[upperIndex]
    }
  };
  
  return results;
}

// Helper function to generate random numbers from normal distribution
function generateNormalRandom(mean, stdDev) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  
  return z0 * stdDev + mean;
}

export default router;