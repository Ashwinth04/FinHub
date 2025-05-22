import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import PortfolioTable from '../../components/portfolio/PortfolioTable';
import PortfolioAddForm from '../../components/portfolio/PortfolioAddForm';
import { FiPlus } from 'react-icons/fi';

export default function PortfolioPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Mock data for portfolio assets
  const portfolioAssets = [
    { id: 1, name: 'Apple Inc.', symbol: 'AAPL', type: 'stock', quantity: 15, purchasePrice: 150.75, currentPrice: 175.25, purchaseDate: '2022-05-15' },
    { id: 2, name: 'Microsoft Corp.', symbol: 'MSFT', type: 'stock', quantity: 10, purchasePrice: 245.30, currentPrice: 290.15, purchaseDate: '2022-06-22' },
    { id: 3, name: 'Amazon.com Inc.', symbol: 'AMZN', type: 'stock', quantity: 8, purchasePrice: 185.45, currentPrice: 170.50, purchaseDate: '2022-04-10' },
    { id: 4, name: 'Vanguard Total Bond ETF', symbol: 'BND', type: 'bond', quantity: 50, purchasePrice: 82.45, currentPrice: 80.30, purchaseDate: '2022-03-05' },
    { id: 5, name: 'Bitcoin', symbol: 'BTC', type: 'crypto', quantity: 0.5, purchasePrice: 38500, currentPrice: 51250, purchaseDate: '2022-01-20' },
    { id: 6, name: 'Ethereum', symbol: 'ETH', type: 'crypto', quantity: 2.5, purchasePrice: 2850, currentPrice: 3120, purchaseDate: '2022-02-15' },
    { id: 7, name: 'Vanguard Real Estate ETF', symbol: 'VNQ', type: 'reit', quantity: 25, purchasePrice: 95.75, currentPrice: 102.80, purchaseDate: '2022-07-10' },
  ];

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Portfolio</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Manage your investment holdings across different asset classes
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
            <PortfolioAddForm onCancel={toggleAddForm} />
          </div>
        )}

        <div className="mb-6">
          <PortfolioTable assets={portfolioAssets} />
        </div>
      </div>
    </AppLayout>
  );
}