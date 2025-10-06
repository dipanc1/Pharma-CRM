import React, { useState, useEffect } from 'react';
import { XMarkIcon, CubeIcon, PencilIcon } from '@heroicons/react/24/outline';

const AddStockModal = ({ isOpen, onClose, product, onSubmit, loading, mode = 'add', initialQuantity = 0 }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    notes: ''
  });

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit') {
        setFormData({
          quantity: initialQuantity.toString(),
          notes: ''
        });
      } else {
        setFormData({
          quantity: '',
          notes: ''
        });
      }
    }
  }, [isOpen, mode, initialQuantity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const quantity = parseInt(formData.quantity);

    if (mode === 'edit') {
      // For editing, we pass the new total quantity
      if (quantity >= 0) {
        onSubmit(quantity, formData.notes, 'edit');
        setFormData({ quantity: '', notes: '' });
      }
    } else {
      // For adding, we pass the quantity to add
      if (quantity > 0) {
        onSubmit(quantity, formData.notes, 'add');
        setFormData({ quantity: '', notes: '' });
      }
    }
  };

  const handleClose = () => {
    setFormData({ quantity: '', notes: '' });
    onClose();
  };

  if (!isOpen) return null;

  const isEditMode = mode === 'edit';
  const title = isEditMode ? `Edit Stock - ${product?.name}` : `Add Stock - ${product?.name}`;
  const buttonText = isEditMode ? 'Update Stock' : 'Add Stock';
  const quantityLabel = isEditMode ? 'Set Total Stock Quantity *' : 'Quantity to Add *';
  const placeholder = isEditMode ? 'Enter total stock quantity' : 'Enter quantity to add';
  const Icon = isEditMode ? PencilIcon : CubeIcon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${isEditMode ? 'bg-green-100' : 'bg-blue-100'} mr-3`}>
                  <Icon className={`h-5 w-5 ${isEditMode ? 'text-green-600' : 'text-blue-600'}`} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {title}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Product Info */}
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product?.name}</p>
                  <p className="text-xs text-gray-500">{product?.company_name || 'No company'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className={`text-lg font-bold ${initialQuantity <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {initialQuantity} units
                  </p>
                </div>
              </div>
            </div>

            {isEditMode && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Editing Stock:</strong> Enter the new total quantity you want to set for this product.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This will automatically calculate the adjustment needed.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  {quantityLabel}
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min={isEditMode ? "0" : "1"}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={placeholder}
                  value={formData.quantity}
                  onChange={handleChange}
                />
                {isEditMode && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Set to 0 to mark product as out of stock</p>
                    {formData.quantity && (
                      <p className="mt-1">
                        <strong>Change:</strong> {parseInt(formData.quantity) - initialQuantity > 0 ? '+' : ''}{parseInt(formData.quantity) - initialQuantity} units
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isEditMode ? "Enter notes about this stock update..." : "Enter notes about this stock addition..."}
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.quantity}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isEditMode
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditMode ? 'Updating...' : 'Adding...'}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {buttonText}
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStockModal;