import React from 'react';

export default function MetricCard({ title, value, trend, trendValue, icon: Icon, trendDirection }) {
  const getTrendColor = () => {
    if (!trendDirection) return 'text-neutral-500';
    return trendDirection === 'up' ? 'text-success-500' : 'text-error-500';
  };

  const getTrendIcon = () => {
    if (!trendDirection) return null;
    return trendDirection === 'up' ? '↑' : '↓';
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="text-neutral-500 dark:text-neutral-400 text-sm">{title}</div>
        {Icon && <Icon className="h-5 w-5 text-primary-500" />}
      </div>
      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
      {trend && (
        <div className="mt-2 flex items-center">
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()} {trendValue}
          </span>
          <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">{trend}</span>
        </div>
      )}
    </div>
  );
}