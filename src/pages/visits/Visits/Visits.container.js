import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import { format, startOfMonth } from 'date-fns';
import Visits from './Visits';

function VisitsContainer() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
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

      if (error) {
        showError('Failed to load visits. Please check your connection and try again.');
        setAllVisits([]);
        setTotalCount(0);
        return;
      }

      setAllVisits(data || []);
      setTotalCount(data?.length || 0);

    } catch (error) {
      showError('Error loading visits. Please try again.');
      setAllVisits([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorVisitCounts = async () => {
    try {
      const justStart = !!(startDate && !endDate);
      const justEnd = !!(!startDate && endDate);
      const invalidRange = !!(startDate && endDate && endDate < startDate);

      if (justStart || justEnd || invalidRange) {
        setDoctorVisitCounts([]);
        return;
      }

      setCountsLoading(true);
      
      // Step 1: Get all doctors first
      const { data: allDoctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, name, specialization, hospital, address')
        .order('name');

      if (doctorsError) {
        showError('Database error fetching doctors:', doctorsError);
        return;
      }

      // Step 2: Get visit counts for the date range
      let visitQuery = supabase
        .from('visits')
        .select('doctor_id, status');

      if (startDate && endDate) {
        visitQuery = visitQuery.gte('visit_date', startDate).lte('visit_date', endDate);
      }

      if (statusFilter === 'completed') {
        visitQuery = visitQuery.eq('status', 'completed');
      } else if (statusFilter === 'other') {
        visitQuery = visitQuery.neq('status', 'completed');
      }

      const { data: visits, error: visitsError } = await visitQuery;
      
      if (visitsError) {
        showError('Database error fetching visit counts');
        return;
      }

      // Step 3: Create a map of doctor visit counts
      const visitCountMap = new Map();
      (visits || []).forEach((visit) => {
        if (!visit.doctor_id) return;
        const count = visitCountMap.get(visit.doctor_id) || 0;
        visitCountMap.set(visit.doctor_id, count + 1);
      });

      // Step 4: Combine all doctors with their visit counts (including 0 visits)
      const doctorVisitCounts = allDoctors.map(doctor => ({
        doctor_id: doctor.id,
        doctor: {
          name: doctor.name,
          specialization: doctor.specialization,
          hospital: doctor.hospital,
          city: doctor.address // Using address as city
        },
        count: visitCountMap.get(doctor.id) || 0
      }));

      // Sort by visit count (descending), then by name
      const sortedCounts = doctorVisitCounts.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return (a.doctor?.name || '').localeCompare(b.doctor?.name || '');
      });

      setDoctorVisitCounts(sortedCounts);   
    } catch (error) {
      showError('Error loading visit statistics. Please try again.');
      setDoctorVisitCounts([]);
    } finally {
      setCountsLoading(false);
    }
  };

  const deleteVisit = async (id) => {
    if (window.confirm('Are you sure you want to delete this visit? This will also delete all associated sales.')) {
      try {
        // Get visit details for confirmation message
        const { data: visitData } = await supabase
          .from('visits')
          .select(`
            visit_date,
            doctors (name),
            sales (id)
          `)
          .eq('id', id)
          .single();

        const { error } = await supabase
          .from('visits')
          .delete()
          .eq('id', id);

        if (error) {
          showError('Failed to delete visit. Please try again.');
          return;
        }

        // Show detailed success message
        const doctorName = visitData?.doctors?.name || 'Unknown Doctor';
        const visitDate = visitData?.visit_date ? format(new Date(visitData.visit_date), 'MMM dd, yyyy') : '';
        const salesCount = visitData?.sales?.length || 0;
        
        let successMessage = `Visit deleted successfully`;
        if (doctorName && visitDate) {
          successMessage += ` (${doctorName} - ${visitDate})`;
        }
        if (salesCount > 0) {
          successMessage += ` and ${salesCount} associated sale${salesCount !== 1 ? 's' : ''}`;
        }

        showSuccess(successMessage);
        
        // Refresh data
        await fetchVisits();
        await fetchDoctorVisitCounts();

      } catch (error) {
        showError('Error deleting visit. Please try again.');
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