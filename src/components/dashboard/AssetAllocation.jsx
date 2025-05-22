import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function AssetAllocation({ allocation }) {
  // Define a consistent color palette for asset classes
  const colorPalette = {
    stocks: 'rgba(54, 162, 235, 0.8)',
    bonds: 'rgba(75, 192, 192, 0.8)',
    crypto: 'rgba(153, 102, 255, 0.8)',
    reits: 'rgba(255, 159, 64, 0.8)',
    cash: 'rgba(201, 203, 207, 0.8)',
    commodities: 'rgba(255, 99, 132, 0.8)',
  };

  // Prepare data for the pie chart
  const data = {
    labels: Object.keys(allocation).map(key => key.charAt(0).toUpperCase() + key.slice(1)),
    datasets: [
      {
        data: Object.values(allocation),
        backgroundColor: Object.keys(allocation).map(key => colorPalette[key.toLowerCase()] || 'rgba(100, 100, 100, 0.8)'),
        borderColor: Object.keys(allocation).map(key => colorPalette[key.toLowerCase()]?.replace('0.8', '1') || 'rgba(100, 100, 100, 1)'),
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
        position: 'bottom',
        labels: {
          usePointStyle: true,
          font: {
            size: 12,
          },
          color: document.documentElement.classList.contains('dark') ? 'white' : '#333',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.formattedValue;
            return `${label}: ${value}%`;
          }
        }
      }
    },
  };

  return (
    <div className="card h-[400px]">
      <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Asset Allocation</h3>
      <div className="h-[320px]">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}