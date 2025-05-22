import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

export default function TopHoldings({ holdings }) {
  return (
    <div className="card h-[400px] overflow-auto">
      <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Top Holdings</h3>
      <div className="table-wrapper">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">Asset</th>
              <th className="table-cell text-right">Value</th>
              <th className="table-cell text-right">Allocation</th>
              <th className="table-cell text-right">Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {holdings.map((holding) => (
              <tr key={holding.id} className="table-row">
                <td className="table-cell">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center mr-3">
                      {holding.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-white">{holding.name}</div>
                      <div className="text-xs text-neutral-500">{holding.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="table-cell text-right font-medium text-neutral-900 dark:text-white">
                  ${holding.value.toLocaleString()}
                </td>
                <td className="table-cell text-right text-neutral-500 dark:text-neutral-400">
                  {holding.allocation}%
                </td>
                <td className="table-cell text-right">
                  <div className={`flex items-center justify-end ${holding.return >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                    {holding.return >= 0 ? (
                      <FiArrowUp className="mr-1" />
                    ) : (
                      <FiArrowDown className="mr-1" />
                    )}
                    {Math.abs(holding.return)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}