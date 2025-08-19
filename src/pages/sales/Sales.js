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
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Header } from '../../components';

function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [productFilter, setProductFilter] = useState('');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, doctorFilter, productFilter, page, pageSize]);

  // Reset to first page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, doctorFilter, productFilter]);

  useEffect(() => {
    fetchDoctors();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);

      // Compute date flags
      const invalidRange = !!(startDate && endDate && endDate < startDate);
      const applyDateRange = !!(startDate && endDate && !invalidRange);

      let query = supabase
        .from('sales')
        .select(`
          *,
          visits!inner (
            visit_date,
            doctors (id, name, specialization, hospital)
          ),
          products (name, category)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply date filters only when both dates are selected and valid
      if (applyDateRange) {
        query = query
          .gte('visits.visit_date', startDate)
          .lte('visits.visit_date', endDate);
      }
      // If only one date is selected or range invalid, no date filter is applied

      if (doctorFilter) {
        query = query.eq('visits.doctor_id', doctorFilter);
      }
      if (productFilter) {
        query = query.eq('product_id', productFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setSales(data || []);
      setTotalCount(count || 0);
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

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const filteredSales = sales;

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
      <Header title="Sales Analytics" buttons={[]} />

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="input-field"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {/* Hint when only end date is selected */}
            {endDate && !startDate && (
              <p className="mt-1 text-xs text-gray-500">Select start date to filter by date.</p>
            )}
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="input-field"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {/* Inline validation/help text */}
            {startDate && endDate && endDate < startDate && (
              <p className="mt-1 text-xs text-red-600">End date cannot be earlier than start date.</p>
            )}
            {startDate && !endDate && (
              <p className="mt-1 text-xs text-gray-500">Select end date to filter by date.</p>
            )}
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
          <div>
            <label htmlFor="productFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Product
            </label>
            <select
              id="productFilter"
              className="input-field"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Sales Details</h3>
          <div className="flex items-center space-x-2">
            <button
              className="btn-secondary px-3 py-1"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">Page {page}</span>
            <button
              className="btn-secondary px-3 py-1"
              onClick={() => {
                const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
                setPage(prev => Math.min(maxPage, prev + 1));
              }}
              disabled={page >= Math.ceil(totalCount / pageSize)}
            >
              Next
            </button>
          </div>
        </div>
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
              {startDate || endDate || doctorFilter || productFilter ? 'No sales found matching your filters.' : 'No sales recorded yet.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sales;
