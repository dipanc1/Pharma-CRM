import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import EditVisit from './EditVisit';

function EditVisitContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    doctor_id: '',
    visit_date: '',
    notes: '',
    status: 'completed'
  });
  const [sales, setSales] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
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

  useEffect(() => {
    if (doctors.length > 0) {
      fetchVisitData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, id]);

  const setInitialDoctorSearch = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      setDoctorSearch(`${doctor.name} - ${doctor.specialization} (${doctor.doctor_type} - ${doctor.doctor_class})`);
    }
  };

  const fetchVisitData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          sales (
            id,
            product_id,
            quantity,
            unit_price,
            total_amount,
            products (name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        doctor_id: data.doctor_id,
        visit_date: data.visit_date,
        notes: data.notes || '',
        status: data.status
      });

      // Set existing sales
      const existingSales = data.sales?.map(sale => ({
        id: sale.id,
        product_id: sale.product_id,
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        total_amount: sale.total_amount,
        product_name: sale.products?.name
      })) || [];

      setSales(existingSales);

      // Set initial doctor search after both visit data and doctors are loaded
      if (data.doctor_id && doctors.length > 0) {
        setInitialDoctorSearch(data.doctor_id);
      }

    } catch (error) {
      console.error('Error fetching visit data:', error);
      showError('Error loading visit details');
      navigate('/visits');
    } finally {
      setLoading(false);
    }
  };

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

  // Add these new functions
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
      id: Date.now(), // temporary ID for new sales
      product_id: newSale.product_id,
      quantity: newSale.quantity,
      unit_price: newSale.unit_price,
      total_amount,
      product_name: product?.name
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

    setSaving(true);

    try {
      // Update visit
      const { error: visitError } = await supabase
        .from('visits')
        .update(formData)
        .eq('id', id);

      if (visitError) throw visitError;

      // Handle sales updates
      // First, delete all existing sales for this visit
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('visit_id', id);

      if (deleteError) throw deleteError;

      // Then insert the current sales
      if (sales.length > 0) {
        const salesData = sales.map(sale => ({
          visit_id: id,
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

      showSuccess('Visit updated successfully!');
      setTimeout(() => {
        navigate(`/visits/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating visit:', error);
      showError('Error updating visit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/visits/${id}`);
  };

  const totalSalesAmount = sales.reduce((total, sale) => total + sale.total_amount, 0);

  return (
    <>
      <EditVisit
        formData={formData}
        handleFormChange={handleFormChange}
        handleSubmit={handleSubmit}
        loading={loading}
        saving={saving}
        onCancel={handleCancel}
        doctors={doctors}
        products={products}
        sales={sales}
        newSale={newSale}
        handleSaleChange={handleSaleChange}
        addSale={addSale}
        removeSale={removeSale}
        totalSalesAmount={totalSalesAmount}
        doctorSearch={doctorSearch}
        handleDoctorSearchChange={handleDoctorSearchChange}
        showDoctorDropdown={showDoctorDropdown}
        setShowDoctorDropdown={setShowDoctorDropdown}
        filteredDoctors={filteredDoctors}
        handleDoctorSelect={handleDoctorSelect}
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

export default EditVisitContainer;