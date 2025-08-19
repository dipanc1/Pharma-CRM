import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchSales();
    fetchDoctors();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          visits (
            visit_date,
            doctors (id, name, specialization, hospital)
          ),
          products (name, category)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesDate = !dateFilter || sale.visits?.visit_date === dateFilter;
    const matchesDoctor = !doctorFilter || sale.visits?.doctors?.id === doctorFilter;
    return matchesDate && matchesDoctor;
  });

  const totalRevenue = filteredSales.reduce((total, sale) => total + parseFloat(sale.total_amount), 0);
  const totalItems = filteredSales.reduce((total, sale) => total + sale.quantity, 0);

  // Sales by product category
  const salesByCategory = filteredSales.reduce((acc, sale) => {
    const category = sale.products?.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(sale.total_amount);
    return acc;
  }, {});

  const categoryData = Object.entries(salesByCategory).map(([category, amount]) => ({
    category,
    amount: parseFloat(amount)
  }));

  // Sales by doctor
  const salesByDoctor = filteredSales.reduce((acc, sale) => {
    const doctorName = sale.visits?.doctors?.name || 'Unknown';
    acc[doctorName] = (acc[doctorName] || 0) + parseFloat(sale.total_amount);
    return acc;
  }, {});

  const doctorData = Object.entries(salesByDoctor)
    .map(([doctor, amount]) => ({ doctor, amount: parseFloat(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Items Sold</p>
            <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900">{filteredSales.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <input
              type="date"
              id="dateFilter"
              className="input-field"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="doctorFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Doctor
            </label>
            <select
              id="doctorFilter"
              className="input-field"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="">All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Doctors by Sales */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Doctors by Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="doctor" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
                <Bar dataKey="amount" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales Details Table */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Doctor</th>
                <th className="table-header">Product</th>
                <th className="table-header">Category</th>
                <th className="table-header">Quantity</th>
                <th className="table-header">Unit Price</th>
                <th className="table-header">Total Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    {sale.visits?.visit_date ? format(new Date(sale.visits.visit_date), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">{sale.visits?.doctors?.name}</div>
                      <div className="text-sm text-gray-500">{sale.visits?.doctors?.specialization}</div>
                    </div>
                  </td>
                  <td className="table-cell font-medium">{sale.products?.name}</td>
                  <td className="table-cell text-gray-500">{sale.products?.category || 'N/A'}</td>
                  <td className="table-cell">{sale.quantity}</td>
                  <td className="table-cell">₹{parseFloat(sale.unit_price).toFixed(2)}</td>
                  <td className="table-cell font-medium">₹{parseFloat(sale.total_amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {dateFilter || doctorFilter ? 'No sales found matching your filters.' : 'No sales recorded yet.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sales;
