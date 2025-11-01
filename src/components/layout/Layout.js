import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  CubeIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  BanknotesIcon // Add this import
} from '@heroicons/react/24/outline';

import { useAuth } from '../../contexts/AuthContext';

import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();


  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Doctors', href: '/doctors?type=doctor', icon: UserGroupIcon },
    { name: 'Chemists', href: '/doctors?type=chemist', icon: BuildingStorefrontIcon },
    { name: 'Visits', href: '/visits', icon: CalendarIcon },
    { name: 'Sales', href: '/sales', icon: CurrencyRupeeIcon },
    { name: 'Products', href: '/products', icon: CubeIcon },
    { name: 'Inventory', href: '/inventory', icon: ChartBarIcon },
    { name: 'Cash Flow', href: '/cash-flow', icon: BanknotesIcon }, // Add this line
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        navigation={navigation} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
      />
      
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
};

export default Layout;