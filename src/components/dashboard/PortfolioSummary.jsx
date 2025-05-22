import React from 'react';
import { FiDollarSign, FiTrendingUp, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import MetricCard from '../common/MetricCard';

export default function PortfolioSummary({ portfolioValue, gainLoss, gainLossPercent, allocation }) {
  // Determine if the gain/loss is positive or negative
  const trendDirection = gainLoss >= 0 ? 'up' : 'down';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard 
        title="Portfolio Value" 
        value={`$${portfolioValue.toLocaleString()}`} 
        icon={FiDollarSign}
      />
      
      <MetricCard 
        title="Gain/Loss" 
        value={`$${Math.abs(gainLoss).toLocaleString()}`} 
        trend="vs. initial investment"
        trendValue={`${gainLossPercent}%`}
        trendDirection={trendDirection}
        icon={FiTrendingUp}
      />
      
      <MetricCard 
        title="Asset Classes" 
        value={Object.keys(allocation).length} 
        trend="diversification score"
        trendValue="7/10"
        icon={FiPieChart}
      />
      
      <MetricCard 
        title="Volatility" 
        value="12.4%" 
        trend="30-day average"
        trendValue="1.2%"
        trendDirection="down"
        icon={FiBarChart2}
      />
    </div>
  );
}