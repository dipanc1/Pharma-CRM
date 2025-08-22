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

      // Compute date flags
      const invalidRange = !!(startDate && endDate && endDate < startDate);
      const applyDateRange = !!(startDate && endDate && !invalidRange);

      let query = supabase
        .from('sales')
        .select(`
          *,
          visits!inner (
            visit_date,
            doctors (id, name, specialization, hospital)
          ),
          products (name, category)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply date filters only when both dates are selected and valid
      if (applyDateRange) {
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
        .select('id, name')
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

  // Sales by product category
  const salesByCategory = filteredSales.reduce((acc, sale) => {
    const category = sale.products?.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(sale.total_amount);
    return acc;
  }, {});

  const categoryData = Object.entries(salesByCategory).map(([category, amount]) => ({
    category,
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

  return (
    <>
      <Sales
        sales={salesState}
        loading={loading}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        doctorFilter={doctorFilter}
        setDoctorFilter={setDoctorFilter}
        productFilter={productFilter}
        setProductFilter={setProductFilter}
        doctors={doctors}
        products={products}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        totalCount={totalCount}
        filteredSales={filteredSales}
        totalRevenue={totalRevenue}
        totalItems={totalItems}
        categoryData={categoryData}
        doctorData={doctorData}
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
