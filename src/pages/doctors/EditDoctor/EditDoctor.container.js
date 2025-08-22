import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Loader, Toast } from '../../../components';
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
      options: classOptions
    },
    {
      name: 'doctor_type',
      label: 'Doctor Type',
      type: 'select',
      options: typeOptions
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
      showError('Error loading doctor details');
      setTimeout(() => {
        navigate('/doctors');
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
        .from('doctors')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      showSuccess('Doctor updated successfully!');
      setTimeout(() => {
        navigate(`/doctors/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating doctor:', error);
      showError('Error updating doctor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/doctors/${id}`);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <EditDoctor
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

export default EditDoctorContainer;