import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const BackEditTitleAndButton = ({ title, backButtonPath }) => {
    const navigate = useNavigate()
    return (
        <div className="flex items-center space-x-4">
            <button
                onClick={() => navigate(backButtonPath)}
                className="text-gray-600 hover:text-gray-900"
            >
                <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
    )
}

export default BackEditTitleAndButton