import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import EditVisit from './EditVisit';
import { addStockTransaction, updateProductStock, TRANSACTION_TYPES, calculateStockSummary } from '../../../utils/stockUtils';

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
    quantity: '',
    unit_price: ''
  })
  const [currentStock, setCurrentStock] = useState(null);

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

  const formatDoctorDisplay = (doctor) => {
    const isChemist = doctor.contact_type === 'chemist';
    if (isChemist) {
      return `${doctor.name}${doctor.hospital ? ` - ${doctor.hospital}` : ''} [Chemist]`;
    }
    return `${doctor.name}${doctor.specialization ? ` - ${doctor.specialization}` : ''}${doctor.doctor_type ? ` (${doctor.doctor_type}` : ''}${doctor.doctor_class ? ` - ${doctor.doctor_class})` : doctor.doctor_type ? ')' : ''}`;
  };

  const setInitialDoctorSearch = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      setDoctorSearch(formatDoctorDisplay(doctor));
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
        .select('id, name, specialization, hospital, doctor_type, doctor_class, contact_type')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      showError('Error loading contacts');
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = doctorSearch.toLowerCase();
    const isChemist = doctor.contact_type === 'chemist';
    
    return (
      doctor.name.toLowerCase().includes(searchLower) ||
      doctor.hospital?.toLowerCase().includes(searchLower) ||
      (!isChemist && doctor.specialization?.toLowerCase().includes(searchLower)) ||
      (!isChemist && doctor.doctor_type?.toLowerCase().includes(searchLower)) ||
      (!isChemist && doctor.doctor_class?.toLowerCase().includes(searchLower))
    );
  });

  const handleDoctorSelect = (doctor) => {
    setFormData(prev => ({ ...prev, doctor_id: doctor.id }));
    setDoctorSearch(formatDoctorDisplay(doctor));
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
        .select('id, name, price, current_stock')
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

  const handleSaleChange = async (e) => {
    const { name, value } = e.target;
    setNewSale(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unit_price'
        ? value
        : value
    }));

    if (name === 'product_id' && value) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const stockSummary = await calculateStockSummary(value, today);
        setCurrentStock(stockSummary.closingStock);
      } catch (error) {
        console.error('Error checking stock:', error);
        setCurrentStock(null);
      }
    }
  };

  const addSale = () => {
    const quantity = parseFloat(newSale.quantity);
    const unit_price = parseFloat(newSale.unit_price);

    if (!newSale.product_id || !newSale.quantity || isNaN(quantity) || quantity <= 0 || !newSale.unit_price || isNaN(unit_price) || unit_price <= 0) {
      showError('Please fill in all sale details');
      return;
    }

    if (currentStock !== null && quantity > currentStock) {
      showError(`Insufficient stock. Available: ${currentStock}`);
      return;
    }

    const product = products.find(p => p.id === newSale.product_id);
    const total_amount = quantity * unit_price;

    setSales(prev => [...prev, {
      id: Date.now(),
      product_id: newSale.product_id,
      quantity: quantity,
      unit_price: unit_price,
      total_amount,
      product_name: product?.name
    }]);

    setNewSale({
      product_id: '',
      quantity: '',
      unit_price: ''
    });
    setCurrentStock(null);
  };

  const removeSale = (index) => {
    setSales(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctor_id) {
      showError('Please select a contact');
      return;
    }

    setSaving(true);

    try {
      // Get original sales for stock reversal
      const { data: originalSales, error: originalSalesError } = await supabase
        .from('sales')
        .select('*')
        .eq('visit_id', id);

      if (originalSalesError) throw originalSalesError;

      // Update visit
      const { error: visitError } = await supabase
        .from('visits')
        .update(formData)
        .eq('id', id);

      if (visitError) throw visitError;

      // Reverse original stock transactions
      for (const originalSale of originalSales || []) {
        await addStockTransaction({
          product_id: originalSale.product_id,
          transaction_type: TRANSACTION_TYPES.ADJUSTMENT,
          quantity: originalSale.quantity,
          transaction_date: formData.visit_date,
          reference_type: 'visit_edit_reversal',
          reference_id: id,
          notes: `Stock reversal for visit edit - Original sale quantity: ${originalSale.quantity}`
        });
      }

      // Delete all existing sales for this visit
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('visit_id', id);

      if (deleteError) throw deleteError;

      // Insert the current sales and create new stock transactions
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

        // Add new stock transactions for each sale
        for (const sale of sales) {
          await addStockTransaction({
            product_id: sale.product_id,
            transaction_type: TRANSACTION_TYPES.SALE,
            quantity: -sale.quantity,
            transaction_date: formData.visit_date,
            reference_type: 'visit',
            reference_id: id,
            notes: `Updated sale via visit edit to contact ID: ${formData.doctor_id}`
          });
        }
      }

      // Update current stock for all affected products
      const allAffectedProducts = new Set([
        ...(originalSales || []).map(s => s.product_id),
        ...sales.map(s => s.product_id)
      ]);

      for (const productId of allAffectedProducts) {
        await updateProductStock(productId);
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
        currentStock={currentStock}
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