import React, { useState } from 'react';
import { FiSettings, FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import AppLayout from '../../components/layout/AppLayout';
import OptimizationForm from '../../components/optimization/OptimizationForm';
import OptimizationResults from '../../components/optimization/OptimizationResults';

export default function OptimizationPage() {
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Mock portfolio data
  const portfolio = {
    id: 1,
    name: 'Main Portfolio',
    assets: [
      { id: 1, name: 'Apple Inc.', symbol: 'AAPL', allocation: 15.3 },
      { id: 2, name: 'Microsoft Corp.', symbol: 'MSFT', allocation: 12.6 },
      { id: 3, name: 'Amazon.com Inc.', symbol: 'AMZN', allocation: 9.8 },
      { id: 4, name: 'Vanguard Total Bond ETF', symbol: 'BND', allocation: 20.5 },
      { id: 5, name: 'Bitcoin', symbol: 'BTC', allocation: 7.2 },
      { id: 6, name: 'Ethereum', symbol: 'ETH', allocation: 5.3 },
      { id: 7, name: 'Vanguard Real Estate ETF', symbol: 'VNQ', allocation: 10.4 },
      { id: 8, name: 'Cash', symbol: 'CASH', allocation: 18.9 },
    ]
  };
  
  // Settings for optimization
  const optimizationStrategies = [
    { 
      id: 'maxSharpe', 
      name: 'Maximum Sharpe Ratio', 
      description: 'Optimizes for the best risk-adjusted return',
      icon: FiTrendingUp
    },
    { 
      id: 'minVolatility', 
      name: 'Minimum Volatility', 
      description: 'Minimizes portfolio risk and volatility',
      icon: FiTrendingDown
    },
    { 
      id: 'equalRisk', 
      name: 'Equal Risk Contribution', 
      description: 'Each asset contributes equally to overall risk',
      icon: FiActivity
    }
  ];
  
  const handleOptimize = (strategy, riskTolerance) => {
    setIsOptimizing(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      // Generate mock optimization results
      const results = generateMockResults(strategy, portfolio.assets, riskTolerance);
      setOptimizationResults(results);
      setIsOptimizing(false);
    }, 1500); // Simulate API delay
  };
  
  const generateMockResults = (strategy, assets, riskTolerance) => {
    const weights = {};
    let totalWeight = 0;
    
    // Generate weights based on strategy
    assets.forEach(asset => {
      let weight;
      
      switch (strategy) {
        case 'maxSharpe':
          // Higher weight to stocks and crypto for max Sharpe
          if (asset.symbol === 'AAPL' || asset.symbol === 'MSFT' || asset.symbol === 'BTC') {
            weight = Math.random() * 0.15 + 0.15;
          } else if (asset.symbol === 'BND' || asset.symbol === 'CASH') {
            weight = Math.random() * 0.05;
          } else {
            weight = Math.random() * 0.1 + 0.05;
          }
          break;
          
        case 'minVolatility':
          // Higher weight to bonds and cash for min volatility
          if (asset.symbol === 'BND' || asset.symbol === 'CASH') {
            weight = Math.random() * 0.15 + 0.2;
          } else if (asset.symbol === 'BTC' || asset.symbol === 'ETH') {
            weight = Math.random() * 0.03;
          } else {
            weight = Math.random() * 0.08 + 0.05;
          }
          break;
          
        case 'equalRisk':
          // Balanced weights with adjustments
          if (asset.symbol === 'BTC' || asset.symbol === 'ETH') {
            weight = Math.random() * 0.05 + 0.02;
          } else {
            weight = (1 - 0.14) / (assets.length - 2) + (Math.random() * 0.04 - 0.02);
          }
          break;
          
        default:
          weight = 1 / assets.length;
      }
      
      weights[asset.id] = {
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        currentAllocation: asset.allocation,
        optimizedAllocation: weight * 100
      };
      
      totalWeight += weight;
    });
    
    // Normalize weights to ensure they sum to 1
    Object.keys(weights).forEach(key => {
      weights[key].optimizedAllocation = (weights[key].optimizedAllocation / totalWeight);
    });
    
    // Generate expected performance metrics
    let expectedReturn, expectedRisk, sharpeRatio;
    
    switch (strategy) {
      case 'maxSharpe':
        expectedReturn = 0.14 + (Math.random() * 0.04);
        expectedRisk = 0.18 + (Math.random() * 0.04);
        sharpeRatio = expectedReturn / expectedRisk;
        break;
        
      case 'minVolatility':
        expectedReturn = 0.07 + (Math.random() * 0.02);
        expectedRisk = 0.08 + (Math.random() * 0.02);
        sharpeRatio = expectedReturn / expectedRisk;
        break;
        
      case 'equalRisk':
        expectedReturn = 0.10 + (Math.random() * 0.03);
        expectedRisk = 0.12 + (Math.random() * 0.03);
        sharpeRatio = expectedReturn / expectedRisk;
        break;
        
      default:
        expectedReturn = 0.10;
        expectedRisk = 0.15;
        sharpeRatio = expectedReturn / expectedRisk;
    }
    
    return {
      strategy,
      riskTolerance,
      optimizedAt: new Date().toISOString(),
      weights,
      metrics: {
        expectedReturn: (expectedReturn * 100).toFixed(2),
        expectedRisk: (expectedRisk * 100).toFixed(2),
        sharpeRatio: sharpeRatio.toFixed(2)
      }
    };
  };
  
  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Portfolio Optimization</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Optimize your portfolio using machine learning algorithms
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center mb-4">
                <FiSettings className="h-5 w-5 text-primary-500 mr-2" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Optimization Settings</h3>
              </div>
              
              <OptimizationForm 
                strategies={optimizationStrategies}
                onOptimize={handleOptimize}
                isOptimizing={isOptimizing}
              />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {isOptimizing ? (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">Optimizing Portfolio...</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Running machine learning algorithms</p>
                </div>
              </div>
            ) : optimizationResults ? (
              <OptimizationResults results={optimizationResults} />
            ) : (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <FiTrendingUp className="h-8 w-8 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Ready to Optimize</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Configure your optimization settings and click "Optimize Portfolio" to see how machine learning can improve your asset allocation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}