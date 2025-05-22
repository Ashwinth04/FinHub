import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SentimentCorrelation({ correlationData }) {
  const { symbol, dates, sentiment, prices, correlation } = correlationData;
  
  // Format dates for display
  const formattedDates = dates.map(date => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  
  // Prepare data for the chart
  const chartData = {
    labels: formattedDates,
    datasets: [
      {
        label: 'Sentiment',
        data: sentiment,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        yAxisID: 'y',
        tension: 0.4,
        pointRadius: 2,
      },
      {
        label: 'Price',
        data: prices,
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
          <div className={`text-lg font-semibold ${getCorrelationColor(correlation)}`}>
            {correlation.toFixed(2)}
          </div>
        </div>
        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-medium">{getCorrelationStrength(correlation)}</span> {correlation >= 0 ? 'positive' : 'negative'} correlation between sentiment and price
        </div>
      </div>
      
      <div className="h-[250px]">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        {generateCorrelationInsight(symbol, correlation)}
      </div>
    </div>
  );
}

// Helper function to generate correlation insights
function generateCorrelationInsight(symbol, correlation) {
  if (correlation >= 0.7) {
    return `Strong positive correlation indicates that positive sentiment is closely linked to price increases for ${symbol}. Social sentiment appears to be a strong leading indicator.`;
  } else if (correlation >= 0.5) {
    return `Moderate positive correlation suggests that positive sentiment often coincides with price increases for ${symbol}, though the relationship isn't perfect.`;
  } else if (correlation >= 0.3) {
    return `Weak positive correlation indicates some relationship between sentiment and price for ${symbol}, but many other factors likely influence price movements.`;
  } else if (correlation >= 0) {
    return `Very weak positive correlation suggests that sentiment has minimal impact on ${symbol} price movements in the observed timeframe.`;
  } else if (correlation >= -0.3) {
    return `Very weak negative correlation suggests that sentiment and price for ${symbol} move somewhat independently of each other.`;
  } else if (correlation >= -0.5) {
    return `Weak negative correlation indicates that ${symbol} sometimes moves contrary to sentiment, which could suggest contrarian trading opportunities.`;
  } else if (correlation >= -0.7) {
    return `Moderate negative correlation suggests that ${symbol} often moves opposite to sentiment trends, which could be useful for contrarian strategies.`;
  } else {
    return `Strong negative correlation indicates that ${symbol} consistently moves opposite to sentiment, suggesting it may be a strong contrarian indicator.`;
  }
}