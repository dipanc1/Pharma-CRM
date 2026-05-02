import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast, VoiceCommandButton, VoiceConfirmationModal } from '../../../components';
import useToast from '../../../hooks/useToast';
import useVoiceCommand from '../../../hooks/useVoiceCommand';
import { VOICE_CONTEXTS } from '../../../config/voiceContexts';
import { fetchCompanies, formatCompaniesForSelect } from '../../../utils/companiesUtils';
import AddProduct from './AddProduct';

function AddProductContainer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    company_name: ''
  });

  // Fetch companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companies = await fetchCompanies();
      const options = formatCompaniesForSelect(companies);
      setCompaniesOptions(options);
    } catch (error) {
      console.error('Error loading companies:', error);
      showError('Error loading companies');
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
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          ...formData,
          price: parseFloat(formData.price) || 0
        }]);

      if (error) {
        showError('Error adding product. Please try again.');
        return;
      }
      showSuccess('Product added successfully!');
      navigate('/products');
    } catch (error) {
      console.error('Error adding product:', error);
      showError('Error adding product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      options: companiesOptions,
      placeholder: 'Select company'
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

  // ─── Voice Command Integration ─────────────────────────────
  const voiceContext = VOICE_CONTEXTS.addProduct;

  const handleVoiceConfirm = useCallback(async (data) => {
    const productData = {
      name: data.name || '',
      company_name: data.company_name || '',
      price: parseFloat(data.price) || 0,
      description: data.description || '',
    };

    if (!productData.name?.trim()) {
      throw new Error('Product name is required');
    }

    const { error } = await supabase.from('products').insert([productData]);
    if (error) throw error;

    showSuccess('Product added successfully via voice!');
    navigate('/products');
  }, [showSuccess, navigate]);

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
      <AddProduct
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

export default AddProductContainer;