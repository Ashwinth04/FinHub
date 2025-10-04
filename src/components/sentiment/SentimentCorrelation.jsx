import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SentimentCorrelation({ correlationData }) {
  if (!correlationData) {
    return (
      <div className="card h-full">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Sentiment-Price Correlation
        </h3>
        <div className="flex items-center justify-center h-[250px]">
          <p className="text-neutral-500 dark:text-neutral-400">No correlation data available</p>
        </div>
      </div>
    );
  }
  
  const { token: symbol, sentiment_price_correlation } = correlationData;
  
  if (!sentiment_price_correlation) {
    return (
      <div className="card h-full">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Sentiment-Price Correlation for {symbol}
        </h3>
        <div className="flex items-center justify-center h-[250px]">
          <p className="text-neutral-500 dark:text-neutral-400">No correlation data available for {symbol}</p>
        </div>
      </div>
    );
  }
  
  const { correlation_coefficient, series } = sentiment_price_correlation;
  
  // Format dates for display
  const formattedDates = series.sentiment.map(item => {
    const date = item.date;
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  
  // Prepare data for the chart
  const chartData = {
    labels: formattedDates,
    datasets: [
      {
        label: 'Sentiment',
        data: series.sentiment.map(item => item.score),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        yAxisID: 'y',
        tension: 0.4,
        pointRadius: 2,
      },
      {
        label: 'Price',
        data: series.price.map(item => item.price),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.datasetIndex === 0) {
              label += context.parsed.y.toFixed(2);
            } else {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Sentiment Score',
          color: 'rgba(54, 162, 235, 1)',
        },
        min: -5,
        max: 5,
        ticks: {
          color: 'rgba(54, 162, 235, 1)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Price',
          color: 'rgba(255, 99, 132, 1)',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgba(255, 99, 132, 1)',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        }
      }
    }
  };
  
  // Format correlation strength label
  const getCorrelationStrength = (corr) => {
    const absCorr = Math.abs(corr);
    if (absCorr >= 0.7) return 'Strong';
    if (absCorr >= 0.5) return 'Moderate';
    if (absCorr >= 0.3) return 'Weak';
    return 'Very weak';
  };
  
  // Get color for correlation
  const getCorrelationColor = (corr) => {
    const absCorr = Math.abs(corr);
    if (absCorr >= 0.7) return corr > 0 ? 'text-emerald-500' : 'text-red-500';
    if (absCorr >= 0.5) return corr > 0 ? 'text-green-500' : 'text-orange-500';
    if (absCorr >= 0.3) return corr > 0 ? 'text-blue-500' : 'text-yellow-500';
    return 'text-neutral-500';
  };
  
  return (
    <div className="card h-full">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Sentiment-Price Correlation for {symbol}
      </h3>
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Correlation Coefficient</div>
          <div className={`text-lg font-semibold ${getCorrelationColor(correlation_coefficient)}`}>
            {correlation_coefficient.toFixed(2)}
          </div>
        </div>
        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-medium">{getCorrelationStrength(correlation_coefficient)}</span> {correlation_coefficient >= 0 ? 'positive' : 'negative'} correlation between sentiment and price
        </div>
      </div>
      
      <div className="h-[250px]">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        {sentiment_price_correlation.interpretation}
      </div>
    </div>
  );
}
