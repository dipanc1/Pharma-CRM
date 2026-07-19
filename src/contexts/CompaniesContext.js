import React, { createContext, useState, useEffect, useCallback } from 'react';
import { fetchCompanies, formatCompaniesForSelect } from '../utils/companiesUtils';
import { useAuth } from './AuthContext';

export const CompaniesContext = createContext();

export const CompaniesProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCompanies();
      setCompanies(data);
      const options = formatCompaniesForSelect(data);
      setCompaniesOptions(options);
    } catch (err) {
      console.error('Error loading companies:', err);
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      loadCompanies();
    } else {
      setCompanies([]);
      setCompaniesOptions([]);
      setLoading(false);
    }
  }, [user, authLoading, loadCompanies]);

  const refreshCompanies = useCallback(async () => {
    await loadCompanies();
  }, [loadCompanies]);

  const value = {
    companies,
    companiesOptions,
    loading,
    error,
    refreshCompanies
  };

  return (
    <CompaniesContext.Provider value={value}>
      {children}
    </CompaniesContext.Provider>
  );
};
