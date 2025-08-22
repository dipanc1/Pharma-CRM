import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import AddDoctor from './AddDoctor';

function AddDoctorContainer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
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
        .from('doctors')
        .insert([{
          ...formData
        }]);

      if (error) throw error;

      showSuccess('Doctor added successfully!');
      setTimeout(() => {
        navigate('/doctors');
      }, 1500);
    } catch (error) {
      console.error('Error adding doctor:', error);
      showError('Error adding doctor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const DOCTOR_CLASSES = [
    { value: '', label: 'Select Class' },
    { value: 'A', label: 'Class A' },
    { value: 'B', label: 'Class B' },
    { value: 'C', label: 'Class C' }
  ];

  const DOCTOR_TYPES = [
    { value: '', label: 'Select Type' },
    { value: 'dispenser', label: 'Dispenser' },
    { value: 'prescriber', label: 'Prescriber' }
  ];

  const FORM_FIELDS = [
    {
      name: 'name',
      label: 'Doctor Name',
      type: 'text',
      required: true,
      placeholder: "Enter doctor's full name",
      colSpan: 'md:col-span-2'
    },
    {
      name: 'specialization',
      label: 'Specialization',
      type: 'text',
      placeholder: 'e.g., Cardiology, Neurology'
    },
    {
      name: 'hospital',
      label: 'Hospital/Clinic',
      type: 'text',
      placeholder: 'Hospital or clinic name'
    },
    {
      name: 'doctor_class',
      label: 'Doctor Class',
      type: 'select',
      options: DOCTOR_CLASSES
    },
    {
      name: 'doctor_type',
      label: 'Doctor Type',
      type: 'select',
      options: DOCTOR_TYPES
    },
    {
      name: 'contact_number',
      label: 'Contact Number',
      type: 'tel',
      placeholder: 'Phone number'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Email address'
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Full address',
      rows: 3,
      colSpan: 'md:col-span-2'
    }
  ];

  return (
    <>
      <AddDoctor
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

export default AddDoctorContainer;
