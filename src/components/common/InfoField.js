import React from 'react'

const InfoField = ({ label, value }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500">{label}</label>
    <p className="mt-1 text-sm text-gray-900">{value || 'N/A'}</p>
  </div>
);

export default InfoField