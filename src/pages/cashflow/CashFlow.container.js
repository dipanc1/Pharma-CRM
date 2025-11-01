import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import CashFlow from './CashFlow';
import { useToast } from '../../hooks/useToast';

const CashFlowContainer = () => {
  const [cashFlowData, setCashFlowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filters, setFilters] = useState({
    cashType: '',
    type: '',
    purpose: '',
    searchTerm: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;

  const { showToast } = useToast();

  useEffect(() => {
    fetchCashFlow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage]);

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cash_flow')
        .select('*', { count: 'exact' })
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.cashType) {
        query = query.eq('cash_type', filters.cashType);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.purpose) {
        query = query.eq('purpose', filters.purpose);
      }
      if (filters.searchTerm) {
        query = query.ilike('name', `%${filters.searchTerm}%`);
      }

      // Pagination
      const from = (currentPage - 1) * recordsPerPage;
      const to = from + recordsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setCashFlowData(data || []);
      setTotalRecords(count || 0);
    } catch (error) {
      console.error('Error fetching cash flow:', error);
      showToast('Failed to fetch cash flow records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cash_flow')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Record deleted successfully', 'success');
      fetchCashFlow();
    } catch (error) {
      console.error('Error deleting record:', error);
      showToast('Failed to delete record', 'error');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('cash_flow')
          .update(formData)
          .eq('id', editingRecord.id);

        if (error) throw error;
        showToast('Record updated successfully', 'success');
      } else {
        // Insert new record
        const { error } = await supabase
          .from('cash_flow')
          .insert([formData]);

        if (error) throw error;
        showToast('Record added successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      fetchCashFlow();
    } catch (error) {
      console.error('Error saving record:', error);
      showToast('Failed to save record', 'error');
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <CashFlow
      cashFlowData={cashFlowData}
      loading={loading}
      isModalOpen={isModalOpen}
      editingRecord={editingRecord}
      filters={filters}
      currentPage={currentPage}
      totalRecords={totalRecords}
      recordsPerPage={recordsPerPage}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      onModalClose={() => {
        setIsModalOpen(false);
        setEditingRecord(null);
      }}
      onFilterChange={handleFilterChange}
      onPageChange={handlePageChange}
    />
  );
};

export default CashFlowContainer;