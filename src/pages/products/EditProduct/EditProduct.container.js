import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import EditProduct from './EditProduct';

function EditProductContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    company_name: ''
  });

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
      options: COMPANIES
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

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        showError('Error fetching product details');
        navigate('/products');
        return;
      }

      setFormData({
        id: data.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price ? data.price.toString() : '',
        company_name: data.company_name || ''
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      showError('Error loading product details');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...formData,
          price: parseFloat(formData.price) || 0
        })
        .eq('id', id);

      if (error) {
        showError('Error updating product. Please try again.');
        return;
      }

      showSuccess('Product updated successfully!');
      navigate('/products');
    } catch (error) {
      console.error('Error updating product:', error);
      showError('Error updating product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <>
      <EditProduct
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loading={loading}
        saving={saving}
        onCancel={handleCancel}
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

export default EditProductContainer;