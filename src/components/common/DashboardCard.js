import React from 'react'

const DashboardCard = ({ title, value, subtitle, icon }) => {
    return (
        <div className="card">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    {icon}
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-sm font-medium text-blue-600">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DashboardCard