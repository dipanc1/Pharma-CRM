import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import CashFlow from './CashFlow';
import useToast from '../../hooks/useToast';
import { Toast } from '../../components';
import { format, parseISO, startOfMonth } from 'date-fns';

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
    searchTerm: '',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;

  const [analytics, setAnalytics] = useState({
    totalInflow: 0,
    totalOutflow: 0,
    netFlow: 0,
    totalTransactions: 0
  });

  const [chartData, setChartData] = useState({
    flowTypeData: [],
    purposeData: [],
    dailyTrendData: []
  });

  const { toast, showError, showSuccess, hideToast } = useToast();

  useEffect(() => {
    fetchCashFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.cashType, filters.type, filters.purpose]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCashFlowData, filters.searchTerm, filters.startDate, filters.endDate, currentPage]);

  useEffect(() => {
    fetchAnalytics();
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.cashType, filters.type, filters.purpose]);

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      
      // Date validation - skip fetch if invalid date range
      if (filters.startDate && filters.endDate && filters.endDate < filters.startDate) {
        setAllCashFlowData([]);
        setTotalRecords(0);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('cash_flow')
        .select('*', { count: 'exact' })
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply all filters except search
      if (filters.startDate && filters.endDate) {
        query = query
          .gte('transaction_date', filters.startDate)
          .lte('transaction_date', filters.endDate);
      }
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

      // Refetch all data to get updated records, analytics, and charts
      await Promise.all([
        fetchCashFlow(),
        fetchAnalytics(),
        fetchChartData()
      ]);
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

      // Refetch all data after deletion
      await Promise.all([
        fetchCashFlow(),
        fetchAnalytics(),
        fetchChartData()
      ]);

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
    setCurrentPage  (1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleModalClose = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const fetchAnalytics = async () => {
    try {
      // Date validation
      if (filters.startDate && filters.endDate && filters.endDate < filters.startDate) {
        setAnalytics({
          totalInflow: 0,
          totalOutflow: 0,
          netFlow: 0,
          totalTransactions: 0
        });
        return;
      }

      let query = supabase
        .from('cash_flow')
        .select('cash_type, amount');

      // Apply filters
      if (filters.startDate && filters.endDate) {
        query = query
          .gte('transaction_date', filters.startDate)
          .lte('transaction_date', filters.endDate);
      }
      if (filters.cashType) {
        query = query.eq('cash_type', filters.cashType);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.purpose) {
        query = query.eq('purpose', filters.purpose);
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalInflow = data
        ?.filter(record => record.cash_type === 'in_flow')
        .reduce((sum, record) => sum + parseFloat(record.amount || 0), 0) || 0;

      const totalOutflow = data
        ?.filter(record => record.cash_type === 'out_flow')
        .reduce((sum, record) => sum + parseFloat(record.amount || 0), 0) || 0;

      setAnalytics({
        totalInflow,
        totalOutflow,
        netFlow: totalInflow - totalOutflow,
        totalTransactions: data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      // Date validation
      if (filters.startDate && filters.endDate && filters.endDate < filters.startDate) {
        setChartData({
          flowTypeData: [],
          purposeData: [],
          dailyTrendData: []
        });
        return;
      }

      let query = supabase
        .from('cash_flow')
        .select('cash_type, purpose, amount, transaction_date');

      // Apply date filter
      if (filters.startDate && filters.endDate) {
        query = query
          .gte('transaction_date', filters.startDate)
          .lte('transaction_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Flow Type Data
      const flowTypeStats = data?.reduce((acc, record) => {
        const type = record.cash_type === 'in_flow' ? 'In Flow' : 'Out Flow';
        acc[type] = (acc[type] || 0) + parseFloat(record.amount || 0);
        return acc;
      }, {}) || {};

      const flowTypeData = Object.entries(flowTypeStats).map(([type, amount]) => ({
        type,
        amount
      }));

      // Purpose Data
      const purposeStats = data?.reduce((acc, record) => {
        const purpose = record.purpose ? 
          record.purpose.charAt(0).toUpperCase() + record.purpose.slice(1).replace('_', ' ') : 
          'Other';
        acc[purpose] = (acc[purpose] || 0) + parseFloat(record.amount || 0);
        return acc;
      }, {}) || {};

      const purposeData = Object.entries(purposeStats)
        .map(([purpose, amount]) => ({ purpose, amount }))
        .sort((a, b) => b.amount - a.amount);

      // Daily Trend Data (only if date range is selected)
      let dailyTrendData = [];
      if (filters.startDate && filters.endDate && data?.length > 0) {
        const dailyStats = data.reduce((acc, record) => {
          const date = format(parseISO(record.transaction_date), 'MMM dd');
          if (!acc[date]) {
            acc[date] = { date, inflow: 0, outflow: 0 };
          }
          
          if (record.cash_type === 'in_flow') {
            acc[date].inflow += parseFloat(record.amount || 0);
          } else {
            acc[date].outflow += parseFloat(record.amount || 0);
          }
          
          return acc;
        }, {});

        dailyTrendData = Object.values(dailyStats)
          .map(day => ({
            ...day,
            netFlow: day.inflow - day.outflow
          }))
          .sort((a, b) => new Date(a.date + ', 2024') - new Date(b.date + ', 2024'));
      }

      setChartData({
        flowTypeData,
        purposeData,
        dailyTrendData
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
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
        analytics={analytics}
        chartData={chartData}
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