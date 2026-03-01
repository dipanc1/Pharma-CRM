import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast, VoiceCommandButton, VoiceConfirmationModal } from '../../../components';
import useToast from '../../../hooks/useToast';
import useVoiceCommand from '../../../hooks/useVoiceCommand';
import { VOICE_CONTEXTS } from '../../../config/voiceContexts';
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

  // ─── Voice Command Integration ─────────────────────────────
  const voiceContext = VOICE_CONTEXTS.addDoctor;

  const handleVoiceConfirm = useCallback(async (data) => {
    const contactType = data.contact_type || formData.contact_type;
    const isChemist = contactType === 'chemist';

    const dataToInsert = {
      name: data.name || '',
      contact_type: contactType,
      specialization: isChemist ? null : (data.specialization || null),
      hospital: data.hospital || null,
      contact_number: data.contact_number || null,
      email: data.email || null,
      address: data.address || null,
      doctor_class: isChemist ? null : (data.doctor_class || null),
      doctor_type: isChemist ? null : (data.doctor_type || null),
    };

    if (!dataToInsert.name?.trim()) {
      throw new Error('Name is required');
    }

    const { error } = await supabase.from('doctors').insert([dataToInsert]);
    if (error) throw error;

    const label = isChemist ? 'Chemist' : 'Doctor';
    showSuccess(`${label} added successfully via voice!`);
    navigate(`/doctors?type=${contactType}`);
  }, [formData.contact_type, showSuccess, navigate]);

  const voice = useVoiceCommand({
    pageContext: voiceContext,
    existingData: {},
    onConfirm: handleVoiceConfirm,
  });

  const handleVoiceToggle = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

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
      <VoiceCommandButton
        isListening={voice.isListening}
        isProcessing={voice.isProcessing}
        isSupported={voice.isSupported}
        isConfigured={voice.isConfigured}
        onClick={handleVoiceToggle}
      />
      <VoiceConfirmationModal
        isOpen={!voice.isIdle}
        state={voice.state}
        transcript={voice.transcript}
        interimTranscript={voice.interimTranscript}
        parsedData={voice.parsedData}
        error={voice.error}
        fieldLabels={voiceContext.fieldLabels}
        fieldOrder={voiceContext.fieldOrder}
        onConfirm={voice.confirmData}
        onConfirmEdited={voice.confirmEditedData}
        onRetry={voice.retryListening}
        onCancel={voice.reset}
        onStopListening={voice.stopListening}
      />
    </>
  );
}

export default AddDoctorContainer;