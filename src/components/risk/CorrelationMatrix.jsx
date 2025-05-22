import React from 'react';

export default function CorrelationMatrix({ data }) {
  const { assets, data: correlationData } = data;
  
  // Function to determine cell color based on correlation value
  const getCellColor = (value) => {
    if (value === 1) return 'bg-neutral-200 dark:bg-neutral-700';
    
    if (value >= 0.7) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    if (value >= 0.4) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    if (value >= 0.2) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    if (value >= -0.2) return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300';
    if (value >= -0.4) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (value >= -0.7) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Asset Correlation Matrix</h3>
      
      <div className="mb-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          This matrix shows how the returns of different assets in your portfolio move in relation to each other.
          Values close to 1 indicate strong positive correlation, values close to -1 indicate strong negative correlation,
          and values near 0 indicate little to no correlation.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border border-neutral-200 dark:border-neutral-700">
          <thead>
            <tr>
              <th className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"></th>
              {assets.map(asset => (
                <th 
                  key={asset.id} 
                  className="px-4 py-2 text-center border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                >
                  {asset.symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {correlationData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th className="px-4 py-2 text-left border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium">
                  {assets[rowIndex].symbol}
                </th>
                {row.map((value, colIndex) => (
                  <td 
                    key={colIndex}
                    className={`px-4 py-2 text-center border border-neutral-200 dark:border-neutral-700 ${getCellColor(value)}`}
                  >
                    {value.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 mr-1 bg-red-100 dark:bg-red-900/30 border border-neutral-200 dark:border-neutral-700"></span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Strong positive (0.7-1.0)</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 mr-1 bg-orange-100 dark:bg-orange-900/30 border border-neutral-200 dark:border-neutral-700"></span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Moderate positive (0.4-0.7)</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 mr-1 bg-yellow-100 dark:bg-yellow-900/30 border border-neutral-200 dark:border-neutral-700"></span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Weak positive (0.2-0.4)</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 mr-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"></span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Little/no correlation (-0.2-0.2)</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 mr-1 bg-green-100 dark:bg-green-900/30 border border-neutral-200 dark:border-neutral-700"></span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Weak negative (-0.4--0.2)</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 mr-1 bg-blue-100 dark:bg-blue-900/30 border border-neutral-200 dark:border-neutral-700"></span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Moderate negative (-0.7--0.4)</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 mr-1 bg-purple-100 dark:bg-purple-900/30 border border-neutral-200 dark:border-neutral-700"></span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Strong negative (-1.0--0.7)</span>
        </div>
      </div>
    </div>
  );
}