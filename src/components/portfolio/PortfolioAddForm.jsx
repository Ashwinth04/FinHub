import React, { useState } from 'react';
import { FiX, FiCalendar } from 'react-icons/fi';

export default function PortfolioAddForm({ onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'stock',
    quantity: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });
  
  const assetTypes = [
    { value: 'stock', label: 'Stock' },
    { value: 'bond', label: 'Bond' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'reit', label: 'REIT' },
    { value: 'cash', label: 'Cash' },
    { value: 'commodity', label: 'Commodity' }
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would save this to your backend
    console.log('Submitting new asset:', formData);
    // Clear form and close
    onCancel();
  };
  
  return (
    <div className="card animate-fade-in animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Add New Asset</h3>
        <button
          onClick={onCancel}
          className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Asset Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="Apple Inc."
              required
            />
          </div>
          
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Symbol/Ticker
            </label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              className="input"
              placeholder="AAPL"
              required
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Asset Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input"
              required
            >
              {assetTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="input"
              step="any"
              min="0"
              placeholder="10"
              required
            />
          </div>
          
          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Purchase Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500">$</span>
              </div>
              <input
                type="number"
                id="purchasePrice"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                className="input pl-7"
                step="0.01"
                min="0"
                placeholder="150.00"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Purchase Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="input"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <FiCalendar className="h-5 w-5 text-neutral-500" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Add Asset
          </button>
        </div>
      </form>
    </div>
  );
}