import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  CubeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '../../contexts/AuthContext';

import Sidebar from './Sidebar';
import Navbar from './Navbar';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Doctors', href: '/doctors', icon: UserGroupIcon },
  { name: 'Visits', href: '/visits', icon: CalendarIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Sales', href: '/sales', icon: ChartBarIcon },
];

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar navigation={navigation} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="lg:pl-64">

        {/* Top bar */}
        <Navbar user={user} signOut={signOut} setSidebarOpen={setSidebarOpen} />

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
