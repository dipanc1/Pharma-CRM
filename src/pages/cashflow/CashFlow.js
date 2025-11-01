import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { BanknotesIcon } from '@heroicons/react/24/outline';
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
  onAdd,
  onEdit,
  onDelete,
  onSubmit,
  onModalClose,
  onFilterChange,
  onPageChange
}) => {
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    cash_type: 'out_flow',
    name: '',
    type: 'sundry',
    amount: '',
    purpose: 'expense',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});

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
          notes: editingRecord.notes || ''
        });
      } else {
        setFormData({
          transaction_date: new Date().toISOString().split('T')[0],
          cash_type: 'out_flow',
          name: '',
          type: 'sundry',
          amount: '',
          purpose: 'expense',
          notes: ''
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

    // Clear error when user starts typing
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
    { value: 'expense', label: 'Expense' },
    { value: 'gift', label: 'Gift' },
    { value: 'payment', label: 'Payment' },
    { value: 'advance', label: 'Advance' },
    { value: 'debt_recovery', label: 'Debt Recovery' }
  ];

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
        title="Cash Flow Management"
        description="Track all cash inflows and outflows"
        buttons={[
          {
            onClick: onAdd,
            icon: <PlusIcon className="h-4 w-4 mr-2" />,
            title: "Add Transaction"
          }
        ]}
      />

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SearchInput
            label="Search Transactions"
            placeholder="Search by name..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            id="transaction_search"
          />

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
                onRemove={() => onFilterChange(filter.key, '')}
              />
            ))}
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
                      ? column.format(record[column.key])
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.transaction_date ? 'border-red-300' : 'border-gray-300'
                  }`}
              />
              {formErrors.transaction_date && (
                <p className="mt-1 text-sm text-red-600">{formErrors.transaction_date}</p>
              )}
            </div>

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
                <option value="expense">Expense</option>
                <option value="gift">Gift</option>
                <option value="payment">Payment</option>
                <option value="advance">Advance</option>
                <option value="debt_recovery">Debt Recovery</option>
              </select>
            </div>
          </div>

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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
            />
            {formErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
            )}
          </div>

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
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${editingRecord
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