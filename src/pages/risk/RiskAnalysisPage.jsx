import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import RiskMetrics from '../../components/risk/RiskMetrics';
import CorrelationMatrix from '../../components/risk/CorrelationMatrix';
import MonteCarloSimulation from '../../components/risk/MonteCarloSimulation';

export default function RiskAnalysisPage() {
  // Mock risk metric data
  const riskMetrics = {
    volatility: {
      daily: 0.012,
      annualized: 0.185
    },
    sharpeRatio: {
      daily: 0.055,
      annualized: 0.874
    },
    maxDrawdown: {
      maxDrawdown: 0.258,
      startDate: '2022-01-15',
      endDate: '2022-03-12',
      durationDays: 56
    },
    valueAtRisk: {
      portfolioValue: 125750.42,
      var95: 8402.55,
      var99: 12387.34,
      var95Percent: 6.68,
      var99Percent: 9.85
    },
    beta: 1.15,
    alpha: 0.28
  };
  
  // Mock correlation data
  const correlationMatrix = {
    assets: [
      { id: 1, symbol: 'AAPL', name: 'Apple Inc.' },
      { id: 2, symbol: 'MSFT', name: 'Microsoft Corp.' },
      { id: 3, symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { id: 4, symbol: 'BND', name: 'Vanguard Total Bond ETF' },
      { id: 5, symbol: 'BTC', name: 'Bitcoin' },
      { id: 6, symbol: 'ETH', name: 'Ethereum' },
      { id: 7, symbol: 'VNQ', name: 'Vanguard Real Estate ETF' },
    ],
    data: [
      [1.00, 0.82, 0.71, 0.23, 0.35, 0.38, 0.45],
      [0.82, 1.00, 0.76, 0.19, 0.31, 0.33, 0.41],
      [0.71, 0.76, 1.00, 0.16, 0.29, 0.32, 0.38],
      [0.23, 0.19, 0.16, 1.00, 0.06, 0.04, 0.56],
      [0.35, 0.31, 0.29, 0.06, 1.00, 0.86, 0.21],
      [0.38, 0.33, 0.32, 0.04, 0.86, 1.00, 0.18],
      [0.45, 0.41, 0.38, 0.56, 0.21, 0.18, 1.00],
    ]
  };
  
  // Mock Monte Carlo simulation data
  const monteCarloData = {
    initialValue: 125750.42,
    simulationPaths: generateSimulationPaths(125750.42, 120, 1000),
    statistics: {
      median: 196825.35,
      mean: 207492.81,
      min: 89256.12,
      max: 376541.23,
      confidenceInterval: {
        level: 0.95,
        lower: 112375.45,
        upper: 324687.92
      }
    }
  };
  
  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Risk Analysis</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Analyze and understand your portfolio risk profile
          </p>
        </div>
        
        <div className="mb-6">
          <RiskMetrics metrics={riskMetrics} />
        </div>
        
        <div className="mb-6">
          <MonteCarloSimulation data={monteCarloData} />
        </div>
        
        <div className="mb-6">
          <CorrelationMatrix data={correlationMatrix} />
        </div>
      </div>
    </AppLayout>
  );
}

// Helper function to generate Monte Carlo simulation paths
function generateSimulationPaths(initialValue, periods, pathCount) {
  const selectedPaths = [0, 1, 2, 3, 4]; // Indices of paths to return for visualization
  const paths = [];
  
  // Parameters for the simulation
  const annualReturn = 0.08;
  const annualVolatility = 0.16;
  const monthlyReturn = annualReturn / 12;
  const monthlyVolatility = annualVolatility / Math.sqrt(12);
  
  for (let i = 0; i < selectedPaths.length; i++) {
    const path = [initialValue];
    let currentValue = initialValue;
    
    for (let t = 1; t <= periods; t++) {
      // Generate random return from normal distribution (simplified)
      const randomComponent = ((Math.random() * 2) - 1) * monthlyVolatility * 2;
      const monthReturn = monthlyReturn + randomComponent;
      
      // Update value
      currentValue = currentValue * (1 + monthReturn);
      path.push(currentValue);
    }
    
    paths.push({
      id: i,
      path
    });
  }
  
  return paths;
}