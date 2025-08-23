import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import Visits from './Visits';

function VisitsContainer() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorVisitCounts, setDoctorVisitCounts] = useState([]);
  const [countsLoading, setCountsLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [allVisits, setAllVisits] = useState([]);

  useEffect(() => {
    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    // Reset page when search term changes
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchDoctorVisitCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, statusFilter]);

  const fetchVisits = async () => {
    try {
      setLoading(true);

      const justStart = !!(startDate && !endDate);
      const justEnd = !!(!startDate && endDate);
      const invalidRange = !!(startDate && endDate && endDate < startDate);

      if (justStart || justEnd || invalidRange) {
        setAllVisits([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('visits')
        .select(`
          *,
          doctors (name, specialization, hospital),
          sales (
            id,
            quantity,
            total_amount,
            products (name)
          )
        `)
        .order('visit_date', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('visit_date', startDate).lte('visit_date', endDate);
      }

      if (statusFilter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (statusFilter === 'other') {
        query = query.neq('status', 'completed');
      }

      const { data, error } = await query;

      if (error) throw error;
      setAllVisits(data || []);
      setTotalCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching visits:', error);
      showError('Error loading visits');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorVisitCounts = async () => {
    try {
      const noDates = !startDate && !endDate;
      const justStart = !!(startDate && !endDate);
      const justEnd = !!(!startDate && endDate);
      const invalidRange = !!(startDate && endDate && endDate < startDate);

      if (noDates || justStart || justEnd || invalidRange) {
        setDoctorVisitCounts([]);
        return;
      }

      setCountsLoading(true);
      let query = supabase
        .from('visits')
        .select(`
          doctor_id,
          status,
          doctors (name, specialization, hospital)
        `);

      query = query.gte('visit_date', startDate).lte('visit_date', endDate);

      if (statusFilter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (statusFilter === 'other') {
        query = query.neq('status', 'completed');
      }

      const { data, error } = await query;
      if (error) throw error;

      const map = new Map();
      (data || []).forEach((row) => {
        if (!row.doctor_id) return;
        const existing = map.get(row.doctor_id) || {
          doctor_id: row.doctor_id,
          doctor: row.doctors,
          count: 0,
        };
        existing.count += 1;
        if (!existing.doctor && row.doctors) existing.doctor = row.doctors;
        map.set(row.doctor_id, existing);
      });

      const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
      setDoctorVisitCounts(list);
    } catch (err) {
      console.error('Error fetching doctor visit counts:', err);
      setDoctorVisitCounts([]);
    } finally {
      setCountsLoading(false);
    }
  };

  const deleteVisit = async (id) => {
    if (window.confirm('Are you sure you want to delete this visit? This will also delete all associated sales.')) {
      try {
        const { error } = await supabase
          .from('visits')
          .delete()
          .eq('id', id);

        if (error) throw error;
        showSuccess('Visit deleted successfully');
        fetchVisits();
      } catch (error) {
        console.error('Error deleting visit:', error);
        showError('Error deleting visit');
      }
    }
  };

  const calculateTotalSales = (sales) => {
    return sales?.reduce((total, sale) => total + parseFloat(sale.total_amount), 0) || 0;
  };

  // Apply search filtering
  const filteredVisits = allVisits.filter(visit => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (visit.doctors?.name || '').toLowerCase().includes(searchLower) ||
      (visit.doctors?.specialization || '').toLowerCase().includes(searchLower) ||
      (visit.doctors?.hospital || '').toLowerCase().includes(searchLower) ||
      (visit.status || '').toLowerCase().includes(searchLower) ||
      (visit.notes || '').toLowerCase().includes(searchLower)
    );
  });

  // Apply pagination to filtered results
  const paginatedVisits = filteredVisits.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalFilteredCount = filteredVisits.length;
  const maxPage = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  return (
    <>
      <Visits
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        totalCount={totalCount}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        doctorVisitCounts={doctorVisitCounts}
        countsLoading={countsLoading}
        deleteVisit={deleteVisit}
        calculateTotalSales={calculateTotalSales}
        filteredVisits={paginatedVisits}
        totalFilteredCount={totalFilteredCount}
        maxPage={maxPage}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

export default VisitsContainer;