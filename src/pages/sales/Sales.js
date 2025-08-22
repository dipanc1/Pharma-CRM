import React from 'react';
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
import { format } from 'date-fns';
import { Header, FilterSelect, Table, Pagination } from '../../components';

function Sales({
  sales,
  loading,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  doctorFilter,
  setDoctorFilter,
  productFilter,
  setProductFilter,
  doctors,
  products,
  page,
  setPage,
  pageSize,
  totalCount,
  filteredSales,
  totalRevenue,
  totalItems,
  categoryData,
  doctorData
}) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const tableHeaders = ['Date', 'Doctor', 'Product', 'Category', 'Quantity', 'Unit Price', 'Total Amount'];

  const doctorOptions = doctors.map(doctor => ({ value: doctor.id, label: doctor.name }));
  const productOptions = products.map(product => ({ value: product.id, label: product.name }));

  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));

  const hasDateRangeError = startDate && endDate && endDate < startDate;
  const hasActiveFilters = startDate || endDate || doctorFilter || productFilter;

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales data...</p>
        </div>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
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
            {hasDateRangeError && (
              <p className="mt-1 text-xs text-red-600">End date cannot be earlier than start date.</p>
            )}
            {startDate && !endDate && (
              <p className="mt-1 text-xs text-gray-500">Select end date to filter by date.</p>
            )}
          </div>
          
          <FilterSelect
            label="Filter by Doctor"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            options={doctorOptions}
            placeholder="All Doctors"
            id="doctorFilter"
          />
          
          <FilterSelect
            label="Filter by Product"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            options={productOptions}
            placeholder="All Products"
            id="productFilter"
          />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Sales Details</h3>
            <div className="text-sm text-gray-600 mt-1">
              Showing {Math.min(pageSize, Math.max(0, totalCount - (page - 1) * pageSize))} of {totalCount} sales
            </div>
          </div>
          
          <Pagination
            currentPage={page}
            totalPages={maxPage}
            onPageChange={setPage}
            showInfo={false}
          />
        </div>

        {filteredSales.length > 0 ? (
          <Table headers={tableHeaders}>
            {filteredSales.map((sale) => (
              <Table.Row key={sale.id}>
                <Table.Cell>
                  {sale.visits?.visit_date ? format(new Date(sale.visits.visit_date), 'MMM dd, yyyy') : 'N/A'}
                </Table.Cell>
                <Table.Cell>
                  <div>
                    <div className="font-medium text-gray-900">{sale.visits?.doctors?.name}</div>
                    <div className="text-sm text-gray-500">{sale.visits?.doctors?.specialization}</div>
                  </div>
                </Table.Cell>
                <Table.Cell className="font-medium">{sale.products?.name}</Table.Cell>
                <Table.Cell>{sale.products?.category || 'N/A'}</Table.Cell>
                <Table.Cell>{sale.quantity}</Table.Cell>
                <Table.Cell>₹{parseFloat(sale.unit_price).toFixed(2)}</Table.Cell>
                <Table.Cell className="font-medium">₹{parseFloat(sale.total_amount).toFixed(2)}</Table.Cell>
              </Table.Row>
            ))}
          </Table>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {hasActiveFilters ? 'No sales found matching your filters.' : 'No sales recorded yet.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sales;
