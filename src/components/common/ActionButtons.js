import React from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ActionButtons = ({ 
  viewPath, 
  editPath, 
  onDelete, 
  showView = true, 
  showEdit = true, 
  showDelete = true 
}) => {
  return (
    <div className="flex items-center space-x-3">
      {showView && viewPath && (
        <Link
          to={viewPath}
          className="text-primary-600 hover:text-primary-700 transition-colors"
          title="View Details"
        >
          <EyeIcon className="h-4 w-4" />
        </Link>
      )}
      {showEdit && editPath && (
        <Link
          to={editPath}
          className="text-gray-600 hover:text-gray-700 transition-colors"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </Link>
      )}
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 transition-colors"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
