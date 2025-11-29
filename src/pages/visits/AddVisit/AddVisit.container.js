import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import AddVisit from './AddVisit';
import { addStockTransaction, updateProductStock, TRANSACTION_TYPES, calculateStockSummary } from '../../../utils/stockUtils';
import { generateInvoiceNumber } from '../../../utils/invoiceUtils';

function AddVisitContainer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'completed'
  });
  const [sales, setSales] = useState([]);
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

  const handleProductSearchChange = (e) => {
    setProductSearch(e.target.value);
    setShowProductDropdown(true);
    if (!e.target.value) {
      setNewSale(prev => ({ ...prev, product_id: '' }));
      setCurrentStock(null);
    }
  };

  const handleProductSelect = async (product) => {
    setNewSale(prev => ({ 
      ...prev, 
      product_id: product.id,
      unit_price: product.price.toString()
    }));
    setProductSearch(`${product.name} - ₹${product.price} (Stock: ${product.current_stock || 0})`);
    setShowProductDropdown(false);

    try {
      const today = new Date().toISOString().split('T')[0];
      const stockSummary = await calculateStockSummary(product.id, today);
      setCurrentStock(stockSummary.closingStock);
    } catch (error) {
      console.error('Error checking stock:', error);
      setCurrentStock(null);
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
    setProductSearch('');
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

    setLoading(true);

    try {
      // Insert visit
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert([formData])
        .select()
        .single();

      if (visitError) throw visitError;

      // Insert sales and update stock if any
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

        const totalSalesAmount = sales.reduce((sum, s) => sum + s.total_amount, 0);
        
        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber();
        
        // Create ledger entry for the sale (DEBIT - Customer owes us money)
        await supabase.from('ledger_entries').insert({
          doctor_id: formData.doctor_id,
          entry_date: formData.visit_date,
          source_type: 'visit',
          source_id: visit.id,
          description: `Sales from visit - ${sales.length} items (Invoice: ${invoiceNumber})`,
          debit: totalSalesAmount,
          credit: 0,
          invoice_number: invoiceNumber
        });

        // Add stock transactions for each sale
        for (const sale of sales) {
          await addStockTransaction({
            product_id: sale.product_id,
            transaction_type: TRANSACTION_TYPES.SALE,
            quantity: -sale.quantity, // Negative for sale
            transaction_date: formData.visit_date,
            reference_type: 'visit',
            reference_id: visit.id,
            notes: `Sale via visit to contact ID: ${formData.doctor_id} - Invoice: ${invoiceNumber}`
          });

          // Update current stock in products table
          await updateProductStock(sale.product_id);
        }
      }

      showSuccess('Visit added successfully!');
      navigate('/visits');
    } catch (error) {
      console.error('Error adding visit:', error);
      showError('Error adding visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalSalesAmount = sales.reduce((total, sale) => total + sale.total_amount, 0);

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

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleDoctorSearchChange = (e) => {
    setDoctorSearch(e.target.value);
    setShowDoctorDropdown(true);
    if (!e.target.value) {
      setFormData(prev => ({ ...prev, doctor_id: '' }));
    }
  };

  const formatDoctorDisplay = (doctor) => {
    const isChemist = doctor.contact_type === 'chemist';
    if (isChemist) {
      return `${doctor.name}${doctor.hospital ? ` - ${doctor.hospital}` : ''} [Chemist]`;
    }
    return `${doctor.name}${doctor.specialization ? ` - ${doctor.specialization}` : ''}${doctor.doctor_type ? ` (${doctor.doctor_type}` : ''}${doctor.doctor_class ? ` - ${doctor.doctor_class})` : doctor.doctor_type ? ')' : ''}`;
  };

  const handleDoctorSelect = (doctor) => {
    setFormData(prev => ({ ...prev, doctor_id: doctor.id }));
    setDoctorSearch(formatDoctorDisplay(doctor));
    setShowDoctorDropdown(false);
  };

  return (
    <>
      <AddVisit
        formData={formData}
        handleFormChange={handleFormChange}
        handleSubmit={handleSubmit}
        loading={loading}
        doctorSearch={doctorSearch}
        setDoctorSearch={setDoctorSearch}
        handleDoctorSearchChange={handleDoctorSearchChange}
        showDoctorDropdown={showDoctorDropdown}
        setShowDoctorDropdown={setShowDoctorDropdown}
        filteredDoctors={filteredDoctors}
        handleDoctorSelect={handleDoctorSelect}
        productSearch={productSearch}
        handleProductSearchChange={handleProductSearchChange}
        showProductDropdown={showProductDropdown}
        setShowProductDropdown={setShowProductDropdown}
        filteredProducts={filteredProducts}
        handleProductSelect={handleProductSelect}
        sales={sales}
        newSale={newSale}
        handleSaleChange={handleSaleChange}
        addSale={addSale}
        removeSale={removeSale}
        totalSalesAmount={totalSalesAmount}
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

export default AddVisitContainer;