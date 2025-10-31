import React, { useState, useEffect } from 'react';
import Sales from './Sales';
import { supabase } from '../../lib/supabase';
import { Toast } from '../../components';
import useToast from '../../hooks/useToast';
import { format, startOfMonth } from 'date-fns';

function SalesContainer() {
  const [salesState, setSalesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [doctorFilter, setDoctorFilter] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [productFilter, setProductFilter] = useState('');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { toast, showError, hideToast } = useToast();

  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  
  const [dateRangeStats, setDateRangeStats] = useState({
    totalRevenue: 0,
    totalItems: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, doctorFilter, productFilter, page, pageSize]);

  // Reset to first page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, doctorFilter, productFilter]);

  useEffect(() => {
    fetchDoctors();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchDateRangeStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchDateRangeStats = async () => {
    try {
      // Date validation
      const justStart = !!(startDate && !endDate);
      const justEnd = !!(!startDate && endDate);
      const invalidRange = !!(startDate && endDate && endDate < startDate);

      if (justStart || justEnd || invalidRange) {
        setDateRangeStats({
          totalRevenue: 0,
          totalItems: 0,
          totalTransactions: 0
        });
        return;
      }

      let query = supabase
        .from('sales')
        .select(`
          total_amount,
          quantity,
          visits!inner (visit_date)
        `);

      // Apply date filters only
      if (startDate && endDate) {
        query = query
          .gte('visits.visit_date', startDate)
          .lte('visits.visit_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalRevenue: data?.reduce((total, sale) => total + parseFloat(sale.total_amount), 0) || 0,
        totalItems: data?.reduce((total, sale) => total + sale.quantity, 0) || 0,
        totalTransactions: data?.length || 0
      };

      setDateRangeStats(stats);
    } catch (error) {
      console.error('Error fetching date range stats:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);

      // Date validation and short-circuit rules
      const justStart = !!(startDate && !endDate);
      const justEnd = !!(!startDate && endDate);
      const invalidRange = !!(startDate && endDate && endDate < startDate);

      if (justStart || justEnd || invalidRange) {
        setSalesState([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('sales')
        .select(`
          *,
          visits!inner (
            visit_date,
            doctors (id, name, specialization, hospital, contact_type)
          ),
          products (name, company_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply date filters only when both dates are selected and valid
      if (startDate && endDate) {
        query = query
          .gte('visits.visit_date', startDate)
          .lte('visits.visit_date', endDate);
      }

      if (doctorFilter) {
        query = query.eq('visits.doctor_id', doctorFilter);
      }
      if (productFilter) {
        query = query.eq('product_id', productFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setSalesState(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching sales:', error);
      showError('Error loading sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, specialization, hospital, doctor_type, doctor_class, contact_type')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const filteredSales = salesState;

  const totalRevenue = dateRangeStats.totalRevenue;
  const totalItems = dateRangeStats.totalItems;
  const totalTransactions = dateRangeStats.totalTransactions;

  const [companyData, setCompanyData] = useState([]);
  const [contactData, setContactData] = useState([]);

  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchChartData = async () => {
    try {
      const justStart = !!(startDate && !endDate);
      const justEnd = !!(!startDate && endDate);
      const invalidRange = !!(startDate && endDate && endDate < startDate);

      if (justStart || justEnd || invalidRange) {
        setCompanyData([]);
        setContactData([]);
        return;
      }

      let query = supabase
        .from('sales')
        .select(`
          total_amount,
          visits!inner (
            visit_date,
            doctors (name, contact_type)
          ),
          products (company_name)
        `);

      if (startDate && endDate) {
        query = query
          .gte('visits.visit_date', startDate)
          .lte('visits.visit_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sales by company
      const salesByCompany = (data || []).reduce((acc, sale) => {
        const company = sale.products?.company_name || 'Other';
        acc[company] = (acc[company] || 0) + parseFloat(sale.total_amount);
        return acc;
      }, {});

      const processedCompanyData = Object.entries(salesByCompany).map(([company, amount]) => ({
        company,
        amount: parseFloat(amount)
      }));

      setCompanyData(processedCompanyData);

      // Sales by contact
      const salesByContact = (data || []).reduce((acc, sale) => {
        const contactName = sale.visits?.doctors?.name || 'Unknown';
        const contactType = sale.visits?.doctors?.contact_type || 'doctor';
        const key = `${contactName}|${contactType}`;
        
        if (!acc[key]) {
          acc[key] = {
            name: contactName,
            contact_type: contactType,
            amount: 0
          };
        }
        acc[key].amount += parseFloat(sale.total_amount);
        return acc;
      }, {});

      const processedContactData = Object.values(salesByContact)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      setContactData(processedContactData);

    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Contact search functionality
  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = doctorSearch.toLowerCase();
    const isChemist = doctor.contact_type === 'chemist';
    
    return (
      doctor.name.toLowerCase().includes(searchLower) ||
      doctor.hospital?.toLowerCase().includes(searchLower) ||
      (!isChemist && doctor.specialization?.toLowerCase().includes(searchLower)) ||
      (!isChemist && doctor.doctor_type?.toLowerCase().includes(searchLower)) ||
      (!isChemist && doctor.doctor_class?.toLowerCase().includes(searchLower))
    );
  });

  const formatDoctorDisplay = (doctor) => {
    const isChemist = doctor.contact_type === 'chemist';
    if (isChemist) {
      return `${doctor.name}${doctor.hospital ? ` - ${doctor.hospital}` : ''} [Chemist]`;
    }
    return `${doctor.name}${doctor.specialization ? ` - ${doctor.specialization}` : ''}${doctor.doctor_type ? ` (${doctor.doctor_type}` : ''}${doctor.doctor_class ? ` - ${doctor.doctor_class})` : doctor.doctor_type ? ')' : ''}`;
  };

  const handleDoctorSearchChange = (value) => {
    setDoctorSearch(value);
    if (value.trim()) {
      setShowDoctorDropdown(true);
    } else {
      setDoctorFilter('');
      setShowDoctorDropdown(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setDoctorFilter(doctor.id);
    setDoctorSearch(formatDoctorDisplay(doctor));
    setShowDoctorDropdown(false);
  };

  return (
    <>
      <Sales
        loading={loading}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        doctorFilter={doctorFilter}
        productFilter={productFilter}
        setProductFilter={setProductFilter}
        products={products}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        totalCount={totalCount}
        filteredSales={filteredSales}
        totalRevenue={totalRevenue}
        totalItems={totalItems}
        totalTransactions={totalTransactions}
        companyData={companyData}
        contactData={contactData}
        doctorSearch={doctorSearch}
        setDoctorSearch={handleDoctorSearchChange}
        showDoctorDropdown={showDoctorDropdown}
        setShowDoctorDropdown={setShowDoctorDropdown}
        filteredDoctors={filteredDoctors}
        handleDoctorSelect={handleDoctorSelect}
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

export default SalesContainer;