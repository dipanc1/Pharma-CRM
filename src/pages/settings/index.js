import React, { useState, useEffect } from 'react';
import Companies from './Companies';
import { fetchCompanies, addCompany, deleteCompany } from '../../utils/companiesUtils';
import useToast from '../../hooks/useToast';

function CompaniesContainer() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showSuccess, showError } = useToast();

  // Fetch companies on mount
  useEffect(() => {
    loadCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await fetchCompanies();
      setCompanies(data);
      setError('');
    } catch (err) {
      console.error('Error loading companies:', err);
      setError('Failed to load companies');
      showError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (formData) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await addCompany(formData.name, formData.description);
      
      if (result.success) {
        showSuccess(`Company "${formData.name}" added successfully!`);
        await loadCompanies();
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
        await loadCompanies();
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
