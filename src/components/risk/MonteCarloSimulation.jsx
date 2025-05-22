import React, { useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function MonteCarloSimulation({ data }) {
  const [numSimulations, setNumSimulations] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);
  const isDark = document.documentElement.classList.contains('dark');
  
  // Dummy function to simulate backend call
  const runSimulation = async (simCount) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate new simulation data
    const newPaths = generateSimulationPaths(data.initialValue, 120, simCount);
    
    // Update chart data
    if (chartRef.current) {
      chartRef.current.data.datasets = newPaths.map((path, index) => ({
        label: `Simulation ${index + 1}`,
        data: path.path,
        borderColor: getPathColor(index),
        backgroundColor: getPathColor(index, true),
        fill: index === 0,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
      }));
      chartRef.current.update();
    }
    
    setIsLoading(false);
  };
  
  // Generate labels for x-axis (months)
  const generateMonthLabels = (count) => {
    const labels = [];
    const startDate = new Date();
    
    for (let i = 0; i <= count; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    
    return labels;
  };
  
  // Generate colors for simulation paths
  const getPathColor = (index, isBackground = false) => {
    const colors = [
      { stroke: 'rgba(54, 162, 235, 1)', fill: 'rgba(54, 162, 235, 0.1)' },
      { stroke: 'rgba(75, 192, 192, 1)', fill: 'rgba(75, 192, 192, 0.1)' },
      { stroke: 'rgba(153, 102, 255, 1)', fill: 'rgba(153, 102, 255, 0.1)' },
      { stroke: 'rgba(255, 159, 64, 1)', fill: 'rgba(255, 159, 64, 0.1)' },
      { stroke: 'rgba(255, 99, 132, 1)', fill: 'rgba(255, 99, 132, 0.1)' },
    ];
    
    return isBackground ? colors[index % colors.length].fill : colors[index % colors.length].stroke;
  };
  
  // Prepare chart data
  const chartData = {
    labels: generateMonthLabels(data.simulationPaths[0].path.length - 1),
    datasets: data.simulationPaths.map((simulation, index) => ({
      label: `Simulation ${index + 1}`,
      data: simulation.path,
      borderColor: getPathColor(index),
      backgroundColor: getPathColor(index, true),
      fill: index === 0,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
    })),
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
          color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        },
      },
    },
  };
  
  // Update chart when theme changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [isDark]);
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Monte Carlo Simulation</h3>
      
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label htmlFor="simulations" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Number of Simulations: {numSimulations}
            </label>
            <input
              type="range"
              id="simulations"
              min="100"
              max="10000"
              step="100"
              value={numSimulations}
              onChange={(e) => setNumSimulations(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
            />
            <div className="mt-1 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>100</span>
              <span>5000</span>
              <span>10000</span>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => runSimulation(numSimulations)}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Simulation...
                </>
              ) : (
                'Run Simulation'
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          This simulation projects possible future portfolio values based on historical returns and volatility.
          The chart shows various possible outcomes over the next 10 years.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Initial Value</div>
          <div className="text-lg font-bold text-neutral-900 dark:text-white">{formatCurrency(data.initialValue)}</div>
        </div>
        
        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Median Outcome</div>
          <div className="text-lg font-bold text-primary-500">{formatCurrency(data.statistics.median)}</div>
        </div>
        
        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">95% Confidence Range</div>
          <div className="text-lg font-bold text-neutral-900 dark:text-white">
            {formatCurrency(data.statistics.confidenceInterval.lower)} - {formatCurrency(data.statistics.confidenceInterval.upper)}
          </div>
        </div>
      </div>
      
      <div className="h-[400px] mb-4">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Simulation Results</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-700 pb-1">
              <span className="text-neutral-600 dark:text-neutral-400">Mean</span>
              <span className="font-medium text-neutral-900 dark:text-white">{formatCurrency(data.statistics.mean)}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-700 pb-1">
              <span className="text-neutral-600 dark:text-neutral-400">Minimum</span>
              <span className="font-medium text-error-500">{formatCurrency(data.statistics.min)}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-700 pb-1">
              <span className="text-neutral-600 dark:text-neutral-400">Maximum</span>
              <span className="font-medium text-success-500">{formatCurrency(data.statistics.max)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Key Insights</h4>
          <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
            <p>• There's a 50% chance your portfolio will exceed {formatCurrency(data.statistics.median)} in 10 years.</p>
            <p>• With 95% confidence, your portfolio value will be between {formatCurrency(data.statistics.confidenceInterval.lower)} and {formatCurrency(data.statistics.confidenceInterval.upper)}.</p>
            <p>• The simulation suggests an average annual return of {((Math.pow(data.statistics.mean / data.initialValue, 1/10) - 1) * 100).toFixed(2)}%.</p>
          </div>
        </div>
      </div>
    </div>
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