import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchInput = ({ 
  label = "Search", 
  placeholder = "Search...", 
  value, 
  onChange,
  id = "search",
  className = ""
}) => {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          id={id}
          className="input-field pl-10"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default SearchInput;
