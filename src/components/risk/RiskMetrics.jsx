import React from 'react';
import { FiBarChart2, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiActivity, FiArrowUp } from 'react-icons/fi';

export default function RiskMetrics({ metrics }) {
  const formatPercent = (value) => {
    return (value * 100).toFixed(2) + '%';
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Risk Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="flex items-center text-neutral-800 dark:text-neutral-200 font-medium mb-4">
            <FiBarChart2 className="mr-2 text-primary-500" />
            Volatility
          </h4>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Daily</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{formatPercent(metrics.volatility.daily)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Annualized</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{formatPercent(metrics.volatility.annualized)}</span>
            </div>
            
            <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
              <p>Volatility measures the degree of variation in returns over time.</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="flex items-center text-neutral-800 dark:text-neutral-200 font-medium mb-4">
            <FiTrendingDown className="mr-2 text-error-500" />
            Maximum Drawdown
          </h4>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Drawdown</span>
              <span className="text-sm font-medium text-error-500">{formatPercent(metrics.maxDrawdown.maxDrawdown)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Period</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {formatDate(metrics.maxDrawdown.startDate)} - {formatDate(metrics.maxDrawdown.endDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Duration</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{metrics.maxDrawdown.durationDays} days</span>
            </div>
            
            <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
              <p>Maximum drawdown is the largest peak-to-trough decline in portfolio value.</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="flex items-center text-neutral-800 dark:text-neutral-200 font-medium mb-4">
            <FiTrendingUp className="mr-2 text-success-500" />
            Sharpe Ratio
          </h4>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Daily</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{metrics.sharpeRatio.daily.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Annualized</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{metrics.sharpeRatio.annualized.toFixed(3)}</span>
            </div>
            
            <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
              <p>Sharpe ratio measures risk-adjusted performance, with higher values indicating better risk-adjusted returns.</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="flex items-center text-neutral-800 dark:text-neutral-200 font-medium mb-4">
            <FiAlertTriangle className="mr-2 text-warning-500" />
            Value at Risk (VaR)
          </h4>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Portfolio Value</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{formatCurrency(metrics.valueAtRisk.portfolioValue)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">VaR (95%)</span>
              <span className="text-sm font-medium text-error-500">
                {formatCurrency(metrics.valueAtRisk.var95)} ({metrics.valueAtRisk.var95Percent.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">VaR (99%)</span>
              <span className="text-sm font-medium text-error-500">
                {formatCurrency(metrics.valueAtRisk.var99)} ({metrics.valueAtRisk.var99Percent.toFixed(2)}%)
              </span>
            </div>
            
            <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
              <p>Value at Risk estimates the maximum expected loss over a given time period at a specified confidence level.</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="flex items-center text-neutral-800 dark:text-neutral-200 font-medium mb-4">
            <FiActivity className="mr-2 text-primary-500" />
            Beta
          </h4>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">vs. S&P 500</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{metrics.beta.toFixed(2)}</span>
            </div>
            
            <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
              <p>Beta measures the volatility of your portfolio relative to the market. A beta greater than 1 indicates higher volatility than the market.</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="flex items-center text-neutral-800 dark:text-neutral-200 font-medium mb-4">
            <FiArrowUp className="mr-2 text-success-500" />
            Alpha
          </h4>
          
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">vs. S&P 500</span>
              <span className="text-sm font-medium text-success-500">{formatPercent(metrics.alpha)}</span>
            </div>
            
            <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
              <p>Alpha represents the excess return of your portfolio compared to the benchmark index, after adjusting for risk.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}