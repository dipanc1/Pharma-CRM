import React, { useState, useEffect } from 'react';
import { PlusIcon, BanknotesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import {
  Header,
  SearchInput,
  FilterSelect,
  FilterBadge,
  Table,
  Pagination,
  Loader,
  ActionButtons,
  StatusBadge,
  Modal,
  NoRecordsAddButtonLayout,
  AddButton
} from '../../components/common';
import { handleReload } from '../../helper';

const CashFlow = ({
  cashFlowData,
  loading,
  submitting,
  isModalOpen,
  editingRecord,
  filters,
  currentPage,
  totalRecords,
  recordsPerPage,
  analytics,
  chartData,
  onAdd,
  onEdit,
  onDelete,
  onSubmit,
  onModalClose,
  onFilterChange,
  onPageChange,
  doctors,
  doctorSearch,
  setDoctorSearch
}) => {
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    cash_type: 'out_flow',
    name: '',
    type: 'sundry',
    amount: '',
    purpose: 'expense',
    notes: '',
    doctor_id: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // Initialize form data when modal opens or editing record changes
  useEffect(() => {
    if (isModalOpen) {
      if (editingRecord) {
        setFormData({
          transaction_date: editingRecord.transaction_date || new Date().toISOString().split('T')[0],
          cash_type: editingRecord.cash_type || 'out_flow',
          name: editingRecord.name || '',
          type: editingRecord.type || 'sundry',
          amount: editingRecord.amount ? editingRecord.amount.toString() : '',
          purpose: editingRecord.purpose || '',
          notes: editingRecord.notes || '',
          doctor_id: editingRecord.doctor_id || ''
        });
      } else {
        setFormData({
          transaction_date: new Date().toISOString().split('T')[0],
          cash_type: 'out_flow',
          name: '',
          type: 'sundry',
          amount: '',
          purpose: 'expense',
          notes: '',
          doctor_id: ''
        });
      }
      setFormErrors({});
    }
  }, [editingRecord, isModalOpen]);

  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Valid amount is required';
    }

    if (!formData.transaction_date) {
      errors.transaction_date = 'Transaction date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'cash_type') {
      setFormData(prev => ({ ...prev, purpose: '' }));
    }

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm() && !submitting) {
      onSubmit(formData);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0.00';
    return `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const getCashTypeStyle = (value) => {
    switch (value) {
      case 'in_flow':
        return 'bg-green-100 text-green-800';
      case 'out_flow':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCashTypeLabel = (value) => {
    switch (value) {
      case 'in_flow':
        return 'In Flow';
      case 'out_flow':
        return 'Out Flow';
      default:
        return value;
    }
  };

  const columns = [
    {
      key: 'transaction_date',
      label: 'Date',
      format: formatDate
    },
    {
      key: 'cash_type',
      label: 'Flow Type',
      format: (value) => (
        <StatusBadge
          value={getCashTypeLabel(value)}
          getStyleFunction={() => getCashTypeStyle(value)}
          prefix=""
          suffix=""
        />
      )
    },
    {
      key: 'doctors',
      label: 'Linked Contact',
      format: (value, row) => {
        if (row.doctors?.id) {
          const isChemist = row.doctors.contact_type === 'chemist';
          return (
            <div className="flex items-center gap-2">
              <a
                href={`/doctors/${row.doctors.id}`}
                className="text-primary-600 hover:underline font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {row.doctors.name}
              </a>
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                isChemist ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {isChemist ? 'Chemist' : 'Doctor'}
              </span>
            </div>
          );
        }
        return <span className="text-gray-400 text-sm">—</span>;
      }
    },
    { key: 'name', label: 'Name' },
    {
      key: 'type',
      label: 'Type',
      format: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'
    },
    {
      key: 'purpose',
      label: 'Purpose',
      format: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ') : '-'
    },
    {
      key: 'amount',
      label: 'Amount',
      format: formatCurrency
    },
    {
      key: 'notes',
      label: 'Notes',
      format: (value) => value || '-'
    }
  ];

  const cashTypeOptions = [
    { value: 'in_flow', label: 'In Flow' },
    { value: 'out_flow', label: 'Out Flow' }
  ];

  const typeOptions = [
    { value: 'sundry', label: 'Sundry' },
    { value: 'person', label: 'Person' }
  ];

  const purposeOptions = [
    { value: 'advance', label: 'Advance', cash_type: 'in_flow' },
    { value: 'loan', label: 'Loan', cash_type: 'in_flow' },
    { value: 'other', label: 'Other', cash_type: 'in_flow' },
    { value: 'debt_received', label: 'Debt Received', cash_type: 'in_flow' },

    { value: 'advance', label: 'Advance', cash_type: 'out_flow' },
    { value: 'loan', label: 'Loan', cash_type: 'out_flow' },
    { value: 'purchase', label: 'Purchase', cash_type: 'out_flow' },
    { value: 'other', label: 'Other', cash_type: 'out_flow' },
    { value: 'expense', label: 'Expense', cash_type: 'out_flow' },
    { value: 'gift', label: 'Gift', cash_type: 'out_flow' },
    { value: 'payment', label: 'Payment', cash_type: 'out_flow' },
    { value: 'daily_expense', label: 'Daily Expense', cash_type: 'out_flow' },
    { value: 'travel_expense', label: 'Travel Expense', cash_type: 'out_flow' },
  ];

  const filteredPurposeOptions = purposeOptions.filter(option => {
    return option.cash_type === formData.cash_type;
  });

  const activeFilters = [
    filters.cashType && {
      key: 'cashType',
      label: `Flow: ${cashTypeOptions.find(o => o.value === filters.cashType)?.label}`
    },
    filters.type && {
      key: 'type',
      label: `Type: ${typeOptions.find(o => o.value === filters.type)?.label}`
    },
    filters.purpose && {
      key: 'purpose',
      label: `Purpose: ${purposeOptions.find(o => o.value === filters.purpose)?.label}`
    },
    filters.startDate && {
      key: 'startDate',
      label: `From: ${format(new Date(filters.startDate), 'MMM dd, yyyy')}`
    },
    filters.endDate && {
      key: 'endDate',
      label: `To: ${format(new Date(filters.endDate), 'MMM dd, yyyy')}`
    }
  ].filter(Boolean);

  if (loading) {
    return <Loader />;
  }

  const hasData = cashFlowData.length > 0;
  const hasFilters = activeFilters.length > 0 || filters.searchTerm;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  return (
    <div className="space-y-6">
      <Header
        title="Cash Flow"
        buttons={[
          {
            onClick: onAdd,
            icon: <PlusIcon className="h-4 w-4 mr-2" />,
            title: "Add Transaction"
          },
          { onClick: handleReload, icon: <ArrowPathIcon className="h-4 w-4 mr-2" />, title: 'Refresh' }

        ]}
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Inflow</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(analytics.totalInflow)}</p>
            {(filters.startDate && filters.endDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(filters.startDate), 'MMM dd')} - {format(new Date(filters.endDate), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Outflow</p>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(analytics.totalOutflow)}</p>
            {(filters.startDate && filters.endDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(filters.startDate), 'MMM dd')} - {format(new Date(filters.endDate), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Net Flow</p>
            <p className={`text-3xl font-bold ${analytics.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(analytics.netFlow)}
            </p>
            {(filters.startDate && filters.endDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(filters.startDate), 'MMM dd')} - {format(new Date(filters.endDate), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalTransactions}</p>
            {(filters.startDate && filters.endDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(filters.startDate), 'MMM dd')} - {format(new Date(filters.endDate), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters & Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SearchInput
            label="Search Transactions"
            placeholder="Search by name..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            id="transaction_search"
          />

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.startDate || ''}
              max={filters.endDate || undefined}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.endDate || ''}
              min={filters.startDate || undefined}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
            />
          </div>

          <FilterSelect
            label="Flow Type"
            id="cashTypeFilter"
            value={filters.cashType}
            onChange={(e) => onFilterChange('cashType', e.target.value)}
            options={cashTypeOptions}
            placeholder="All Flow Types"
          />

          <FilterSelect
            label="Type"
            id="typeFilter"
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            options={typeOptions}
            placeholder="All Types"
          />

          <FilterSelect
            label="Purpose"
            id="purposeFilter"
            value={filters.purpose}
            onChange={(e) => onFilterChange('purpose', e.target.value)}
            options={purposeOptions}
            placeholder="All Purposes"
          />
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            {activeFilters.map((filter) => (
              <FilterBadge
                key={filter.key}
                label={filter.label}
                onRemove={() => onFilterChange(filter.key === 'startDate' || filter.key === 'endDate' ? filter.key : filter.key, '')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow Type Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Flow Type Distribution</h3>
          <div className="h-64">
            {chartData.flowTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.flowTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {chartData.flowTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.type === 'In Flow' ? '#10B981' : '#EF4444'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Purpose Breakdown */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Purpose Breakdown</h3>
          <div className="h-64">
            {chartData.purposeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.purposeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="purpose"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
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

        {/* Daily Trend */}
        {chartData.dailyTrendData.length > 0 && (
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Cash Flow Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.dailyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name === 'inflow' ? 'Inflow' : name === 'outflow' ? 'Outflow' : 'Net Flow']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line type="monotone" dataKey="inflow" stroke="#10B981" strokeWidth={2} name="inflow" />
                  <Line type="monotone" dataKey="outflow" stroke="#EF4444" strokeWidth={2} name="outflow" />
                  <Line type="monotone" dataKey="netFlow" stroke="#3B82F6" strokeWidth={2} name="netFlow" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Transactions List
              {hasFilters && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({totalRecords} filtered)
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-600 mt-1">
              Showing {Math.min(recordsPerPage, Math.max(0, totalRecords - (currentPage - 1) * recordsPerPage))} of {totalRecords} transactions
            </div>
          </div>

          {hasData && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              showInfo={false}
            />
          )}
        </div>

        {!hasData ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {hasFilters
                ? 'No transactions found matching your filters'
                : 'No cash flow records added yet.'}
            </div>
            {!hasFilters && (
              <NoRecordsAddButtonLayout>
                <AddButton
                  title="Add First Transaction"
                  onClick={onAdd}
                  icon={<PlusIcon className="h-4 w-4 mr-2" />}
                />
              </NoRecordsAddButtonLayout>
            )}
          </div>
        ) : (
          <Table headers={[...columns.map(col => col.label), 'Actions']}>
            {cashFlowData.map((record) => (
              <Table.Row key={record.id}>
                {columns.map((column) => (
                  <Table.Cell key={`${record.id}-${column.key}`}>
                    {column.format
                      ? column.format(record[column.key], record)
                      : record[column.key] || '-'}
                  </Table.Cell>
                ))}
                <Table.Cell>
                  <ActionButtons
                    onEdit={() => onEdit(record)}
                    onDelete={() => onDelete(record.id)}
                    editTitle="Edit Transaction"
                    deleteTitle="Delete Transaction"
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={onModalClose}
        title={editingRecord ? 'Edit Transaction' : 'Add Transaction'}
        icon={BanknotesIcon}
        iconBgColor={editingRecord ? 'bg-green-100' : 'bg-blue-100'}
        iconColor={editingRecord ? 'text-green-600' : 'text-blue-600'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaction Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.transaction_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {formErrors.transaction_date && (
                <p className="mt-1 text-sm text-red-600">{formErrors.transaction_date}</p>
              )}
            </div>

            {/* Flow Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flow Type *
              </label>
              <select
                name="cash_type"
                value={formData.cash_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="in_flow">In Flow</option>
                <option value="out_flow">Out Flow</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sundry">Sundry</option>
                <option value="person">Person</option>
              </select>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Purpose</option>
                {filteredPurposeOptions.map(option => (
                  <option key={`${option.value}-${option.cash_type}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Link to Contact - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Contact (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  onFocus={() => setShowDoctorDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDoctorDropdown(false), 200)}
                  placeholder="Search doctor / chemist..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showDoctorDropdown && doctorSearch && doctors.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                    {doctors.map(d => {
                      const isChemist = d.contact_type === 'chemist';
                      return (
                        <div
                          key={d.id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, doctor_id: d.id }));
                            setDoctorSearch(d.name);
                            setShowDoctorDropdown(false);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-50 flex justify-between items-center border-b last:border-b-0"
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-900">{d.name}</span>
                            {(isChemist ? d.hospital : d.specialization) && (
                              <span className="text-xs text-gray-500 ml-2">
                                • {isChemist ? d.hospital : d.specialization}
                              </span>
                            )}
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            isChemist ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {isChemist ? 'Chemist' : 'Doctor'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {formData.doctor_id && (
                  <p className="mt-1 text-xs text-green-600 flex items-center justify-between">
                    <span>✓ Linked to contact</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, doctor_id: '' }));
                        setDoctorSearch('');
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Clear
                    </button>
                  </p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Optionally link this transaction to a doctor or chemist for better tracking.
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Person name or sundry item description"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onModalClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                editingRecord
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {submitting
                ? 'Saving...'
                : `${editingRecord ? 'Update' : 'Add'} Transaction`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CashFlow;