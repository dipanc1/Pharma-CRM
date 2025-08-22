import React from 'react';

const StatusBadge = ({ 
  value, 
  getStyleFunction, 
  prefix = '', 
  suffix = '',
  fallback = 'N/A'
}) => {
  if (!value) {
    return <span className="text-gray-400 text-sm">{fallback}</span>;
  }

  const styleClass = getStyleFunction ? getStyleFunction(value) : 'bg-gray-100 text-gray-800';
  const displayValue = `${prefix}${value.charAt(0).toUpperCase() + value.slice(1)}${suffix}`;

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styleClass}`}>
      {displayValue}
    </span>
  );
};

export default StatusBadge;
