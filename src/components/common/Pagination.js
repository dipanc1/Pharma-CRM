import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showInfo = true,
  currentCount,
  totalCount,
  itemName = "items"
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {showInfo && (
        <div className="text-sm text-gray-600">
          Showing {currentCount} of {totalCount} {itemName}
        </div>
      )}
      
      <div className="flex items-center space-x-3">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            currentPage === 1 
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
          }`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        
        <span className="text-sm text-gray-700 px-3 py-2">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            currentPage >= totalPages 
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
          }`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
