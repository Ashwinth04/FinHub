import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Portfolio from '../models/Portfolio.js';
import RiskMetrics from '../models/RiskMetrics.js';
import Asset from '../models/Asset.js';

const router = express.Router();

// Middleware to protect all routes
router.use(authenticate);

// Calculate risk metrics for a portfolio
router.get('/:portfolioId/metrics', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Check if we have cached risk metrics
    let riskMetrics = await RiskMetrics.findByPortfolioId(portfolio.id);
    
    if (!riskMetrics) {
      // Calculate new risk metrics
      const assets = await portfolio.getAssets();
      const calculatedMetrics = await calculateRiskMetrics(assets, portfolio);
      
      riskMetrics = await RiskMetrics.createOrUpdate(portfolio.id, calculatedMetrics);
    }

    // Calculate correlation matrix
    const correlationMatrix = await calculateCorrelationMatrix(portfolio.id);
    
    const result = {
      ...riskMetrics.toJSON(),
      correlationMatrix
    };

    res.json(result);
  } catch (err) {
    console.error('Risk metrics calculation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Run Monte Carlo simulation for a portfolio
router.post('/:portfolioId/monte-carlo', async (req, res) => {
  try {
    const { simulations, years, confidenceLevel } = req.body;
    
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const currentValue = await portfolio.getCurrentValue();
    const results = runMonteCarloSimulation(
      currentValue,
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

// Helper function to calculate risk metrics
async function calculateRiskMetrics(assets, portfolio) {
  // Generate mock historical data for calculation
  const historicalData = generateMockHistoricalData(assets);
  
  const volatility = calculateVolatility(historicalData);
  const sharpeRatio = calculateSharpeRatio(historicalData);
  const maxDrawdown = calculateMaxDrawdown(historicalData);
  const currentValue = await portfolio.getCurrentValue();
  const valueAtRisk = calculateValueAtRisk(historicalData, currentValue);
  
  return {
    volatility_daily: volatility.daily,
    volatility_annualized: volatility.annualized,
    sharpe_ratio_daily: sharpeRatio.daily,
    sharpe_ratio_annualized: sharpeRatio.annualized,
    max_drawdown: maxDrawdown.maxDrawdown,
    max_drawdown_start_date: maxDrawdown.startDate,
    max_drawdown_end_date: maxDrawdown.endDate,
    max_drawdown_duration_days: maxDrawdown.durationDays,
    var_95: valueAtRisk.var95,
    var_99: valueAtRisk.var99,
    var_95_percent: valueAtRisk.var95Percent,
    var_99_percent: valueAtRisk.var99Percent,
    beta: 1.15, // Mock value
    alpha: 0.28  // Mock value
  };
}

// Helper function to calculate correlation matrix
async function calculateCorrelationMatrix(portfolio_id) {
  const assets = await Asset.findByPortfolioId(portfolio_id);
  
  // Generate mock correlation data
  const correlationData = [];
  for (let i = 0; i < assets.length; i++) {
    const row = [];
    for (let j = 0; j < assets.length; j++) {
      if (i === j) {
        row.push(1.0);
      } else {
        // Generate mock correlation based on asset types
        const correlation = generateMockCorrelation(assets[i], assets[j]);
        row.push(correlation);
      }
    }
    correlationData.push(row);
  }
  
  return {
    assets: assets.map(a => ({ id: a.id, symbol: a.symbol, name: a.name })),
    data: correlationData
  };
}

// Mock functions (simplified versions of the original complex calculations)
function generateMockHistoricalData(assets) {
  const data = { portfolioValues: [] };
  
  for (let i = 0; i < 365; i++) {
    let portfolioValue = 0;
    assets.forEach(asset => {
      const volatility = getAssetVolatility(asset.type);
      const change = (Math.random() * 2 - 1) * volatility;
      const price = asset.purchase_price * (1 + change);
      portfolioValue += asset.quantity * price;
    });
    data.portfolioValues.push(portfolioValue);
  }
  
  return data;
}

function getAssetVolatility(type) {
  switch (type) {
    case 'stock': return 0.015;
    case 'bond': return 0.005;
    case 'crypto': return 0.04;
    case 'reit': return 0.02;
    default: return 0.01;
  }
}

function calculateVolatility(historicalData) {
  const returns = calculateDailyReturns(historicalData.portfolioValues);
  const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    daily: stdDev,
    annualized: stdDev * Math.sqrt(252)
  };
}

function calculateSharpeRatio(historicalData) {
  const returns = calculateDailyReturns(historicalData.portfolioValues);
  const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sum, val) => sum + Math.pow(val - avgReturn, 2), 0) / returns.length);
  const riskFreeRate = 0.035 / 252;
  
  const dailySharpe = (avgReturn - riskFreeRate) / stdDev;
  
  return {
    daily: dailySharpe,
    annualized: dailySharpe * Math.sqrt(252)
  };
}

function calculateMaxDrawdown(historicalData) {
  const values = historicalData.portfolioValues;
  let maxValue = values[0];
  let maxDrawdown = 0;
  let drawdownStart = 0;
  let drawdownEnd = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > maxValue) {
      maxValue = values[i];
      drawdownStart = i;
    }
    
    const drawdown = (maxValue - values[i]) / maxValue;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      drawdownEnd = i;
    }
  }
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (365 - drawdownStart));
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - (365 - drawdownEnd));
  
  return {
    maxDrawdown,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    durationDays: drawdownEnd - drawdownStart
  };
}

