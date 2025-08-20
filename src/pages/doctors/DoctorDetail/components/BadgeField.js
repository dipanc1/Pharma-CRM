import React from 'react'

const BadgeField = ({ label, value, getBadgeStyle, prefix = '' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500">{label}</label>
    <p className="mt-1 text-sm text-gray-900">
      {value ? (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBadgeStyle(value)}`}>
          {prefix}{value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ) : (
        'N/A'
      )}
    </p>
  </div>
);

export default BadgeField