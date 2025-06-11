import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import RiskMetrics from '../../components/risk/RiskMetrics';
import CorrelationMatrix from '../../components/risk/CorrelationMatrix';
import MonteCarloSimulation from '../../components/risk/MonteCarloSimulation';
import CreatePortfolioModal from '../../components/portfolio/CreatePortfolioModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useRiskMetrics } from '../../hooks/useRiskMetrics';

export default function RiskAnalysisPage() {
  const { currentPortfolio, loading: portfolioLoading, createPortfolio } = usePortfolio();
  const { riskMetrics, monteCarloData, loading: riskLoading, runMonteCarloSimulation } = useRiskMetrics(currentPortfolio?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreatePortfolio = async (portfolioData) => {
    await createPortfolio(portfolioData);
  };

  if (portfolioLoading || riskLoading) {
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
              Create a portfolio to analyze risk metrics
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
              Add assets to your portfolio to analyze risk metrics
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Risk Analysis</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Analyze and understand the risk profile of {currentPortfolio.name}
          </p>
        </div>
        
        {riskMetrics && (
          <div className="mb-6">
            <RiskMetrics metrics={riskMetrics} />
          </div>
        )}
        
        <div className="mb-6">
          <MonteCarloSimulation 
            portfolioId={currentPortfolio.id}
            data={monteCarloData}
            onRunSimulation={runMonteCarloSimulation}
          />
        </div>
        
        {riskMetrics?.correlationMatrix && (
          <div className="mb-6">
            <CorrelationMatrix data={riskMetrics.correlationMatrix} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}