import React from 'react'
import AddButton from './AddButton'

const Header = ({ buttons, title }) => {
    return (
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {buttons && <div className="flex space-x-3">
                {buttons.map((button, index) => (
                    <AddButton key={index} link={button.to} icon={button.icon} title={button.title} />
                ))}
            </div>}
        </div>
    )
}

export default Header