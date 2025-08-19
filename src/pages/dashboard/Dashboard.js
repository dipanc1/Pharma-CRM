import React from 'react';
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
import { format } from 'date-fns';
import { DashboardCard, Header } from '../../components';

function Dashboard({ stats, recentVisits, salesData, topDoctors, COLORS }) {

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header
        title="Dashboard"
        buttons={[
          { to: "/doctors/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Doctor" },
          { to: "/visits/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Visit" },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <DashboardCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={<UserGroupIcon className="h-8 w-8 text-primary-600" />}
        />

        <DashboardCard
          title="Total Visits"
          value={stats.totalVisits}
          icon={<CalendarIcon className="h-8 w-8 text-secondary-600" />}
        />

        <DashboardCard
          title="Total Sales"
          value={stats.totalSales}
          icon={<CurrencyRupeeIcon className="h-8 w-8 text-green-600" />}
        />

        <DashboardCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<CubeIcon className="h-8 w-8 text-purple-600" />}
        />

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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${visit.status === 'completed'
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
