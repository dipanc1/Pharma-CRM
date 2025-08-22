import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { BackEditTitleAndButton, FilterSelect, Loader, SecondaryButton } from '../../../components';

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
            options={options}
            placeholder={`Select ${label}`}
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

function EditDoctor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    hospital: '',
    contact_number: '',
    email: '',
    address: '',
    doctor_class: '',
    doctor_type: ''
  });

  const classOptions = [
    { value: 'A', label: 'Class A' },
    { value: 'B', label: 'Class B' },
    { value: 'C', label: 'Class C' }
  ];

  const typeOptions = [
    { value: 'dispenser', label: 'Dispenser' },
    { value: 'prescriber', label: 'Prescriber' }
  ];

  const FORM_FIELDS = [
    { name: 'name', label: 'Doctor Name', type: 'text', required: true, placeholder: "Enter doctor's full name", colSpan: 'md:col-span-2' },
    { name: 'specialization', label: 'Specialization', type: 'text', placeholder: 'e.g., Cardiology, Neurology' },
    { name: 'hospital', label: 'Hospital/Clinic', type: 'text', placeholder: 'Hospital or clinic name' },
    { name: 'doctor_class', label: 'Doctor Class', type: 'select', options: classOptions },
    { name: 'doctor_type', label: 'Doctor Type', type: 'select', options: typeOptions },
    { name: 'contact_number', label: 'Contact Number', type: 'tel', placeholder: 'Phone number' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Email address' },
    { name: 'address', label: 'Address', type: 'textarea', rows: 3, placeholder: 'Full address', colSpan: 'md:col-span-2' }
  ];

  useEffect(() => {
    fetchDoctor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        specialization: data.specialization || '',
        hospital: data.hospital || '',
        contact_number: data.contact_number || '',
        email: data.email || '',
        address: data.address || '',
        doctor_class: data.doctor_class || '',
        doctor_type: data.doctor_type || ''
      });
    } catch (error) {
      console.error('Error fetching doctor:', error);
      alert('Error loading doctor details');
      navigate('/doctors');
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
        .from('doctors')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      alert('Doctor updated successfully!');
      navigate(`/doctors/${id}`);
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('Error updating doctor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackEditTitleAndButton title="Edit Doctor" backButtonPath={`/doctors/${id}`} />

      {/* Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FORM_FIELDS.map(field => 
              <FormField key={field.name} field={field} formData={formData} handleChange={handleChange} />
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <SecondaryButton link={`/doctors/${formData.id}`}>
              Cancel
            </SecondaryButton>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDoctor;