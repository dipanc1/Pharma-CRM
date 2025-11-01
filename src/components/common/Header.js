import React from 'react'
import AddButton from './AddButton'

const Header = ({ buttons, title, description }) => {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
            </div>
            {buttons && <div className="flex space-x-3">
                {buttons.map((button, index) => (
                    <AddButton 
                        key={index} 
                        link={button.to} 
                        onClick={button.onClick}
                        icon={button.icon} 
                        title={button.title} 
                    />
                ))}
            </div>}
        </div>
    )
}

export default Header