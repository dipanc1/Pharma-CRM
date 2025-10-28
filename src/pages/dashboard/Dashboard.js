import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  CubeIcon,
  PlusIcon,
  EyeIcon,
  ChartBarIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { DashboardCard, Header } from '../../components';

function Dashboard({ stats, recentVisits, salesData, topContacts, COLORS, selectedMonth, setSelectedMonth, monthOptions }) {
  const currentMonth = format(new Date(), 'MMMM yyyy');

  const getDisplayTitle = () => {
    if (selectedMonth === 'overall') {
      return 'Dashboard - All Time Data';
    } else if (selectedMonth === 'current') {
      return `Dashboard - ${currentMonth}`;
    } else {
      const year = parseInt(selectedMonth.split('-')[0]);
      const month = parseInt(selectedMonth.split('-')[1]) - 1;
      const date = new Date(year, month);
      return `Dashboard - ${format(date, 'MMMM yyyy')}`;
    }
  };

  const getChartTitle = () => {
    if (selectedMonth === 'overall') {
      return 'All Time';
    } else if (selectedMonth === 'current') {
      return currentMonth;
    } else {
      const year = parseInt(selectedMonth.split('-')[0]);
      const month = parseInt(selectedMonth.split('-')[1]) - 1;
      const date = new Date(year, month);
      return format(date, 'MMMM yyyy');
    }
  };

  const groupedOptions = monthOptions.reduce((groups, option) => {
    const group = option.group || 'other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(option);
    return groups;
  }, {});

  const groupLabels = {
    quick: 'Quick Select',
    thisYear: `${new Date().getFullYear()} Months`
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header
        title={getDisplayTitle()}
        buttons={[
          { to: "/doctors/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Contact" },
          { to: "/visits/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Visit" },
        ]}
      />

      {/* Month Selector */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Select Time Period</h3>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            {Object.entries(groupedOptions).map(([groupKey, options]) => (
              <optgroup key={groupKey} label={groupLabels[groupKey] || groupKey}>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

        <DashboardCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={<UserGroupIcon className="h-8 w-8 text-primary-600" />}
        />

        <DashboardCard
          title="Total Chemists"
          value={stats.totalChemists}
          icon={<BuildingStorefrontIcon className="h-8 w-8 text-teal-600" />}
        />

        <DashboardCard
          title={selectedMonth === 'overall' ? 'Contacts Visited (All Time)' : 'Contacts Visited'}
          value={`${stats.visitedDoctors} / ${stats.totalContacts}`}
          subtitle={`${stats.visitPercentage}% Coverage`}
          icon={<ChartBarIcon className="h-8 w-8 text-secondary-600" />}
        />

        <DashboardCard
          title={selectedMonth === 'overall' ? 'Total Sales' : 'Sales This Period'}
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Daily Sales - {getChartTitle()}
          </h3>
          <div className="h-64">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <CurrencyRupeeIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No sales data for this period</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Contacts Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Contacts by Sales - {getChartTitle()}
          </h3>
          <div className="h-64">
            {topContacts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topContacts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, contact_type, percent }) => {
                      const typeLabel = contact_type === 'chemist' ? '💊' : '👨‍⚕️';
                      return `${name} ${typeLabel} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {topContacts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No contact sales data for this period</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Visits */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Visits - {getChartTitle()}
          </h3>
          <Link to="/visits" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentVisits.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Visit Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Notes</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentVisits.map((visit) => {
                  const isChemist = visit.doctors?.contact_type === 'chemist';
                  return (
                    <tr key={visit.id}>
                      <td className="table-cell font-medium">{visit.doctors?.name}</td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isChemist 
                            ? 'bg-teal-100 text-teal-800' 
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {isChemist ? 'Chemist' : 'Doctor'}
                        </span>
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="text-gray-500">
                <h4 className="text-lg font-medium mb-2">No visits in this period</h4>
                <p className="text-sm">
                  {selectedMonth === 'current'
                    ? `Start by adding your first visit for ${currentMonth}.`
                    : 'No visits were recorded during the selected time period.'
                  }
                </p>
              </div>
              {selectedMonth === 'current' && (
                <div className="mt-4">
                  <Link
                    to="/visits/add"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add First Visit
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;