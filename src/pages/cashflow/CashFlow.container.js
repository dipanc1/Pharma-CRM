import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import CashFlow from './CashFlow';
import useToast from '../../hooks/useToast';
import { Toast } from '../../components';

const CashFlowContainer = () => {
  const [cashFlowData, setCashFlowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    cashType: '',
    type: '',
    purpose: '',
    searchTerm: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;

  const { toast, showError, showSuccess, hideToast } = useToast();

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
      showError('Failed to fetch cash flow records');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    // Ensure proper date format for editing
    const formattedRecord = {
      ...record,
      transaction_date: record.transaction_date ? 
        new Date(record.transaction_date).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0]
    };
    setEditingRecord(formattedRecord);
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

      showSuccess('Record deleted successfully');
      
      // Check if current page becomes empty after deletion
      const newTotal = totalRecords - 1;
      const maxPage = Math.ceil(newTotal / recordsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      } else {
        fetchCashFlow();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      showError('Failed to delete record');
    }
  };

  const handleSubmit = async (formData) => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      // Validate required fields
      if (!formData.name?.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Valid amount is required');
      }
      if (!formData.transaction_date) {
        throw new Error('Transaction date is required');
      }

      const processedData = {
        ...formData,
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        notes: formData.notes?.trim() || null,
        purpose: formData.purpose || null
      };

      if (editingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('cash_flow')
          .update(processedData)
          .eq('id', editingRecord.id);

        if (error) throw error;
        showSuccess('Record updated successfully');
      } else {
        // Insert new record
        const { error } = await supabase
          .from('cash_flow')
          .insert([processedData]);

        if (error) throw error;
        showSuccess('Record added successfully');
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      fetchCashFlow();
    } catch (error) {
      console.error('Error saving record:', error);
      showError(error.message || 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleModalClose = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  return (
    <>
      <CashFlow
        cashFlowData={cashFlowData}
        loading={loading}
        submitting={submitting}
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
        onModalClose={handleModalClose}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};

export default CashFlowContainer;