import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import PortfolioSummary from '../../components/dashboard/PortfolioSummary';
import AssetAllocation from '../../components/dashboard/AssetAllocation';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import TopHoldings from '../../components/dashboard/TopHoldings';

export default function DashboardPage() {
  // Mock data for portfolio summary
  const portfolioSummary = {
    portfolioValue: 125750.42,
    gainLoss: 12500.42,
    gainLossPercent: 11.04,
    allocation: {
      Stocks: 55,
      Bonds: 20,
      Crypto: 15,
      REITs: 10,
    }
  };

  // Mock data for performance chart
  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    portfolio: [100000, 102000, 105000, 103000, 108000, 110000, 112000, 118000, 116000, 120000, 123000, 125750.42]
  };
  
  // Mock benchmark data
  const benchmark = {
    name: 'S&P 500',
    data: [100000, 101000, 103000, 102000, 104000, 105000, 108000, 110000, 109000, 112000, 115000, 118000]
  };

  // Mock data for top holdings
  const topHoldings = [
    { id: 1, name: 'Apple Inc.', symbol: 'AAPL', value: 15250.75, allocation: 12.13, return: 24.5 },
    { id: 2, name: 'Microsoft Corp.', symbol: 'MSFT', value: 12480.30, allocation: 9.93, return: 18.2 },
    { id: 3, name: 'Amazon.com Inc.', symbol: 'AMZN', value: 9870.20, allocation: 7.85, return: -5.7 },
    { id: 4, name: 'iShares 20+ Year Treasury', symbol: 'TLT', value: 8750.00, allocation: 6.96, return: -2.3 },
    { id: 5, name: 'Bitcoin', symbol: 'BTC', value: 7890.15, allocation: 6.27, return: 32.1 },
    { id: 6, name: 'Vanguard Real Estate ETF', symbol: 'VNQ', value: 5240.80, allocation: 4.17, return: 7.8 },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Overview of your investment portfolio as of {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="mb-8">
          <PortfolioSummary 
            portfolioValue={portfolioSummary.portfolioValue}
            gainLoss={portfolioSummary.gainLoss}
            gainLossPercent={portfolioSummary.gainLossPercent}
            allocation={portfolioSummary.allocation}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PerformanceChart 
            performanceData={performanceData}
            benchmark={benchmark}
          />
          <AssetAllocation 
            allocation={portfolioSummary.allocation} 
          />
        </div>

        <div className="mb-6">
          <TopHoldings holdings={topHoldings} />
        </div>
      </div>
    </AppLayout>
  );
}