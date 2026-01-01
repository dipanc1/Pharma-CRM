import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import { format, startOfMonth } from 'date-fns';
import Visits from './Visits';
import { addStockTransaction, updateProductStock, TRANSACTION_TYPES } from '../../../utils/stockUtils';
import { generateInvoiceNumber } from '../../../utils/invoiceUtils';

function VisitsContainer() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [cityOptions, setCityOptions] = useState([]);
  const [doctorVisitCounts, setDoctorVisitCounts] = useState([]);
  const [countsLoading, setCountsLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [allVisits, setAllVisits] = useState([]);

  useEffect(() => {
    // Reset page when filters change
    setPage(1);
  }, [searchTerm, cityFilter]);

  useEffect(() => {
    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, statusFilter, cityFilter]);

  useEffect(() => {
    fetchDoctorVisitCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, statusFilter, cityFilter]);

  useEffect(() => {
    fetchCityOptions();
  }, []);

  const fetchCityOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('address')
        .order('address');

      if (error) {
        console.error('Error fetching city options:', error);
        return;
      }

      const uniqueCities = [...new Set(
        data
          .map(doctor => doctor.address)
          .filter(city => city && city.trim() !== '')
          .map(city => city.trim())
      )].sort();

      setCityOptions(uniqueCities);
    } catch (error) {
      console.error('Error fetching city options:', error);
    }
  };

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
          doctors (name, specialization, hospital, address, contact_type),
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

      let filteredData = data || [];

      if (cityFilter) {
        filteredData = filteredData.filter(visit => {
          const visitCity = visit.doctors?.address?.trim();
          const selectedCity = cityFilter.trim();
          return visitCity === selectedCity;
        });
      }

      setAllVisits(filteredData);
      setTotalCount(filteredData.length);

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

      // Step 1: Get ALL doctors first, then filter by city if needed
      let doctorsQuery = supabase
        .from('doctors')
        .select('id, name, specialization, hospital, address, contact_type')
        .order('name');

      const { data: allDoctors, error: doctorsError } = await doctorsQuery;

      if (doctorsError) {
        showError('Database error fetching doctors');
        return;
      }

      // Filter doctors by city on the client side
      let filteredDoctors = allDoctors;
      if (cityFilter) {
        filteredDoctors = allDoctors.filter(doctor => {
          const doctorCity = doctor.address?.trim();
          const selectedCity = cityFilter.trim();
          return doctorCity === selectedCity;
        });
      }

      // Step 2: Get visit counts for the date range (for ALL doctors, not just filtered ones)
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

      // Step 4: Combine filtered doctors with their visit counts (including 0 visits)
      const doctorVisitCounts = filteredDoctors.map(doctor => ({
        doctor_id: doctor.id,
        doctor: {
          name: doctor.name,
          specialization: doctor.specialization,
          hospital: doctor.hospital,
          city: doctor.address,
          contact_type: doctor.contact_type
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
            doctor_id,
            doctors (name, contact_type),
            sales (id, product_id, quantity, total_amount, products (name))
          `)
          .eq('id', id)
          .single();

        if (!visitData) {
          showError('Visit not found');
          return;
        }

        const salesCount = visitData?.sales?.length || 0;
        const totalAmount = visitData?.sales?.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) || 0;

        // Generate reversal invoice number if there are sales
        let reversalInvoiceNumber = null;
        if (salesCount > 0) {
          try {
            reversalInvoiceNumber = await generateInvoiceNumber();
          } catch (invoiceError) {
            console.error('Invoice generation error:', invoiceError);
            showError('Failed to generate reversal invoice. Please try again.');
            return;
          }
        }

        // Delete the original ledger entry (if exists)
        if (totalAmount > 0) {
          const { error: deleteLedgerError } = await supabase
            .from('ledger_entries')
            .delete()
            .eq('source_type', 'visit')
            .eq('source_id', id);

          if (deleteLedgerError) {
            console.error('Original ledger deletion error:', deleteLedgerError);
            showError('Failed to delete original ledger entry. Deletion aborted.');
            return;
          }
        }

        // Reverse stock transactions for all sales
        if (visitData?.sales) {
          for (const sale of visitData.sales) {
            try {
              await addStockTransaction({
                product_id: sale.product_id,
                transaction_type: TRANSACTION_TYPES.SALE_REVERSAL,
                quantity: sale.quantity,
                transaction_date: visitData.visit_date,
                reference_type: 'visit_deletion',
                reference_id: id,
                notes: `Sale reversal for deleted visit - Restoring ${sale.quantity} units of ${sale.products?.name || 'Unknown Product'}`
              });
            } catch (stockError) {
              console.error('Stock reversal error:', stockError);
              showError(`Failed to reverse stock for ${sale.products?.name}. Deletion aborted.`);
              return;
            }
          }
        }

        // Create reversal ledger entry if there were sales
        if (totalAmount > 0 && reversalInvoiceNumber) {
          const { error: reversalLedgerError } = await supabase.from('ledger_entries').insert({
            doctor_id: visitData.doctor_id,
            entry_date: visitData.visit_date,
            source_type: 'visit',
            source_id: null, // Not linked to any visit since it's deleted
            description: `Reversal for deleted visit - ${salesCount} item${salesCount !== 1 ? 's' : ''} (Reversal Invoice: ${reversalInvoiceNumber})`,
            debit: 0,
            credit: totalAmount, // CREDIT to reverse the original DEBIT
            invoice_number: reversalInvoiceNumber
          });

          if (reversalLedgerError) {
            console.error('Reversal ledger error:', reversalLedgerError);
            showError('Failed to create reversal ledger entry. Deletion aborted.');
            return;
          }
        }

        // Delete the visit (cascade will delete sales)
        const { error } = await supabase
          .from('visits')
          .delete()
          .eq('id', id);

        if (error) {
          showError('Failed to delete visit. Please try again.');
          return;
        }

        // Update current stock for all affected products
        if (visitData?.sales) {
          for (const sale of visitData.sales) {
            try {
              await updateProductStock(sale.product_id);
            } catch (stockError) {
              console.error('Product stock update error:', stockError);
            }
          }
        }

        // Show detailed success message
        const isChemist = visitData?.doctors?.contact_type === 'chemist';
        const contactName = visitData?.doctors?.name || 'Unknown Contact';
        const visitDate = visitData?.visit_date ? format(new Date(visitData.visit_date), 'MMM dd, yyyy') : '';

        let successMessage = `Visit deleted successfully`;
        if (contactName && visitDate) {
          successMessage += ` (${contactName}${isChemist ? ' [Chemist]' : ''} - ${visitDate})`;
        }
        if (salesCount > 0) {
          successMessage += ` and ${salesCount} associated sale${salesCount !== 1 ? 's' : ''} reversed`;
        }
        if (reversalInvoiceNumber) {
          successMessage += ` (Reversal Invoice: ${reversalInvoiceNumber})`;
        }

        showSuccess(successMessage);

        // Refresh data
        await fetchVisits();
        await fetchDoctorVisitCounts();

      } catch (error) {
        console.error('Error deleting visit:', error);
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
    const isChemist = visit.doctors?.contact_type === 'chemist';
    
    return (
      (visit.doctors?.name || '').toLowerCase().includes(searchLower) ||
      (!isChemist && (visit.doctors?.specialization || '').toLowerCase().includes(searchLower)) ||
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
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        cityOptions={cityOptions}
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