import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import EditVisit from './EditVisit';
import { addStockTransaction, updateProductStock, TRANSACTION_TYPES, calculateStockSummary } from '../../../utils/stockUtils';
import { generateInvoiceNumber } from '../../../utils/invoiceUtils';

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
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
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

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

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

    setSaving(true);

    try {
      // Pre-validate stock for new sales before any database operations
      if (sales.length > 0) {
        for (const sale of sales) {
          try {
            const stockSummary = await calculateStockSummary(sale.product_id, formData.visit_date);
            // For existing sales, we need to account for the quantity that will be restored
            const existingSale = sales.find(s => s.id === sale.id && s.id < 1000000000000); // Database IDs are smaller
            const adjustedStock = existingSale ? stockSummary.closingStock + existingSale.quantity : stockSummary.closingStock;
            
            if (adjustedStock < sale.quantity) {
              throw new Error(`Insufficient stock for ${sale.product_name}. Available: ${adjustedStock}, Required: ${sale.quantity}`);
            }
          } catch (stockError) {
            showError(`Stock validation failed: ${stockError.message}`);
            return;
          }
        }
      }

      // Get original sales for reference
      const { data: originalSales, error: originalSalesError } = await supabase
        .from('sales')
        .select('*')
        .eq('visit_id', id);

      if (originalSalesError) throw originalSalesError;

      const originalTotalAmount = (originalSales || []).reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

      // Generate invoice numbers early
      let reversalInvoiceNumber = null;
      let newInvoiceNumber = null;
      
      try {
        if (originalTotalAmount > 0) {
          reversalInvoiceNumber = await generateInvoiceNumber();
        }
        if (sales.length > 0) {
          newInvoiceNumber = await generateInvoiceNumber();
        }
      } catch (invoiceError) {
        console.error('Invoice generation error:', invoiceError);
        showError('Failed to generate invoice numbers. Please try again.');
        return;
      }

      // Update visit
      const { error: visitError } = await supabase
        .from('visits')
        .update(formData)
        .eq('id', id);

      if (visitError) throw visitError;

      // Reverse original stock transactions
      for (const originalSale of originalSales || []) {
        try {
          await addStockTransaction({
            product_id: originalSale.product_id,
            transaction_type: TRANSACTION_TYPES.SALE_REVERSAL,
            quantity: originalSale.quantity,
            transaction_date: formData.visit_date,
            reference_type: 'visit_edit_reversal',
            reference_id: id,
            notes: `Sale reversal for visit edit - Restoring ${originalSale.quantity} units`
          });
        } catch (stockError) {
          console.error('Stock reversal error:', stockError);
          throw new Error(`Failed to reverse stock for original sale`);
        }
      }

      // Create reversal ledger entry if there were original sales
      if (originalTotalAmount > 0 && reversalInvoiceNumber) {
        const { error: reversalLedgerError } = await supabase.from('ledger_entries').insert({
          doctor_id: formData.doctor_id,
          entry_date: formData.visit_date,
          source_type: 'visit',
          source_id: id,
          description: `Reversal of original visit sales - ₹${originalTotalAmount.toFixed(2)} (Invoice: ${reversalInvoiceNumber})`,
          debit: 0,
          credit: originalTotalAmount, // CREDIT - Reducing customer debt
          invoice_number: reversalInvoiceNumber
        });

        if (reversalLedgerError) {
          console.error('Reversal ledger error:', reversalLedgerError);
          throw new Error('Failed to create reversal ledger entry');
        }
      }

      // Delete all existing sales for this visit (but keep ledger history)
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('visit_id', id);

      if (deleteError) throw deleteError;

      // Insert the current sales and create new transactions
      if (sales.length > 0 && newInvoiceNumber) {
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

        // Create new ledger entry for updated sales
        const totalSalesAmount = sales.reduce((sum, s) => sum + s.total_amount, 0);
        
        const { error: newLedgerError } = await supabase.from('ledger_entries').insert({
          doctor_id: formData.doctor_id,
          entry_date: formData.visit_date,
          source_type: 'visit',
          source_id: id,
          description: `Updated sales from visit - ${sales.length} items (Invoice: ${newInvoiceNumber})`,
          debit: totalSalesAmount, // DEBIT - Customer owes us money for new sales
          credit: 0,
          invoice_number: newInvoiceNumber
        });

        if (newLedgerError) {
          console.error('New ledger error:', newLedgerError);
          throw new Error('Failed to create new ledger entry');
        }

        // Add new stock transactions for each sale
        for (const sale of sales) {
          try {
            await addStockTransaction({
              product_id: sale.product_id,
              transaction_type: TRANSACTION_TYPES.SALE,
              quantity: -sale.quantity,
              transaction_date: formData.visit_date,
              reference_type: 'visit',
              reference_id: id,
              notes: `Updated sale via visit edit - Invoice: ${newInvoiceNumber}`
            });
          } catch (stockError) {
            console.error('New stock transaction error:', stockError);
            throw new Error(`Failed to update stock for ${sale.product_name}`);
          }
        }
      }

      // Update current stock for all affected products
      const allAffectedProducts = new Set([
        ...(originalSales || []).map(s => s.product_id),
        ...sales.map(s => s.product_id)
      ]);

      for (const productId of allAffectedProducts) {
        try {
          await updateProductStock(productId);
        } catch (stockError) {
          console.error('Product stock update error:', stockError);
          // Don't throw here as this is cleanup - log and continue
        }
      }

      const successMessage = `Visit updated successfully! ${newInvoiceNumber ? `New Invoice: ${newInvoiceNumber}` : ''}`;
      showSuccess(successMessage);
      setTimeout(() => {
        navigate(`/visits/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating visit:', error);
      showError(error.message || 'Error updating visit. Please try again.');
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
        productSearch={productSearch}
        handleProductSearchChange={handleProductSearchChange}
        showProductDropdown={showProductDropdown}
        setShowProductDropdown={setShowProductDropdown}
        filteredProducts={filteredProducts}
        handleProductSelect={handleProductSelect}
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