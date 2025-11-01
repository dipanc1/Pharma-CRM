import React from 'react'
import { Link } from 'react-router-dom'

const AddButton = ({ link, onClick, icon, title, className = "" }) => {
    const baseClasses = `inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`;
    
    if (link) {
        return (
            <Link to={link} className={baseClasses}>
                {icon}
                {title}
            </Link>
        );
    }
    
    if (onClick) {
        return (
            <button onClick={onClick} className={baseClasses}>
                {icon}
                {title}
            </button>
        );
    }
    
    return null;
}

export default AddButton