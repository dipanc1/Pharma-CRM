import React, { useState, useEffect } from 'react';
import Sales from './Sales';
import { supabase } from '../../lib/supabase';
import { Toast } from '../../components';
import useToast from '../../hooks/useToast';

function SalesContainer() {
  const [salesState, setSalesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  const fetchSales = async () => {
    try {
      setLoading(true);

      // Date validation and short-circuit rules (same as visits)
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
            doctors (id, name, specialization, hospital)
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
        .select('id, name, specialization, doctor_type, doctor_class')
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

  const totalRevenue = filteredSales.reduce((total, sale) => total + parseFloat(sale.total_amount), 0);
  const totalItems = filteredSales.reduce((total, sale) => total + sale.quantity, 0);

  // Sales by product company
  const salesByCompany = filteredSales.reduce((acc, sale) => {
    const company = sale.products?.company_name || 'Other';
    acc[company] = (acc[company] || 0) + parseFloat(sale.total_amount);
    return acc;
  }, {});

  const companyData = Object.entries(salesByCompany).map(([company, amount]) => ({
    company,
    amount: parseFloat(amount)
  }));

  // Sales by doctor
  const salesByDoctor = filteredSales.reduce((acc, sale) => {
    const doctorName = sale.visits?.doctors?.name || 'Unknown';
    acc[doctorName] = (acc[doctorName] || 0) + parseFloat(sale.total_amount);
    return acc;
  }, {});

  const doctorData = Object.entries(salesByDoctor)
    .map(([doctor, amount]) => ({ doctor, amount: parseFloat(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Doctor search functionality (like AddVisit)
  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doctor.doctor_type?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doctor.doctor_class?.toLowerCase().includes(doctorSearch.toLowerCase())
  );

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
    setDoctorSearch(`${doctor.name} - ${doctor.specialization} (${doctor.doctor_type} - ${doctor.doctor_class})`);
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
        companyData={companyData}
        doctorData={doctorData}
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
