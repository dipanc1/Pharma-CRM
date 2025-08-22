import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { BackTitleAndButton, SecondaryButton, FilterSelect } from '../../../components';

const FormField = ({ field, formData, handleChange }) => {
  const { name, label, type, required, placeholder, options, rows, colSpan = '' } = field;
  const value = formData[name] || '';

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <FilterSelect
            id={name}
            label=""
            value={value}
            onChange={handleChange}
            options={options.slice(1)} // Remove first "Select" option
            placeholder={options[0].label}
            className=""
          />
        );

      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            rows={rows}
            className="input-field"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            required={required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={name}
            name={name}
            min="0"
            step="0.01"
            className="input-field"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            required={required}
          />
        );

      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            className="input-field"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            required={required}
          />
        );
    }
  };

  return (
    <div className={colSpan}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      {renderInput()}
    </div>
  );
};

function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  });

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
      options: [
        { value: '', label: 'Select category' },
        { value: 'Antibiotics', label: 'Antibiotics' },
        { value: 'Pain Relief', label: 'Pain Relief' },
        { value: 'Cardiovascular', label: 'Cardiovascular' },
        { value: 'Diabetes', label: 'Diabetes' },
        { value: 'Respiratory', label: 'Respiratory' },
        { value: 'Vitamins', label: 'Vitamins' },
        { value: 'Supplements', label: 'Supplements' },
        { value: 'Other', label: 'Other' }
      ],
      placeholder: 'Select category'
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
      rows: 4,
      placeholder: 'Enter product description...',
      colSpan: 'md:col-span-2'
    }
  ];

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

      if (error) throw error;

      alert('Product added successfully!');
      navigate('/products');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackTitleAndButton title="Add New Product" backButtonPath="/products" />

      {/* Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FORM_FIELDS.map(field => 
              <FormField key={field.name} field={field} formData={formData} handleChange={handleChange} />
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <SecondaryButton link="/products">
              Cancel
            </SecondaryButton>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
