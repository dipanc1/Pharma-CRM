import { TrashIcon } from '@heroicons/react/24/outline'
import React from 'react'

const DeleteButton = ({ onDelete }) => {
    return (
        <button
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
            <TrashIcon className="h-4 w-4 mr-2 inline" />
            Delete
        </button>
    )
}

export default DeleteButton