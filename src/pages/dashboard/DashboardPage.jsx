import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import PortfolioSummary from '../../components/dashboard/PortfolioSummary';
import AssetAllocation from '../../components/dashboard/AssetAllocation';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import TopHoldings from '../../components/dashboard/TopHoldings';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CreatePortfolioModal from '../../components/portfolio/CreatePortfolioModal';
import { usePortfolio } from '../../hooks/usePortfolio';

export default function DashboardPage() {
  const { currentPortfolio, loading, error, createPortfolio, fetchPortfolioDetails } = usePortfolio();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Refresh portfolio data when component mounts
  useEffect(() => {
    if (currentPortfolio?.id) {
      fetchPortfolioDetails(currentPortfolio.id);
    }
  }, []);

  const handleCreatePortfolio = async (portfolioData) => {
    await createPortfolio(portfolioData);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-error-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!currentPortfolio) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              No Portfolio Found
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Create your first portfolio to get started
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Portfolio
            </button>
          </div>
        </div>
        
        <CreatePortfolioModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePortfolio}
        />
      </AppLayout>
    );
  }

  // Calculate portfolio metrics from real data
  const portfolioValue = currentPortfolio.assets?.reduce((total, asset) => {
    return total + (asset.quantity * asset.purchase_price); // Using purchase_price as current for now
  }, 0) || 0;

  const costBasis = currentPortfolio.assets?.reduce((total, asset) => {
    return total + (asset.quantity * asset.purchase_price);
  }, 0) || 0;

  const gainLoss = portfolioValue - costBasis; // Will be 0 for now since current = purchase
  const gainLossPercent = costBasis > 0 ? ((gainLoss / costBasis) * 100).toFixed(2) : 0;

  // Calculate allocation from real data
  const allocation = {};
  currentPortfolio.assets?.forEach(asset => {
    const assetValue = asset.quantity * asset.purchase_price;
    const assetType = asset.type.charAt(0).toUpperCase() + asset.type.slice(1);
    
    if (allocation[assetType]) {
      allocation[assetType] += (assetValue / portfolioValue) * 100;
    } else {
      allocation[assetType] = (assetValue / portfolioValue) * 100;
    }
  });

  // Round allocation percentages
  Object.keys(allocation).forEach(key => {
    allocation[key] = parseFloat(allocation[key].toFixed(2));
  });

  // Generate performance data (mock for now - would need historical data)
  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    portfolio: Array.from({ length: 12 }, (_, i) => {
      const variation = (Math.random() - 0.5) * 0.1;
      return costBasis * (1 + (i * 0.02) + variation);
    })
  };
  
  const benchmark = {
    name: 'S&P 500',
    data: Array.from({ length: 12 }, (_, i) => {
      const variation = (Math.random() - 0.5) * 0.08;
      return costBasis * (1 + (i * 0.015) + variation);
    })
  };

  // Prepare top holdings from real data
  const topHoldings = currentPortfolio.assets?.map(asset => {
    const value = asset.quantity * asset.purchase_price;
    const costBasis = asset.quantity * asset.purchase_price;
    const returnValue = 0; // Will be 0 for now since current = purchase
    
    return {
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      value: value,
      allocation: portfolioValue > 0 ? ((value / portfolioValue) * 100).toFixed(2) : 0,
      return: returnValue.toFixed(1)
    };
  }).sort((a, b) => b.value - a.value).slice(0, 6) || [];

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Overview of {currentPortfolio.name} as of {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="mb-8">
          <PortfolioSummary 
            portfolioValue={portfolioValue}
            gainLoss={gainLoss}
            gainLossPercent={gainLossPercent}
            allocation={allocation}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PerformanceChart 
            performanceData={performanceData}
            benchmark={benchmark}
          />
          <AssetAllocation 
            allocation={allocation} 
          />
        </div>

        <div className="mb-6">
          <TopHoldings holdings={topHoldings} />
        </div>
      </div>
    </AppLayout>
  );
}