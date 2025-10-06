import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import AddProduct from './AddProduct';

function AddProductContainer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    company_name: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          ...formData,
          price: parseFloat(formData.price) || 0
        }]);

      if (error) {
        showError('Error adding product. Please try again.');
        return;
      }
      showSuccess('Product added successfully!');
      navigate('/products');
    } catch (error) {
      console.error('Error adding product:', error);
      showError('Error adding product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const COMPANIES = [
    { value: 'LSB LIFE SCIENCES', label: 'LSB LIFE SCIENCES' },
    { value: 'FLOWRICH PHARMA', label: 'FLOWRICH PHARMA' },
    { value: 'CRANIX PHARMA', label: 'CRANIX PHARMA' },
    { value: 'BRVYMA', label: 'BRVYMA' }
  ];

  const FORM_FIELDS = [
    {
      name: 'name',
      label: 'Product Name',
      type: 'text',
      required: true,
      placeholder: 'Enter product name',
      colSpan: 'md:col-span-2'
    },
    {
      name: 'company_name',
      label: 'Company Name',
      type: 'select',
      required: true,
      options: COMPANIES,
      placeholder: 'Select company'
    },
    {
      name: 'price',
      label: 'Price (₹)',
      type: 'number',
      required: true,
      placeholder: '0.00'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter product description...',
      rows: 4,
      colSpan: 'md:col-span-2'
    }
  ];

  return (
    <>
      <AddProduct
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loading={loading}
        FORM_FIELDS={FORM_FIELDS}
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

export default AddProductContainer;