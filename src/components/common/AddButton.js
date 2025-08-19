import React from 'react'
import { Link } from 'react-router-dom'

const AddButton = ({ title, link, icon }) => {
    return (
        <Link to={link} className="btn-primary flex items-center">
            {icon}
            {title}
        </Link>
    )
}

export default AddButton