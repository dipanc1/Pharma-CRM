import React, { useState } from 'react';
import Companies from './Companies';
import { addCompany, deleteCompany } from '../../utils/companiesUtils';
import useCompanies from '../../hooks/useCompanies';
import useToast from '../../hooks/useToast';

function CompaniesContainer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showSuccess, showError } = useToast();
  const { companies, refreshCompanies } = useCompanies();

  const handleAddCompany = async (formData) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await addCompany(formData.name, formData.description);
      
      if (result.success) {
        showSuccess(`Company "${formData.name}" added successfully!`);
        await refreshCompanies();
      }
    } catch (err) {
      console.error('Error adding company:', err);
      const errorMessage = err.message || 'Failed to add company';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await deleteCompany(companyId);
      
      if (result.success) {
        showSuccess('Company deleted successfully!');
        await refreshCompanies();
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      const errorMessage = err.message || 'Failed to delete company';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Companies
      companies={companies}
      onAdd={handleAddCompany}
      onDelete={handleDeleteCompany}
      loading={loading}
      error={error}
    />
  );
}

export default CompaniesContainer;
