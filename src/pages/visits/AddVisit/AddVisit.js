import React from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { 
  BackTitleAndButton, 
  SecondaryButton, 
  SearchInput,
  Table,
  FilterSelect,
  AddButton
} from '../../../components';

function AddVisit({
  formData,
  handleFormChange,
  handleSubmit,
  loading,
  products,
  doctorSearch,
  handleDoctorSearchChange,
  showDoctorDropdown,
  setShowDoctorDropdown,
  filteredDoctors,
  handleDoctorSelect,
  sales,
  newSale,
  handleSaleChange,
  addSale,
  removeSale,
  totalSalesAmount
}) {
  const tableHeaders = ['Product', 'Quantity', 'Unit Price', 'Total', 'Actions'];
  const productOptions = products.map(product => ({ 
    value: product.id, 
    label: `${product.name} - ₹${product.price}` 
  }));
  const statusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      {/* Header - Using BackTitleAndButton component */}
      <BackTitleAndButton title="Add New Visit" backButtonPath="/visits" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Visit Details */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Visit Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Doctor Search - Using SearchInput component */}
            <div className="md:col-span-2 relative">
              <SearchInput
                label="Doctor *"
                placeholder="Search for a doctor..."
                value={doctorSearch}
                onChange={handleDoctorSearchChange}
                onFocus={() => setShowDoctorDropdown(true)}
                id="doctor_search"
              />
              
              {showDoctorDropdown && doctorSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map(doctor => (
                      <div
                        key={doctor.id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        <div className="font-medium text-gray-900">{doctor.name}</div>
                        <div className="text-sm text-gray-600">
                          {doctor.specialization} • {doctor.doctor_type} • Class {doctor.doctor_class}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No doctors found</div>
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

            {/* Visit Date */}
            <div>
              <label htmlFor="visit_date" className="block text-sm font-medium text-gray-700 mb-2">
                Visit Date *
              </label>
              <input
                type="date"
                id="visit_date"
                name="visit_date"
                required
                className="input-field"
                value={formData.visit_date}
                onChange={handleFormChange}
              />
            </div>

            {/* Status - Using FilterSelect component */}
            <div>
              <FilterSelect
                label="Status"
                id="status"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                options={statusOptions}
                placeholder="Select status"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="input-field"
                placeholder="Enter visit notes..."
                value={formData.notes}
                onChange={handleFormChange}
              />
            </div>
          </div>
        </div>

        {/* Sales Section */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Items</h3>

          {/* Add Sale Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            
            {/* Product Selection - Using FilterSelect component */}
            <div>
              <FilterSelect
                label="Product"
                id="product_id"
                name="product_id"
                value={newSale.product_id}
                onChange={handleSaleChange}
                options={productOptions}
                placeholder="Select product"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                className="input-field"
                value={newSale.quantity}
                onChange={handleSaleChange}
              />
            </div>

            <div>
              <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price (₹)
              </label>
              <input
                type="number"
                id="unit_price"
                name="unit_price"
                min="0"
                step="0.01"
                className="input-field"
                value={newSale.unit_price}
                onChange={handleSaleChange}
              />
            </div>

            <div className="flex items-end">
              <div
                onClick={addSale}
                className="w-full"
              >
                <AddButton 
                  title="Add Item" 
                  link="#" 
                  icon={<PlusIcon className="h-4 w-4 mr-2" />}
                />
              </div>
            </div>
          </div>

          {/* Sales List - Using Table component */}
          {sales.length > 0 && (
            <div className="space-y-4">
              <Table headers={tableHeaders}>
                {sales.map((sale, index) => (
                  <Table.Row key={sale.id}>
                    <Table.Cell className="font-medium">
                      {sale.product_name}
                    </Table.Cell>
                    <Table.Cell>
                      {sale.quantity}
                    </Table.Cell>
                    <Table.Cell>
                      ₹{sale.unit_price.toFixed(2)}
                    </Table.Cell>
                    <Table.Cell className="font-medium">
                      ₹{sale.total_amount.toFixed(2)}
                    </Table.Cell>
                    <Table.Cell>
                      <button
                        type="button"
                        onClick={() => removeSale(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Remove item"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table>

              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  Total Sales: ₹{totalSalesAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {sales.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No sales items added yet. Use the form above to add products to this visit.
            </div>
          )}
        </div>

        {/* Submit Buttons - Using SecondaryButton component */}
        <div className="flex justify-end space-x-3">
          <SecondaryButton link="/visits">
            Cancel
          </SecondaryButton>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Visit'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddVisit;