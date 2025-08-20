import React from 'react'
import { Link } from 'react-router-dom'

const SecondaryButton = ({ link, icon, children }) => {
    return (
        <Link
            to={link}
            className="btn-secondary flex items-center"
        >
            {icon ? icon : null}
            {children}
        </Link>
    )
}

export default SecondaryButton