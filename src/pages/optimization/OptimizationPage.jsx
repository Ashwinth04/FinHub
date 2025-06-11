import React, { useState } from 'react';
import { FiSettings, FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import AppLayout from '../../components/layout/AppLayout';
import OptimizationForm from '../../components/optimization/OptimizationForm';
import OptimizationResults from '../../components/optimization/OptimizationResults';
import CreatePortfolioModal from '../../components/portfolio/CreatePortfolioModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { usePortfolio } from '../../hooks/usePortfolio';
import { optimizationAPI } from '../../utils/api';

export default function OptimizationPage() {
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentPortfolio, loading, createPortfolio } = usePortfolio();
  
  // Settings for optimization
  const optimizationStrategies = [
    { 
      id: 'maxSharpe', 
      name: 'Maximum Sharpe Ratio', 
      description: 'Optimizes for the best risk-adjusted return',
      icon: FiTrendingUp
    },
    { 
      id: 'minVolatility', 
      name: 'Minimum Volatility', 
      description: 'Minimizes portfolio risk and volatility',
      icon: FiTrendingDown
    },
    { 
      id: 'equalRisk', 
      name: 'Equal Risk Contribution', 
      description: 'Each asset contributes equally to overall risk',
      icon: FiActivity
    }
  ];
  
  const handleCreatePortfolio = async (portfolioData) => {
    await createPortfolio(portfolioData);
  };
  
  const handleOptimize = async (strategy, riskTolerance) => {
    if (!currentPortfolio) return;
    
    setIsOptimizing(true);
    
    try {
      const response = await optimizationAPI.optimize({
        portfolioId: currentPortfolio.id,
        objective: strategy,
        riskTolerance: riskTolerance
      });
      
      setOptimizationResults(response.data);
    } catch (err) {
      console.error('Optimization failed:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
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
              Create a portfolio to run optimization
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

  if (!currentPortfolio.assets || currentPortfolio.assets.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              No Assets Found
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Add assets to your portfolio to run optimization
            </p>
            <button className="btn btn-primary">Add Assets</button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Portfolio Optimization</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Optimize {currentPortfolio.name} using machine learning algorithms
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center mb-4">
                <FiSettings className="h-5 w-5 text-primary-500 mr-2" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Optimization Settings</h3>
              </div>
              
              <OptimizationForm 
                strategies={optimizationStrategies}
                onOptimize={handleOptimize}
                isOptimizing={isOptimizing}
              />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {isOptimizing ? (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">Optimizing Portfolio...</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Running machine learning algorithms</p>
                </div>
              </div>
            ) : optimizationResults ? (
              <OptimizationResults results={optimizationResults} />
            ) : (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <FiTrendingUp className="h-8 w-8 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Ready to Optimize</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Configure your optimization settings and click "Optimize Portfolio" to see how machine learning can improve your asset allocation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}