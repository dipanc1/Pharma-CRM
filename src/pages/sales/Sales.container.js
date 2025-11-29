import React, { useState, useEffect, useMemo } from 'react';
import Sales from './Sales';
import { supabase } from '../../lib/supabase';
import { Toast } from '../../components';
import useToast from '../../hooks/useToast';
import { format, startOfMonth } from 'date-fns';

function SalesContainer() {
  const [salesState, setSalesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd')); // Changed to current date
  const [doctorFilter, setDoctorFilter] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [productFilter, setProductFilter] = useState('');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const { toast, showError, hideToast } = useToast();

  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, doctorFilter, productFilter]);

  // Reset to first page when any filter or search changes
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, doctorFilter, productFilter, doctorSearch, productSearch]);

  useEffect(() => {
    fetchDoctors();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);

      // Enhanced date validation
      const justStart = !!(startDate && !endDate);
      const justEnd = !!(!startDate && endDate);
      const invalidRange = !!(startDate && endDate && endDate < startDate);

      if (justStart || justEnd || invalidRange) {
        setSalesState([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('sales')
        .select(`
          *,
          visits!inner (
            visit_date,
            doctors (id, name, specialization, hospital, contact_type, doctor_type, doctor_class)
          ),
          products (id, name, company_name, price)
        `)
        .order('created_at', { ascending: false });

      // Apply date filters with proper validation
      if (startDate && endDate && startDate <= endDate) {
        query = query
          .gte('visits.visit_date', startDate)
          .lte('visits.visit_date', endDate);
      }

      // Apply selected (exact) filters
      if (doctorFilter) {
        query = query.eq('visits.doctor_id', doctorFilter);
      }
      if (productFilter) {
        query = query.eq('product_id', productFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Sales fetch error:', error);
        throw error;
      }
      
      // Validate and clean data
      const cleanedData = (data || []).filter(sale => {
        return sale && 
               sale.visits && 
               sale.products &&
               !isNaN(parseFloat(sale.total_amount || 0)) &&
               !isNaN(parseInt(sale.quantity || 0, 10));
      });

      setSalesState(cleanedData);
    } catch (error) {
      console.error('Error fetching sales:', error);
      showError('Error loading sales data. Please check your connection and try again.');
      setSalesState([]);
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

  // Client-side search filters (apply even if user didn't select from dropdown)
  const filteredSalesAll = useMemo(() => {
    const docTerm = (doctorSearch || '').trim().toLowerCase();
    const prodTerm = (productSearch || '').trim().toLowerCase();

    return (salesState || []).filter((sale) => {
      // Doctor search match
      const doctor = sale.visits?.doctors || {};
      const isChemist = doctor.contact_type === 'chemist';
      const doctorHaystack = [
        doctor.name,
        doctor.hospital,
        !isChemist ? doctor.specialization : '',
        !isChemist ? doctor.doctor_type : '',
        !isChemist ? doctor.doctor_class : ''
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const doctorMatches = !docTerm || doctorHaystack.includes(docTerm);

      // Product search match
      const productName = sale.products?.name?.toLowerCase() || '';
      const productMatches = !prodTerm || productName.includes(prodTerm);

      return doctorMatches && productMatches;
    });
  }, [salesState, doctorSearch, productSearch]);

  // Enhanced totals calculation with error handling
  const totals = useMemo(() => {
    try {
      const totalRevenue = filteredSalesAll.reduce((sum, s) => {
        const amount = parseFloat(s.total_amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const totalItems = filteredSalesAll.reduce((sum, s) => {
        const quantity = parseInt(s.quantity || 0, 10);
        return sum + (isNaN(quantity) ? 0 : quantity);
      }, 0);
      
      const totalTransactions = filteredSalesAll.length;
      
      const totalGrossProfit = filteredSalesAll.reduce((sum, s) => {
        try {
          const costPrice = parseFloat(s.products?.price || 0);
          const sellingPrice = parseFloat(s.unit_price || 0);
          const quantity = parseInt(s.quantity || 0, 10);
          
          if (isNaN(costPrice) || isNaN(sellingPrice) || isNaN(quantity)) {
            return sum;
          }
          
          const profitPerUnit = sellingPrice - costPrice;
          return sum + (profitPerUnit * quantity);
        } catch (error) {
          console.error('Error calculating profit for sale:', s.id, error);
          return sum;
        }
      }, 0);

      return { 
        totalRevenue: totalRevenue || 0, 
        totalItems: totalItems || 0, 
        totalTransactions, 
        totalGrossProfit: totalGrossProfit || 0 
      };
    } catch (error) {
      console.error('Error calculating totals:', error);
      return { totalRevenue: 0, totalItems: 0, totalTransactions: 0, totalGrossProfit: 0 };
    }
  }, [filteredSalesAll]);

  // Enhanced company data with error handling
  const companyData = useMemo(() => {
    try {
      const byCompany = filteredSalesAll.reduce((acc, s) => {
        try {
          const company = s.products?.company_name || 'Other';
          const amount = parseFloat(s.total_amount || 0);
          
          if (isNaN(amount)) return acc;
          
          acc[company] = (acc[company] || 0) + amount;
          return acc;
        } catch (error) {
          console.error('Error processing company data for sale:', s.id, error);
          return acc;
        }
      }, {});
      
      return Object.entries(byCompany)
        .map(([company, amount]) => ({
          company,
          amount: parseFloat(amount) || 0
        }))
        .filter(item => item.amount > 0) // Filter out zero amounts
        .sort((a, b) => b.amount - a.amount); // Sort by amount descending
    } catch (error) {
      console.error('Error calculating company data:', error);
      return [];
    }
  }, [filteredSalesAll]);

  // Enhanced contact data with error handling
  const contactData = useMemo(() => {
    try {
      const byContact = filteredSalesAll.reduce((acc, s) => {
        try {
          const name = s.visits?.doctors?.name || 'Unknown';
          const contact_type = s.visits?.doctors?.contact_type || 'doctor';
          const key = `${name}|${contact_type}`;
          const amount = parseFloat(s.total_amount || 0);
          
          if (isNaN(amount)) return acc;
          
          if (!acc[key]) {
            acc[key] = { name, contact_type, amount: 0 };
          }
          acc[key].amount += amount;
          return acc;
        } catch (error) {
          console.error('Error processing contact data for sale:', s.id, error);
          return acc;
        }
      }, {});
      
      return Object.values(byContact)
        .filter(contact => contact.amount > 0) // Filter out zero amounts
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
    } catch (error) {
      console.error('Error calculating contact data:', error);
      return [];
    }
  }, [filteredSalesAll]);

  // Pagination based on filtered list
  const totalCount = filteredSalesAll.length;
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [page, maxPage]);

  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const filteredSales = filteredSalesAll.slice(from, to);

  // Contact search helpers
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
    try {
      setDoctorSearch(value || '');
      if ((value || '').trim()) {
        setShowDoctorDropdown(true);
      } else {
        setDoctorFilter('');
        setShowDoctorDropdown(false);
      }
    } catch (error) {
      console.error('Error in doctor search change:', error);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setDoctorFilter(doctor.id);
    setDoctorSearch(formatDoctorDisplay(doctor));
    setShowDoctorDropdown(false);
  };

  // Product search helpers
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleProductSearchChange = (value) => {
    try {
      setProductSearch(value || '');
      if ((value || '').trim()) {
        setShowProductDropdown(true);
      } else {
        setProductFilter('');
        setShowProductDropdown(false);
      }
    } catch (error) {
      console.error('Error in product search change:', error);
    }
  };

  const handleProductSelect = (product) => {
    setProductFilter(product.id);
    setProductSearch(product.name);
    setShowProductDropdown(false);
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
        totalRevenue={totals.totalRevenue}
        totalItems={totals.totalItems}
        totalTransactions={totals.totalTransactions}
        totalGrossProfit={totals.totalGrossProfit}
        companyData={companyData}
        contactData={contactData}
        doctorSearch={doctorSearch}
        setDoctorSearch={handleDoctorSearchChange}
        showDoctorDropdown={showDoctorDropdown}
        setShowDoctorDropdown={setShowDoctorDropdown}
        filteredDoctors={filteredDoctors}
        handleDoctorSelect={handleDoctorSelect}
        productSearch={productSearch}
        setProductSearch={handleProductSearchChange}
        showProductDropdown={showProductDropdown}
        setShowProductDropdown={setShowProductDropdown}
        filteredProducts={filteredProducts}
        handleProductSelect={handleProductSelect}
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