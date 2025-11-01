import React from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ActionButtons = ({ 
  viewPath, 
  editPath, 
  onEdit,
  onDelete, 
  showView = true, 
  showEdit = true, 
  showDelete = true,
  editTitle = "Edit",
  deleteTitle = "Delete"
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
      {showEdit && (editPath || onEdit) && (
        <>
          {editPath ? (
            <Link
              to={editPath}
              className="text-gray-600 hover:text-gray-700 transition-colors"
              title={editTitle}
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={onEdit}
              className="text-gray-600 hover:text-gray-700 transition-colors"
              title={editTitle}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
        </>
      )}
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 transition-colors"
          title={deleteTitle}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
