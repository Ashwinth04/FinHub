import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { portfolioAPI } from '../../utils/api';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function OptimizationResults({ results, id }) {
  const { weights, metrics, strategy } = results;
  
  // Prepare data for before/after chart
  const currentData = {
    labels: Object.values(weights).map(asset => asset.symbol),
    datasets: [
      {
        data: Object.values(weights).map(asset => asset.currentAllocation),
        backgroundColor: generateColors(Object.keys(weights).length, false),
        borderWidth: 1,
      },
    ],
  };
  
  const optimizedData = {
    labels: Object.values(weights).map(asset => asset.symbol),
    datasets: [
      {
        data: Object.values(weights).map(asset => asset.optimizedAllocation),
        backgroundColor: generateColors(Object.keys(weights).length, true),
        borderWidth: 1,
      },
    ],
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = parseFloat(context.parsed).toFixed(2);
            return `${label}: ${value}%`;
          }
        }
      }
    },
  };
  
  // Find the largest changes
  const changes = Object.values(weights).map(asset => ({
    ...asset,
    change: asset.optimizedAllocation - asset.currentAllocation
  }));
  
  const increasedAssets = [...changes]
    .sort((a, b) => b.change - a.change)
    .filter(asset => asset.change > 0)
    .slice(0, 3);
    
  const decreasedAssets = [...changes]
    .sort((a, b) => a.change - b.change)
    .filter(asset => asset.change < 0)
    .slice(0, 3);
    
  const getStrategyName = (strategyId) => {
    switch (strategyId) {
      case 'maxSharpe': return 'Maximum Sharpe Ratio';
      case 'minVolatility': return 'Minimum Volatility';
      case 'equalRisk': return 'Equal Risk Contribution';
      default: return strategyId;
    }
  };

  const applyOptimization = async (weights) => {
    try {

      console.log("Applying optimization with weights:", weights);
      console.log("Portfolio ID:", id);
      console.log("type: ",typeof id, typeof weights);

      const response = await portfolioAPI.updateWeights(id, weights);

      console.log("Response from server 1:", response);

      if (response.status !== 200) {
        console.log("NAANDHAN")
        throw new Error(`Failed to apply optimization: ${response.statusText}`);
      }

      console.log("Response from server 2:", response);
      const updatedPortfolio = response.data;
      console.log("Optimization applied successfully:", updatedPortfolio);

      alert("Optimization applied to portfolio!");
    } catch (error) {
      console.error("Error applying optimization:", error);
      alert("Failed to apply optimization. Please try again.");
    }
  };

  
  return (
    <div className="animate-fade-in">
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Optimization Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Expected Annual Return</div>
            <div className="text-2xl font-bold text-success-500">{metrics.expectedReturn}%</div>
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Expected Risk</div>
            <div className="text-2xl font-bold text-error-500">{metrics.expectedRisk}%</div>
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Sharpe Ratio</div>
            <div className="text-2xl font-bold text-primary-500">{metrics.sharpeRatio}</div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Strategy</div>
          <div className="font-medium text-neutral-900 dark:text-white">{getStrategyName(strategy)}</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">Optimized on {new Date(results.optimizedAt).toLocaleString()}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card h-[300px]">
          <h4 className="text-base font-medium text-neutral-900 dark:text-white mb-4">Current Allocation</h4>
          <div className="h-[250px]">
            <Pie data={currentData} options={options} />
          </div>
        </div>
        
        <div className="card h-[300px]">
          <h4 className="text-base font-medium text-neutral-900 dark:text-white mb-4">Optimized Allocation</h4>
          <div className="h-[250px]">
            <Pie data={optimizedData} options={options} />
          </div>
        </div>
      </div>
      
      <div className="card mb-6">
        <h4 className="text-base font-medium text-neutral-900 dark:text-white mb-4">Suggested Changes</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-success-500 mb-2">Increase Allocation</h5>
            <ul className="space-y-2">
              {increasedAssets.map(asset => (
                <li key={asset.id} className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700 last:border-0">
                  <div className="flex items-center">
                    <span className="inline-block w-12 text-xs text-neutral-500 dark:text-neutral-400">{asset.symbol}</span>
                    <span className="ml-2 text-neutral-900 dark:text-white">{asset.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">{asset.currentAllocation.toFixed(2)}%</span>
                    <span className="mx-2 text-neutral-400">→</span>
                    <span className="text-sm font-medium text-success-500">{asset.optimizedAllocation.toFixed(2)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-error-500 mb-2">Decrease Allocation</h5>
            <ul className="space-y-2">
              {decreasedAssets.map(asset => (
                <li key={asset.id} className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700 last:border-0">
                  <div className="flex items-center">
                    <span className="inline-block w-12 text-xs text-neutral-500 dark:text-neutral-400">{asset.symbol}</span>
                    <span className="ml-2 text-neutral-900 dark:text-white">{asset.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">{asset.currentAllocation.toFixed(2)}%</span>
                    <span className="mx-2 text-neutral-400">→</span>
                    <span className="text-sm font-medium text-error-500">{asset.optimizedAllocation.toFixed(2)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button onClick = {() => {applyOptimization(results.weights)}} className="btn btn-primary">Apply Optimization</button>
      </div>
    </div>
  );
}

// Helper to generate chart colors
function generateColors(count, isOptimized) {
  const baseColors = [
    'rgba(54, 162, 235, OPACITY)',   // blue
    'rgba(75, 192, 192, OPACITY)',   // teal
    'rgba(153, 102, 255, OPACITY)',  // purple
    'rgba(255, 159, 64, OPACITY)',   // orange
    'rgba(255, 99, 132, OPACITY)',   // red
    'rgba(255, 205, 86, OPACITY)',   // yellow
    'rgba(201, 203, 207, OPACITY)',  // grey
    'rgba(34, 197, 94, OPACITY)',    // green
  ];
  
  // For optimized chart, make colors more vibrant
  const opacity = isOptimized ? '0.8' : '0.6';
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    const colorIndex = i % baseColors.length;
    colors.push(baseColors[colorIndex].replace('OPACITY', opacity));
  }
  
  return colors;
}