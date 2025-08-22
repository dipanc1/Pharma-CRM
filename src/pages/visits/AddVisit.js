import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { BackTitleAndButton, Toast } from '../../components';
import useToast from '../../hooks/useToast';

function AddVisit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'completed'
  });
  const [sales, setSales] = useState([]);
  const [newSale, setNewSale] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0
  });

  useEffect(() => {
    fetchDoctors();
    fetchProducts();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, specialization, doctor_type, doctor_class')
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
        .select('id, name, price')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaleChange = (e) => {
    const { name, value } = e.target;
    setNewSale(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unit_price' ? parseFloat(value) || 0 : value
    }));
  };

  const addSale = () => {
    if (!newSale.product_id || newSale.quantity <= 0 || newSale.unit_price <= 0) {
      showError('Please fill in all sale details');
      return;
    }

    const product = products.find(p => p.id === newSale.product_id);
    const total_amount = newSale.quantity * newSale.unit_price;

    setSales(prev => [...prev, {
      ...newSale,
      id: Date.now(), // temporary ID
      product_name: product?.name,
      total_amount
    }]);

    setNewSale({
      product_id: '',
      quantity: 1,
      unit_price: 0
    });
  };

  const removeSale = (index) => {
    setSales(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctor_id) {
      showError('Please select a doctor');
      return;
    }

    setLoading(true);

    try {
      // Insert visit
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert([formData])
        .select()
        .single();

      if (visitError) throw visitError;

      // Insert sales if any
      if (sales.length > 0) {
        const salesData = sales.map(sale => ({
          visit_id: visit.id,
          product_id: sale.product_id,
          quantity: sale.quantity,
          unit_price: sale.unit_price,
          total_amount: sale.total_amount
        }));

        const { error: salesError } = await supabase
          .from('sales')
          .insert(salesData);

        if (salesError) throw salesError;
      }

      showSuccess('Visit added successfully!');
      setTimeout(() => {
        navigate('/visits');
      }, 1500);
    } catch (error) {
      console.error('Error adding visit:', error);
      showError('Error adding visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalSalesAmount = sales.reduce((total, sale) => total + sale.total_amount, 0);

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doctor.doctor_type?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doctor.doctor_class?.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const handleDoctorSelect = (doctor) => {
    setFormData(prev => ({ ...prev, doctor_id: doctor.id }));
    setDoctorSearch(`${doctor.name} - ${doctor.specialization} (${doctor.doctor_type} - ${doctor.doctor_class})`);
    setShowDoctorDropdown(false);
  };

  const handleDoctorSearchChange = (e) => {
    setDoctorSearch(e.target.value);
    setShowDoctorDropdown(true);
    if (!e.target.value) {
      setFormData(prev => ({ ...prev, doctor_id: '' }));
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <BackTitleAndButton title="Add New Visit" backButtonPath="/visits" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visit Details */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Visit Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doctor */}
              <div className="md:col-span-2 relative">
                <label htmlFor="doctor_search" className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor *
                </label>
                <input
                  type="text"
                  id="doctor_search"
                  className="input-field"
                  placeholder="Search for a doctor..."
                  value={doctorSearch}
                  onChange={handleDoctorSearchChange}
                  onFocus={() => setShowDoctorDropdown(true)}
                  autoComplete="off"
                />
                {showDoctorDropdown && (
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

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="input-field"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
              <div>
                <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  id="product_id"
                  name="product_id"
                  className="input-field"
                  value={newSale.product_id}
                  onChange={handleSaleChange}
                >
                  <option value="">Select product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₹{product.price}
                    </option>
                  ))}
                </select>
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
                <button
                  type="button"
                  onClick={addSale}
                  className="btn-primary w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Sales List */}
            {sales.length > 0 && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Product</th>
                        <th className="table-header">Quantity</th>
                        <th className="table-header">Unit Price</th>
                        <th className="table-header">Total</th>
                        <th className="table-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sales.map((sale, index) => (
                        <tr key={sale.id}>
                          <td className="table-cell">{sale.product_name}</td>
                          <td className="table-cell">{sale.quantity}</td>
                          <td className="table-cell">₹{sale.unit_price.toFixed(2)}</td>
                          <td className="table-cell font-medium">₹{sale.total_amount.toFixed(2)}</td>
                          <td className="table-cell">
                            <button
                              type="button"
                              onClick={() => removeSale(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    Total Sales: ₹{totalSalesAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/visits')}
              className="btn-secondary"
            >
              Cancel
            </button>
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
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

export default AddVisit;
