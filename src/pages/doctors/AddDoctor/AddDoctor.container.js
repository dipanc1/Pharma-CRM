import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import AddDoctor from './AddDoctor';

function AddDoctorContainer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeFromUrl = searchParams.get('type') || 'doctor';
  
  const [loading, setLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    contact_type: typeFromUrl, // Set from URL
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

      const contactLabel = formData.contact_type === 'chemist' ? 'Chemist' : 'Doctor';
      showSuccess(`${contactLabel} added successfully!`);
      navigate(`/doctors?type=${formData.contact_type}`);
    } catch (error) {
      console.error('Error adding contact:', error);
      showError('Error adding contact. Please try again.');
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

  const isChemist = formData.contact_type === 'chemist';

  const FORM_FIELDS = [
    {
      name: 'name',
      label: isChemist ? 'Chemist/Shop Name' : 'Doctor Name',
      type: 'text',
      required: true,
      placeholder: isChemist 
        ? "Enter chemist or shop name" 
        : "Enter doctor's full name",
      colSpan: 'md:col-span-2'
    },
    {
      name: 'hospital',
      label: isChemist ? 'Shop Location' : 'Hospital/Clinic',
      type: 'text',
      placeholder: isChemist 
        ? 'Shop or pharmacy location' 
        : 'Hospital or clinic name'
    },
    // Conditional fields - only show for doctors
    ...(!isChemist ? [
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

  const backPath = `/doctors?type=${formData.contact_type}`;

  return (
    <>
      <AddDoctor
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loading={loading}
        FORM_FIELDS={FORM_FIELDS}
        backPath={backPath}
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