import React, { useState } from 'react';
import { FiArrowUp, FiArrowDown, FiEdit2, FiTrash2, FiChevronUp, FiChevronDown, FiSave, FiX } from 'react-icons/fi';

export default function PortfolioTable({ assets, onUpdateAsset, onDeleteAsset }) {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingAsset, setEditingAsset] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  const sortedAssets = [...assets].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleEditClick = (asset) => {
    setEditingAsset(asset.id);
    setEditForm({
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type,
      quantity: asset.quantity,
      purchase_price: asset.purchase_price,
      purchase_date: asset.purchase_date
    });
  };
  
  const handleEditCancel = () => {
    setEditingAsset(null);
    setEditForm({});
  };
  
  const handleEditSave = async (assetId) => {
    try {
      await onUpdateAsset(assetId, {
        ...editForm,
        quantity: parseFloat(editForm.quantity),
        purchase_price: parseFloat(editForm.purchase_price)
      });
      setEditingAsset(null);
      setEditForm({});
    } catch (err) {
      console.error('Failed to update asset:', err);
    }
  };
  
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };
  
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />;
  };
  
  const getAssetTypeLabel = (type) => {
    switch (type) {
      case 'stock': return 'Stock';
      case 'bond': return 'Bond';
      case 'crypto': return 'Crypto';
      case 'reit': return 'REIT';
      case 'cash': return 'Cash';
      case 'commodity': return 'Commodity';
      default: return type;
    }
  };
  
  const getAssetTypeColor = (type) => {
    switch (type) {
      case 'stock': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'bond': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'crypto': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'reit': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'cash': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'commodity': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const assetTypes = [
    { value: 'stock', label: 'Stock' },
    { value: 'bond', label: 'Bond' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'reit', label: 'REIT' },
    { value: 'cash', label: 'Cash' },
    { value: 'commodity', label: 'Commodity' }
  ];
  
  return (
    <div className="card overflow-hidden">
      <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Portfolio Holdings</h3>
      <div className="table-wrapper">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th
                className="table-cell text-left cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Asset
                  {renderSortIcon('name')}
                </div>
              </th>
              <th
                className="table-cell text-left cursor-pointer"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {renderSortIcon('type')}
                </div>
              </th>
              <th
                className="table-cell text-right cursor-pointer"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center justify-end">
                  Quantity
                  {renderSortIcon('quantity')}
                </div>
              </th>
              <th
                className="table-cell text-right cursor-pointer"
                onClick={() => handleSort('purchase_price')}
              >
                <div className="flex items-center justify-end">
                  Purchase Price
                  {renderSortIcon('purchase_price')}
                </div>
              </th>
              <th
                className="table-cell text-right cursor-pointer"
                onClick={() => handleSort('purchase_price')}
              >
                <div className="flex items-center justify-end">
                  Current Price
                  {renderSortIcon('purchase_price')}
                </div>
              </th>
              <th
                className="table-cell text-right cursor-pointer"
                onClick={() => handleSort('purchase_date')}
              >
                <div className="flex items-center justify-end">
                  Purchase Date
                  {renderSortIcon('purchase_date')}
                </div>
              </th>
              <th className="table-cell text-right">Market Value</th>
              <th className="table-cell text-right">Gain/Loss</th>
              <th className="table-cell text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {sortedAssets.map((asset) => {
              const isEditing = editingAsset === asset.id;
              const currentPrice = asset.purchase_price;
              const marketValue = asset.quantity * currentPrice;
              const costBasis = asset.quantity * asset.purchase_price;
              const gainLoss = marketValue - costBasis;
              const gainLossPercent = costBasis > 0 ? ((gainLoss / costBasis) * 100).toFixed(2) : 0;
              const isPositive = gainLoss >= 0;
              
              return (
                <tr key={asset.id} className="table-row animate-fade-in">
                  <td className="table-cell">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => handleEditChange('name', e.target.value)}
                        className="input text-sm py-1"
                      />
                    ) : (
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">{asset.name}</div>
                        <div className="text-xs text-neutral-500">{asset.symbol}</div>
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    {isEditing ? (
                      <select
                        value={editForm.type}
                        onChange={(e) => handleEditChange('type', e.target.value)}
                        className="input text-sm py-1"
                      >
                        {assetTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAssetTypeColor(asset.type)}`}>
                        {getAssetTypeLabel(asset.type)}
                      </span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.quantity}
                        onChange={(e) => handleEditChange('quantity', e.target.value)}
                        className="input text-sm py-1 w-20"
                        step="any"
                      />
                    ) : (
                      asset.quantity
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.purchase_price}
                        onChange={(e) => handleEditChange('purchase_price', e.target.value)}
                        className="input text-sm py-1 w-24"
                        step="0.01"
                      />
                    ) : (
                      formatCurrency(asset.purchase_price)
                    )}
                  </td>
                  <td className="table-cell text-right">{formatCurrency(currentPrice)}</td>
                  <td className="table-cell text-right">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.purchase_date}
                        onChange={(e) => handleEditChange('purchase_date', e.target.value)}
                        className="input text-sm py-1"
                      />
                    ) : (
                      formatDate(asset.purchase_date)
                    )}
                  </td>
                  <td className="table-cell text-right font-medium">{formatCurrency(marketValue)}</td>
                  <td className="table-cell text-right">
                    <div className={`flex items-center justify-end ${isPositive ? 'text-success-500' : 'text-error-500'}`}>
                      {isPositive ? (
                        <FiArrowUp className="mr-1" />
                      ) : (
                        <FiArrowDown className="mr-1" />
                      )}
                      <span>{formatCurrency(Math.abs(gainLoss))}</span>
                      <span className="ml-1 text-xs">({isPositive ? '+' : ''}{gainLossPercent}%)</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleEditSave(asset.id)}
                            className="p-1 text-neutral-500 hover:text-success-500 dark:text-neutral-400 dark:hover:text-success-400"
                            title="Save"
                          >
                            <FiSave />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-1 text-neutral-500 hover:text-error-500 dark:text-neutral-400 dark:hover:text-error-400"
                            title="Cancel"
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(asset)}
                            className="p-1 text-neutral-500 hover:text-primary-500 dark:text-neutral-400 dark:hover:text-primary-400"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => onDeleteAsset(asset.id)}
                            className="p-1 text-neutral-500 hover:text-error-500 dark:text-neutral-400 dark:hover:text-error-400"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="table-header">
            <tr>
              <td colSpan="6" className="table-cell text-right font-semibold">Total</td>
              <td className="table-cell text-right font-semibold">
                {formatCurrency(sortedAssets.reduce((sum, asset) => sum + asset.quantity * asset.purchase_price, 0))}
              </td>
              <td className="table-cell text-right font-semibold">
                {(() => {
                  const totalGainLoss = 0; // Since current price = purchase price for now
                  const isPositive = totalGainLoss >= 0;
                  
                  return (
                    <div className={`flex items-center justify-end ${isPositive ? 'text-success-500' : 'text-error-500'}`}>
                      {isPositive ? (
                        <FiArrowUp className="mr-1" />
                      ) : (
                        <FiArrowDown className="mr-1" />
                      )}
                      {formatCurrency(Math.abs(totalGainLoss))}
                    </div>
                  );
                })()}
              </td>
              <td className="table-cell"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}