function calculateValueAtRisk(historicalData, portfolioValue) {
  const returns = calculateDailyReturns(historicalData.portfolioValues);
  returns.sort((a, b) => a - b);
  
  const var95Index = Math.floor(returns.length * 0.05);
  const var99Index = Math.floor(returns.length * 0.01);
  
  return {
    var95: -returns[var95Index] * portfolioValue,
    var99: -returns[var99Index] * portfolioValue,
    var95Percent: -returns[var95Index] * 100,
    var99Percent: -returns[var99Index] * 100
  };
}

function calculateDailyReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  return returns;
}

function generateMockCorrelation(asset1, asset2) {
  // Same asset type = higher correlation
  if (asset1.type === asset2.type) {
    return 0.6 + Math.random() * 0.3;
  }
  // Different types = lower correlation
  return Math.random() * 0.4 - 0.2;
}

function runMonteCarloSimulation(initialValue, simulations, years, confidenceLevel) {
  const finalValues = [];
  const timeSteps = years * 12;
  const monthlyReturn = 0.08 / 12;
  const monthlyVolatility = 0.16 / Math.sqrt(12);
  
  // Generate 5 sample paths for visualization
  const samplePaths = [];
  for (let i = 0; i < 5; i++) {
    const path = [initialValue];
    let currentValue = initialValue;
    
    for (let t = 0; t < timeSteps; t++) {
      const randomReturn = monthlyReturn + ((Math.random() * 2) - 1) * monthlyVolatility;
      currentValue = currentValue * (1 + randomReturn);
      path.push(currentValue);
    }
    
    samplePaths.push({ id: i, path });
    finalValues.push(currentValue);
  }
  
  // Generate additional final values for statistics
  for (let i = 5; i < simulations; i++) {
    let value = initialValue;
    for (let t = 0; t < timeSteps; t++) {
      const randomReturn = monthlyReturn + ((Math.random() * 2) - 1) * monthlyVolatility;
      value = value * (1 + randomReturn);
    }
    finalValues.push(value);
  }
  
  finalValues.sort((a, b) => a - b);
  
  const lowerIndex = Math.floor(simulations * (1 - confidenceLevel) / 2);
  const upperIndex = Math.floor(simulations * (1 + confidenceLevel) / 2);
  
  return {
    initialValue,
    simulationPaths: samplePaths,
    statistics: {
      median: finalValues[Math.floor(simulations / 2)],
      mean: finalValues.reduce((sum, val) => sum + val, 0) / simulations,
      min: finalValues[0],
      max: finalValues[simulations - 1],
      confidenceInterval: {
        level: confidenceLevel,
        lower: finalValues[lowerIndex],
        upper: finalValues[upperIndex]
      }
    }
  };
}

export default router;