import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import {
  Header,
  Table,
  Pagination,
  Loader,
  SearchInput
} from '../../components';
import { handleReload } from '../../helper';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
  totalGrossProfit,
  companyData,
  contactData,
  doctorSearch,
  setDoctorSearch,
  showDoctorDropdown,
  setShowDoctorDropdown,
  filteredDoctors,
  handleDoctorSelect,
  productSearch,
  setProductSearch,
  showProductDropdown,
  setShowProductDropdown,
  filteredProducts,
  handleProductSelect
}) {
  const totalCompanySales = companyData.reduce((sum, c) => {
    const amount = parseFloat(c.amount) || 0;
    return sum + amount;
  }, 0);

  const tableHeaders = ['Date', 'Contact', 'Type', 'Product', 'Company', 'Quantity', 'Unit Price', 'Total', 'Margin'];
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasActiveFilters = !!(startDate || endDate || doctorFilter || productFilter || doctorSearch || productSearch);

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      <Header title="Sales Analytics" buttons={[
        { onClick: handleReload, icon: <ArrowPathIcon className="h-4 w-4 mr-2" />, title: 'Refresh' }
      ]} />

      {/* Stats Cards with better formatting */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">₹{(totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            {(startDate && endDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Margin</p>
            <p className={`text-3xl font-bold mt-1 ${(totalGrossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(totalGrossProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
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
            <p className="text-3xl font-bold text-gray-900">{(totalItems || 0).toLocaleString('en-IN')}</p>
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
            <p className="text-3xl font-bold text-gray-900">{(totalTransactions || 0).toLocaleString('en-IN')}</p>
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
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${isChemist
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

          <div className="relative">
            <SearchInput
              label="Filter by Product"
              placeholder="Search for a product..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onFocus={() => setShowProductDropdown(true)}
              id="product_search"
            />

            {showProductDropdown && productSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No products found</div>
                )}
              </div>
            )}

            {/* Click outside to close dropdown */}
            {showProductDropdown && (
              <div
                className="fixed inset-0 z-5"
                onClick={() => setShowProductDropdown(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Charts (Sales by Company converted to Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Company - Table */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales by Company</h3>
          {companyData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales (₹)
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Share
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companyData
                    .sort((a, b) => b.amount - a.amount)
                    .map((row) => {
                      const amount = parseFloat(row.amount) || 0;
                      const percent = totalCompanySales > 0 ? (amount / totalCompanySales) * 100 : 0;
                      return (
                        <tr key={row.company}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.company}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            ₹{amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {percent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  {/* Total Row */}
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-4 py-2 text-sm text-gray-900">Total</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      ₹{totalCompanySales.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">100.00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Top Contacts by Sales (keep existing bar chart) */}
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
                    formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Amount']}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isChemist = data.contact_type === 'chemist';
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{data.name}</p>
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${isChemist
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {isChemist ? 'Chemist' : 'Doctor'}
                              </span>
                            </div>
                            <p className="text-sm">₹{Number(data.amount).toFixed(2)}</p>
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
              
              // Enhanced profit calculation with error handling
              let profitDisplay = '₹0.00';
              let profitColor = 'text-gray-600';
              
              try {
                const costPrice = parseFloat(sale.products?.price || 0);
                const sellingPrice = parseFloat(sale.unit_price || 0);
                const quantity = parseInt(sale.quantity || 0, 10);
                
                if (!isNaN(costPrice) && !isNaN(sellingPrice) && !isNaN(quantity)) {
                  const profitPerUnit = sellingPrice - costPrice;
                  const totalProfit = profitPerUnit * quantity;
                  
                  profitDisplay = `₹${Math.abs(totalProfit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  profitColor = totalProfit >= 0 ? 'text-green-600' : 'text-red-600';
                }
              } catch (error) {
                console.error('Error calculating profit for display:', error);
              }

              return (
                <Table.Row key={sale.id}>
                  <Table.Cell>
                    {sale.visits?.visit_date ? format(new Date(sale.visits.visit_date), 'MMM dd, yyyy') : 'N/A'}
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <div className="font-medium text-gray-900">{sale.visits?.doctors?.name || 'Unknown'}</div>
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isChemist
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-indigo-100 text-indigo-800'
                      }`}>
                      {isChemist ? 'Chemist' : 'Doctor'}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="font-medium">{sale.products?.name || 'Unknown Product'}</Table.Cell>
                  <Table.Cell>{sale.products?.company_name || 'N/A'}</Table.Cell>
                  <Table.Cell>{parseInt(sale.quantity || 0, 10).toLocaleString('en-IN')}</Table.Cell>
                  <Table.Cell>₹{parseFloat(sale.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Cell>
                  <Table.Cell className="font-medium">₹{parseFloat(sale.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Cell>
                  <Table.Cell className={`font-medium ${profitColor}`}>
                    {profitDisplay}
                  </Table.Cell>
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