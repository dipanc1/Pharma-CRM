import React from 'react';

const FilterBadge = ({ label, value, onRemove, colorClass = "bg-blue-100 text-blue-800" }) => {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${colorClass}`}>
      {label}: {value}
      <button
        onClick={onRemove}
        className="ml-2 hover:opacity-75"
      >
        ×
      </button>
    </span>
  );
};

export default FilterBadge;
