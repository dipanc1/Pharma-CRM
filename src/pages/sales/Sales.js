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
import {
  Header,
  FilterSelect,
  Table,
  Pagination,
  Loader,
  SearchInput
} from '../../components';

function Sales({
  loading,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  doctorFilter,
  productFilter,
  setProductFilter,
  products,
  page,
  setPage,
  pageSize,
  totalCount,
  filteredSales,
  totalRevenue,
  totalItems,
  totalTransactions,
  companyData,
  contactData,
  doctorSearch,
  setDoctorSearch,
  showDoctorDropdown,
  setShowDoctorDropdown,
  filteredDoctors,
  handleDoctorSelect
}) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const tableHeaders = ['Date', 'Contact', 'Type', 'Product', 'Company', 'Quantity', 'Unit Price', 'Total'];
  const productOptions = products.map(product => ({ value: product.id, label: product.name }));
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasActiveFilters = startDate || endDate || doctorFilter || productFilter;

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      <Header title="Sales Analytics" buttons={[]} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
            {(startDate && endDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Items Sold</p>
            <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
            {(startDate && endDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900">{totalTransactions}</p>
            {(startDate && endDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd, yyyy')}
              </p>
            )}
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
              <p className="mt-1 text-xs text-gray-500">Select start date to apply the date range.</p>
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
            {startDate && endDate && endDate < startDate && (
              <p className="mt-1 text-xs text-red-600">End date cannot be earlier than start date.</p>
            )}
            {startDate && !endDate && (
              <p className="mt-1 text-xs text-gray-500">Select end date to apply the date range.</p>
            )}
          </div>

          <div className="relative">
            <SearchInput
              label="Filter by Contact"
              placeholder="Search for a contact..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              onFocus={() => setShowDoctorDropdown(true)}
              id="doctor_search"
            />

            {showDoctorDropdown && doctorSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map(doctor => {
                    const isChemist = doctor.contact_type === 'chemist';
                    return (
                      <div
                        key={doctor.id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900">{doctor.name}</div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            isChemist 
                              ? 'bg-teal-100 text-teal-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {isChemist ? 'Chemist' : 'Doctor'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {isChemist ? (
                            <>
                              {doctor.hospital && `${doctor.hospital}`}
                            </>
                          ) : (
                            <>
                              {doctor.specialization && `${doctor.specialization} • `}
                              {doctor.doctor_type && `${doctor.doctor_type} • `}
                              {doctor.doctor_class && `Class ${doctor.doctor_class}`}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-gray-500">No contacts found</div>
                )}
              </div>
            )}
            {/* Click outside to close dropdown */}
            {showDoctorDropdown && (
              <div
                className="fixed inset-0 z-5"
                onClick={() => setShowDoctorDropdown(false)}
              />
            )}
          </div>

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
        {/* Sales by Company */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales by Company</h3>
          <div className="h-64">
            {companyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={companyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ company, percent }) => `${company} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {companyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Top Contacts by Sales */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Contacts by Sales</h3>
          <div className="h-64">
            {contactData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contactData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isChemist = data.contact_type === 'chemist';
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{data.name}</p>
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                isChemist 
                                  ? 'bg-teal-100 text-teal-800' 
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {isChemist ? 'Chemist' : 'Doctor'}
                              </span>
                            </div>
                            <p className="text-sm">₹{data.amount.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
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
            {filteredSales.map((sale) => {
              const isChemist = sale.visits?.doctors?.contact_type === 'chemist';
              return (
                <Table.Row key={sale.id}>
                  <Table.Cell>
                    {sale.visits?.visit_date ? format(new Date(sale.visits.visit_date), 'MMM dd, yyyy') : 'N/A'}
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <div className="font-medium text-gray-900">{sale.visits?.doctors?.name}</div>
                      <div className="text-sm text-gray-500">
                        {isChemist ? (
                          sale.visits?.doctors?.hospital || 'N/A'
                        ) : (
                          sale.visits?.doctors?.specialization || 'N/A'
                        )}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      isChemist 
                        ? 'bg-teal-100 text-teal-800' 
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {isChemist ? 'Chemist' : 'Doctor'}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="font-medium">{sale.products?.name}</Table.Cell>
                  <Table.Cell>{sale.products?.company_name || 'N/A'}</Table.Cell>
                  <Table.Cell>{sale.quantity}</Table.Cell>
                  <Table.Cell>₹{parseFloat(sale.unit_price).toFixed(2)}</Table.Cell>
                  <Table.Cell className="font-medium">₹{parseFloat(sale.total_amount).toFixed(2)}</Table.Cell>
                </Table.Row>
              );
            })}
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