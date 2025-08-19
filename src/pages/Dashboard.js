import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  CurrencyRupeeIcon, 
  CubeIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

function Dashboard() {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalVisits: 0,
    totalSales: 0,
    totalProducts: 0
  });
  const [recentVisits, setRecentVisits] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch statistics
      const [doctorsCount, visitsCount, salesCount, productsCount] = await Promise.all([
        supabase.from('doctors').select('*', { count: 'exact' }),
        supabase.from('visits').select('*', { count: 'exact' }),
        supabase.from('sales').select('*', { count: 'exact' }),
        supabase.from('products').select('*', { count: 'exact' })
      ]);

      setStats({
        totalDoctors: doctorsCount.count || 0,
        totalVisits: visitsCount.count || 0,
        totalSales: salesCount.count || 0,
        totalProducts: productsCount.count || 0
      });

      // Fetch recent visits with doctor names
      const { data: visits } = await supabase
        .from('visits')
        .select(`
          *,
          doctors (name)
        `)
        .order('visit_date', { ascending: false })
        .limit(5);

      setRecentVisits(visits || []);

      // Fetch sales data for charts
      const { data: sales } = await supabase
        .from('sales')
        .select(`
          *,
          visits (visit_date),
          products (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Process sales data for charts
      const processedSalesData = sales?.map(sale => ({
        date: format(new Date(sale.visits.visit_date), 'MMM dd'),
        amount: parseFloat(sale.total_amount)
      })) || [];

      setSalesData(processedSalesData);

      // Fetch top doctors by sales
      const { data: topDocs } = await supabase
        .from('sales')
        .select(`
          total_amount,
          visits (
            doctors (name)
          )
        `);

      const doctorSales = {};
      topDocs?.forEach(sale => {
        const doctorName = sale.visits.doctors.name;
        doctorSales[doctorName] = (doctorSales[doctorName] || 0) + parseFloat(sale.total_amount);
      });

      const topDoctorsData = Object.entries(doctorSales)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopDoctors(topDoctorsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Link to="/doctors/add" className="btn-primary flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Doctor
          </Link>
          <Link to="/visits/add" className="btn-primary flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Visit
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Doctors</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDoctors}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Visits</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalVisits}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
                <Bar dataKey="amount" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Doctors Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Doctors by Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topDoctors}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {topDoctors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Visits */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Visits</h3>
          <Link to="/visits" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Doctor</th>
                <th className="table-header">Visit Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Notes</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentVisits.map((visit) => (
                <tr key={visit.id}>
                  <td className="table-cell font-medium">{visit.doctors?.name}</td>
                  <td className="table-cell">{format(new Date(visit.visit_date), 'MMM dd, yyyy')}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      visit.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visit.status}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500">
                    {visit.notes ? visit.notes.substring(0, 50) + '...' : 'No notes'}
                  </td>
                  <td className="table-cell">
                    <Link 
                      to={`/visits/${visit.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
