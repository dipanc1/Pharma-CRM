import { useContext } from 'react';
import { CompaniesContext } from '../contexts/CompaniesContext';

/**
 * Custom hook to use companies from the centralized context
 * @returns {Object} companies, companiesOptions, loading, error, refreshCompanies
 */
export const useCompanies = () => {
  const context = useContext(CompaniesContext);
  
  if (!context) {
    throw new Error('useCompanies must be used within a CompaniesProvider');
  }
  
  return context;
};

export default useCompanies;
