import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import AddVisit from './AddVisit';

function AddVisitContainer() {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      showError('Error loading doctors');
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
      showError('Error loading products');
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
      <AddVisit
        formData={formData}
        handleFormChange={handleFormChange}
        handleSubmit={handleSubmit}
        loading={loading}
        doctors={doctors}
        products={products}
        doctorSearch={doctorSearch}
        setDoctorSearch={setDoctorSearch}
        handleDoctorSearchChange={handleDoctorSearchChange}
        showDoctorDropdown={showDoctorDropdown}
        setShowDoctorDropdown={setShowDoctorDropdown}
        filteredDoctors={filteredDoctors}
        handleDoctorSelect={handleDoctorSelect}
        sales={sales}
        newSale={newSale}
        handleSaleChange={handleSaleChange}
        addSale={addSale}
        removeSale={removeSale}
        totalSalesAmount={totalSalesAmount}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

export default AddVisitContainer;