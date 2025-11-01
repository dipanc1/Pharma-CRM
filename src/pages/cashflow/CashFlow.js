import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import {
  SearchInput,
  FilterSelect,
  FilterBadge,
  Table,
  Pagination,
  Loader,
  ActionButtons,
  StatusBadge,
  Modal
} from '../../components/common';
import { NoRecordsAddButtonLayout } from '../common/NoRecordsAddButtonLayout';

const CashFlow = ({
  cashFlowData,
  loading,
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
  const [formData, setFormData] = useState(
    editingRecord || {
      transaction_date: new Date().toISOString().split('T')[0],
      cash_type: 'out_flow',
      name: '',
      type: 'sundry',
      amount: '',
      purpose: 'expense',
      notes: ''
    }
  );

  React.useEffect(() => {
    if (editingRecord) {
      setFormData(editingRecord);
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
  }, [editingRecord, isModalOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const columns = [
    { key: 'transaction_date', label: 'Date', format: (value) => new Date(value).toLocaleDateString('en-IN') },
    {
      key: 'cash_type',
      label: 'Flow Type',
      format: (value) => (
        <StatusBadge
          status={value === 'in_flow' ? 'active' : 'inactive'}
          label={value === 'in_flow' ? 'In Flow' : 'Out Flow'}
        />
      )
    },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', format: (value) => value.charAt(0).toUpperCase() + value.slice(1) },
    { key: 'purpose', label: 'Purpose', format: (value) => value?.charAt(0).toUpperCase() + value?.slice(1) || '-' },
    { key: 'amount', label: 'Amount', format: (value) => `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { key: 'notes', label: 'Notes', format: (value) => value || '-' }
  ];

  const cashTypeOptions = [
    { value: '', label: 'All Flow Types' },
    { value: 'in_flow', label: 'In Flow' },
    { value: 'out_flow', label: 'Out Flow' }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'sundry', label: 'Sundry' },
    { value: 'person', label: 'Person' }
  ];

  const purposeOptions = [
    { value: '', label: 'All Purposes' },
    { value: 'expense', label: 'Expense' },
    { value: 'gift', label: 'Gift' },
    { value: 'payment', label: 'Payment' },
    { value: 'advance', label: 'Advance' },
    { value: 'debt_recovery', label: 'Debt Recovery' }
  ];

  const activeFilters = [
    filters.cashType && { key: 'cashType', label: `Flow: ${cashTypeOptions.find(o => o.value === filters.cashType)?.label}` },
    filters.type && { key: 'type', label: `Type: ${typeOptions.find(o => o.value === filters.type)?.label}` },
    filters.purpose && { key: 'purpose', label: `Purpose: ${purposeOptions.find(o => o.value === filters.purpose)?.label}` }
  ].filter(Boolean);

  if (loading) {
    return <Loader />;
  }

  if (cashFlowData.length === 0 && !filters.searchTerm && !filters.cashType && !filters.type && !filters.purpose) {
    return (
      <NoRecordsAddButtonLayout
        title="Cash Flow"
        message="No cash flow records found. Start by adding your first transaction."
        buttonText="Add Transaction"
        onAdd={onAdd}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cash Flow Management</h1>
        <p className="text-gray-600 mt-1">Track all cash inflows and outflows</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={filters.searchTerm}
              onChange={(value) => onFilterChange('searchTerm', value)}
              placeholder="Search by name..."
            />
          </div>
          <FilterSelect
            value={filters.cashType}
            onChange={(value) => onFilterChange('cashType', value)}
            options={cashTypeOptions}
          />
          <FilterSelect
            value={filters.type}
            onChange={(value) => onFilterChange('type', value)}
            options={typeOptions}
          />
          <FilterSelect
            value={filters.purpose}
            onChange={(value) => onFilterChange('purpose', value)}
            options={purposeOptions}
          />
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
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

      {/* Table */}
      {cashFlowData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No records found matching your filters</p>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={cashFlowData}
            actions={(record) => (
              <ActionButtons
                onEdit={() => onEdit(record)}
                onDelete={() => onDelete(record.id)}
              />
            )}
          />

          {/* Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              recordsPerPage={recordsPerPage}
              onPageChange={onPageChange}
            />
          </div>
        </>
      )}

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                editingRecord 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {editingRecord ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CashFlow;