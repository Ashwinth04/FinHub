import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import PortfolioTable from '../../components/portfolio/PortfolioTable';
import PortfolioAddForm from '../../components/portfolio/PortfolioAddForm';
import CreatePortfolioModal from '../../components/portfolio/CreatePortfolioModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { usePortfolio } from '../../hooks/usePortfolio';
import { FiPlus } from 'react-icons/fi';

export default function PortfolioPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentPortfolio, loading, error, createPortfolio, addAsset, updateAsset, deleteAsset } = usePortfolio();

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  const handleCreatePortfolio = async (portfolioData) => {
    await createPortfolio(portfolioData);
  };

  const handleAddAsset = async (assetData) => {
    try {
      await addAsset(currentPortfolio.id, assetData);
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add asset:', err);
    }
  };

  const handleUpdateAsset = async (assetId, data) => {
    try {
      await updateAsset(currentPortfolio.id, assetId, data);
    } catch (err) {
      console.error('Failed to update asset:', err);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(currentPortfolio.id, assetId);
      } catch (err) {
        console.error('Failed to delete asset:', err);
      }
    }
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

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Portfolio</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Manage your investment holdings in {currentPortfolio.name}
            </p>
          </div>
          <button
            onClick={toggleAddForm}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-1" />
            Add Asset
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6">
            <PortfolioAddForm 
              onCancel={toggleAddForm} 
              onSubmit={handleAddAsset}
            />
          </div>
        )}

        <div className="mb-6">
          <PortfolioTable 
            assets={currentPortfolio.assets || []} 
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
          />
        </div>
      </div>
    </AppLayout>
  );
}