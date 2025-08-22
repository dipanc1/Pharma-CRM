import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Loader, Toast } from '../../../components';
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
    category: ''
  });

  const PRODUCT_CATEGORIES = [
    { value: 'Antibiotics', label: 'Antibiotics' },
    { value: 'Pain Relief', label: 'Pain Relief' },
    { value: 'Cardiovascular', label: 'Cardiovascular' },
    { value: 'Diabetes', label: 'Diabetes' },
    { value: 'Respiratory', label: 'Respiratory' },
    { value: 'Vitamins', label: 'Vitamins' },
    { value: 'Supplements', label: 'Supplements' },
    { value: 'Other', label: 'Other' }
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
      name: 'category',
      label: 'Category',
      type: 'select',
      options: PRODUCT_CATEGORIES
    },
    {
      name: 'price',
      label: 'Price (₹)',
      type: 'number',
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

      if (error) throw error;

      setFormData({
        id: data.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price ? data.price.toString() : '',
        category: data.category || ''
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      showError('Error loading product details');
      setTimeout(() => {
        navigate('/products');
      }, 2000);
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

      if (error) throw error;

      showSuccess('Product updated successfully!');
      setTimeout(() => {
        navigate('/products');
      }, 1500);
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

  if (loading) {
    return <Loader />;
  }

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