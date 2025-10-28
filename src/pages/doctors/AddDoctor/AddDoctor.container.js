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
    contact_type: 'doctor', // Default to doctor
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
    
    // If contact_type changes to chemist, clear doctor-specific fields
    if (name === 'contact_type' && value === 'chemist') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        specialization: '',
        doctor_class: '',
        doctor_type: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data - set doctor-specific fields to null for chemists
      const dataToInsert = {
        ...formData,
        specialization: formData.contact_type === 'chemist' ? null : formData.specialization,
        doctor_class: formData.contact_type === 'chemist' ? null : formData.doctor_class,
        doctor_type: formData.contact_type === 'chemist' ? null : formData.doctor_type
      };

      const { error } = await supabase
        .from('doctors')
        .insert([dataToInsert]);

      if (error) throw error;

      showSuccess(`${formData.contact_type === 'chemist' ? 'Chemist' : 'Doctor'} added successfully!`);
      navigate('/doctors');
    } catch (error) {
      console.error('Error adding contact:', error);
      showError('Error adding contact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const CONTACT_TYPES = [
    { value: 'doctor', label: 'Doctor' },
    { value: 'chemist', label: 'Chemist' }
  ];

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
      label: formData.contact_type === 'chemist' ? 'Chemist/Shop Name' : 'Doctor Name',
      type: 'text',
      required: true,
      placeholder: formData.contact_type === 'chemist' 
        ? "Enter chemist or shop name" 
        : "Enter doctor's full name",
      colSpan: 'md:col-span-2'
    },
    {
      name: 'contact_type',
      label: 'Contact Type',
      type: 'select',
      required: true,
      options: CONTACT_TYPES
    },
    {
      name: 'hospital',
      label: formData.contact_type === 'chemist' ? 'Shop Location' : 'Hospital/Clinic',
      type: 'text',
      placeholder: formData.contact_type === 'chemist' 
        ? 'Shop or pharmacy location' 
        : 'Hospital or clinic name'
    },
    // Conditional fields - only show for doctors
    ...(formData.contact_type === 'doctor' ? [
      {
        name: 'specialization',
        label: 'Specialization',
        type: 'text',
        placeholder: 'e.g., Cardiology, Neurology'
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
      }
    ] : []),
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