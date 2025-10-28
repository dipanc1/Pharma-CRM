import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import EditDoctor from './EditDoctor';

function EditDoctorContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    contact_type: 'doctor',
    specialization: '',
    hospital: '',
    contact_number: '',
    email: '',
    address: '',
    doctor_class: '',
    doctor_type: ''
  });

  const contactTypeOptions = [
    { value: 'doctor', label: 'Doctor' },
    { value: 'chemist', label: 'Chemist' }
  ];

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
    {
      name: 'name',
      label: formData.contact_type === 'chemist' ? 'Chemist/Shop Name' : 'Doctor Name',
      type: 'text',
      required: true,
      placeholder: formData.contact_type === 'chemist' 
        ? 'Enter chemist or shop name' 
        : "Enter doctor's full name",
      colSpan: 'md:col-span-2'
    },
    {
      name: 'contact_type',
      label: 'Contact Type',
      type: 'select',
      required: true,
      options: contactTypeOptions
    },
    {
      name: 'hospital',
      label: formData.contact_type === 'chemist' ? 'Shop Location' : 'Hospital/Clinic',
      type: 'text',
      placeholder: formData.contact_type === 'chemist' 
        ? 'Shop or pharmacy location' 
        : 'Hospital or clinic name'
    },
    // Conditional fields
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
        options: classOptions
      },
      {
        name: 'doctor_type',
        label: 'Doctor Type',
        type: 'select',
        options: typeOptions
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
        id: data.id,
        name: data.name || '',
        contact_type: data.contact_type || 'doctor',
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
      showError('Error loading contact details');
      setTimeout(() => {
        navigate('/doctors');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);

    try {
      // Prepare data - set doctor-specific fields to null for chemists
      const dataToUpdate = {
        ...formData,
        specialization: formData.contact_type === 'chemist' ? null : formData.specialization,
        doctor_class: formData.contact_type === 'chemist' ? null : formData.doctor_class,
        doctor_type: formData.contact_type === 'chemist' ? null : formData.doctor_type
      };

      const { error } = await supabase
        .from('doctors')
        .update(dataToUpdate)
        .eq('id', id);

      if (error) throw error;

      showSuccess(`${formData.contact_type === 'chemist' ? 'Chemist' : 'Doctor'} updated successfully!`);
      setTimeout(() => {
        navigate(`/doctors/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating contact:', error);
      showError('Error updating contact');
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    navigate(`/doctors/${id}`);
  };

  return (
    <>
      <EditDoctor
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loading={loading}
        saving={saving}
        onCancel={onCancel}
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

export default EditDoctorContainer;