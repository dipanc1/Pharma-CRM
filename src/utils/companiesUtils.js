import { supabase } from '../lib/supabase';

/**
 * Fetch all companies from the database
 */
export const fetchCompanies = async () => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching companies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
};

/**
 * Format companies for select options
 */
export const formatCompaniesForSelect = (companies) => {
  return (companies || []).map(company => ({
    value: company.name,
    label: company.name
  }));
};

/**
 * Add a new company
 */
export const addCompany = async (name, description = '') => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert([{
        name: name.toUpperCase(),
        description: description || ''
      }])
      .select();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Company already exists');
      }
      throw error;
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error adding company:', error);
    throw error;
  }
};

/**
 * Delete a company
 */
export const deleteCompany = async (companyId) => {
  try {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};

/**
 * Update a company
 */
export const updateCompany = async (companyId, updates) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select();

    if (error) {
      throw error;
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};
