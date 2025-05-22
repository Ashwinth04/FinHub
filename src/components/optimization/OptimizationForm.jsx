import React, { useState } from 'react';

export default function OptimizationForm({ strategies, onOptimize, isOptimizing }) {
  const [selectedStrategy, setSelectedStrategy] = useState(strategies[0].id);
  const [riskTolerance, setRiskTolerance] = useState(5);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onOptimize(selectedStrategy, riskTolerance);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Optimization Strategy
        </label>
        <div className="space-y-3">
          {strategies.map((strategy) => (
            <label
              key={strategy.id}
              className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedStrategy === strategy.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                  : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <input
                type="radio"
                name="strategy"
                value={strategy.id}
                checked={selectedStrategy === strategy.id}
                onChange={() => setSelectedStrategy(strategy.id)}
                className="sr-only"
              />
              <div className="flex-shrink-0 h-5 w-5 mt-0.5">
                <span
                  className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                    selectedStrategy === strategy.id
                      ? 'border-primary-500 bg-primary-500 dark:bg-primary-600'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                >
                  {selectedStrategy === strategy.id && (
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <div className="ml-3 flex-grow">
                <div className="flex items-center">
                  <strategy.icon className={`h-4 w-4 mr-1.5 ${
                    selectedStrategy === strategy.id
                      ? 'text-primary-500'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`} />
                  <span className="font-medium text-neutral-900 dark:text-white">{strategy.name}</span>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {strategy.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="risk-tolerance" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Risk Tolerance
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Conservative</span>
          <input
            id="risk-tolerance"
            type="range"
            min="1"
            max="10"
            step="1"
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
          />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Aggressive</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">1</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">5</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">10</span>
        </div>
      </div>
      
      <button
        type="submit"
        className="btn btn-primary w-full flex items-center justify-center"
        disabled={isOptimizing}
      >
        {isOptimizing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Optimizing...
          </>
        ) : (
          'Optimize Portfolio'
        )}
      </button>
    </form>
  );
}