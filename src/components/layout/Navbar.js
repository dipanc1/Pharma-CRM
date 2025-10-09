import React from 'react'
import {
    Bars3Icon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Navbar = ({ user, signOut, setSidebarOpen }) => {
    return (
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
            >
                <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex flex-1"></div>
                <div className="flex items-center gap-x-1 lg:gap-x-1">
                    <div className="text-sm font-medium text-gray-900">
                        Welcome, {user?.user_metadata?.display_name ?? 'User'}
                    </div>
                    <button
                        onClick={signOut}
                        className="text-gray-600 hover:text-gray-900 flex items-center"
                        title="Sign Out"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Navbar