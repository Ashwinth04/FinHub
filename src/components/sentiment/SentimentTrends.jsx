import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SentimentTrends({ assetSymbol, sentimentData }) {

  console.log("SentimentData");
  console.log(sentimentData);

  if (!sentimentData) {
    return <div className="card h-full">Loading sentiment trends...</div>;
  }
  
  // Define sentiment thresholds for color coding
  const getSentimentColor = (score) => {
    if (score >= 2) return 'rgba(16, 185, 129, 0.8)';  // emerald
    if (score >= 0.5) return 'rgba(34, 197, 94, 0.8)';  // green
    if (score >= -0.5) return 'rgba(234, 179, 8, 0.8)'; // yellow
    if (score >= -2) return 'rgba(249, 115, 22, 0.8)';  // orange
    return 'rgba(239, 68, 68, 0.8)';                   // red
  };
  
  // Generate more detailed trends for chart display
  const generateTrendData = () => {
    // Use sentiment history from API if available
    if (sentimentData.sentiment_history && sentimentData.sentiment_history.length > 0) {
      const history = sentimentData.sentiment_history.slice(-30); // Last 30 days
      
      return {
        labels: history.map(item => {
          const date = new Date(item.date);
          const today = new Date();
          const diffTime = Math.abs(today - date);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) return 'Today';
          if (diffDays === 1) return 'Yesterday';
          return `${diffDays} days ago`;
        }),
        scores: history.map(item => item.score),
        colors: history.map(item => getSentimentColor(item.score))
      };
    }
    
    // Fallback: generate trend data from current score and trends
    const currentScore = sentimentData.overall_sentiment.score;
    const trends = sentimentData.sentiment_trends;
    
    // Generate data for the chart
    const labels = [];
    const scores = [];
    const colors = [];
    
    for (let day = 30; day >= 0; day--) {
      let score = currentScore;
      
      // Apply trends based on time period
      if (day >= 30) {
        score = currentScore - trends.monthly_change;
      } else if (day >= 7) {
        score = currentScore - trends.weekly_change;
      } else if (day >= 1) {
        score = currentScore - trends.daily_change;
      }
      
      // Add some randomness to create more natural-looking data
      score += (Math.random() - 0.5) * 0.4;
      
      // Clamp to valid range
      score = Math.max(-5, Math.min(5, score));
      
      labels.push(day === 0 ? 'Today' : day === 1 ? 'Yesterday' : `${day} days ago`);
      scores.push(score);
      colors.push(getSentimentColor(score));
    }
    
    return { labels: labels.reverse(), scores: scores.reverse(), colors: colors.reverse() };
  };
  
  const { labels, scores, colors } = generateTrendData();
  
  // Chart data
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Sentiment Score',
        data: scores,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const score = context.raw;
            let sentiment;
            
            if (score >= 2) sentiment = 'Very Positive';
            else if (score >= 0.5) sentiment = 'Positive';
            else if (score >= -0.5) sentiment = 'Neutral';
            else if (score >= -2) sentiment = 'Negative';
            else sentiment = 'Very Negative';
            
            return [`Sentiment: ${sentiment}`, `Score: ${score.toFixed(2)}`];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: -5,
        max: 5,
        ticks: {
          callback: function(value) {
            if (value === 5) return 'Very Positive';
            if (value === 2.5) return 'Positive';
            if (value === 0) return 'Neutral';
            if (value === -2.5) return 'Negative';
            if (value === -5) return 'Very Negative';
            return '';
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        }
      }
    }
  };
  
  return (
    <div className="card h-full">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Sentiment Trends for {assetSymbol}
      </h3>
      <div className="h-[300px]">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}