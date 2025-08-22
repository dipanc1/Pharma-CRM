import React from 'react';

const FilterSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder = "All",
  id,
  name,
  className = ""
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        id={id}
        name={name || id}
        className="input-field"
        value={value}
        onChange={onChange}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterSelect;
