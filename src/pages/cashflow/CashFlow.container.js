import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import CashFlow from './CashFlow';
import useToast from '../../hooks/useToast';
import { Toast } from '../../components';

const CashFlowContainer = () => {
  const [cashFlowData, setCashFlowData] = useState([]);
  const [allCashFlowData, setAllCashFlowData] = useState([]);
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
  }, [filters.cashType, filters.type, filters.purpose]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCashFlowData, filters.searchTerm, currentPage]);

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cash_flow')
        .select('*', { count: 'exact' })
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply non-search filters
      if (filters.cashType) {
        query = query.eq('cash_type', filters.cashType);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.purpose) {
        query = query.eq('purpose', filters.purpose);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setAllCashFlowData(data || []);
      // Add this line to set the total count for unfiltered data
      if (!filters.searchTerm) {
        setTotalRecords(count || 0);
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error);
      showError('Failed to fetch cash flow records');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredData = allCashFlowData;

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter(record =>
        (record.name || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    setCashFlowData(paginatedData);
    setTotalRecords(filteredData.length);
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
        // Reset to first page when adding new record
        setCurrentPage(1);
      }

      setIsModalOpen(false);
      setEditingRecord(null);

      // Refetch data to get updated records
      await fetchCashFlow();
    } catch (error) {
      console.error('Error saving record:', error);
      showError(error.message || 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
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

      // Refetch data after deletion
      await fetchCashFlow();

      // Check if current page becomes empty after deletion and adjust if needed
      setTimeout(() => {
        const newTotalRecords = totalRecords - 1;
        const maxPage = Math.ceil(newTotalRecords / recordsPerPage);
        if (currentPage > maxPage && maxPage > 0) {
          setCurrentPage(maxPage);
        }
      }, 100);
    } catch (error) {
      console.error('Error deleting record:', error);
      showError('Failed to delete record');
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