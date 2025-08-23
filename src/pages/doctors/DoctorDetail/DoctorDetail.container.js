import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import DoctorDetail from './DoctorDetail';

function DoctorDetailContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    fetchDoctorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);

      // Fetch doctor details
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (doctorError) throw doctorError;
      setDoctor(doctorData);

      // Fetch doctor's visits with sales data
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select(`
          *,
          sales (
            id,
            quantity,
            total_amount,
            products (name, category)
          )
        `)
        .eq('doctor_id', id)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;
      setVisits(visitsData || []);

    } catch (error) {
      console.error('Error fetching doctor data:', error);
      showError('Error loading doctor details');
    } finally {
      setLoading(false);
    }
  };

  const deleteDoctor = async () => {
    if (window.confirm('Are you sure you want to delete this doctor? This will also delete all associated visits and sales.')) {
      try {
        const { error } = await supabase
          .from('doctors')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        showSuccess('Doctor deleted successfully');
        navigate('/doctors');
      } catch (error) {
        console.error('Error deleting doctor:', error);
        showError('Error deleting doctor');
      }
    }
  };

  const calculateTotalSales = (sales) => {
    return sales?.reduce((total, sale) => total + parseFloat(sale.total_amount), 0) || 0;
  };


  const getDoctorClassStyle = (doctorClass) => {
    const styles = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-yellow-100 text-yellow-800'
    };
    return styles[doctorClass] || styles.C;
  };

  const getDoctorTypeStyle = (doctorType) => {
    return doctorType === 'prescriber'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-orange-100 text-orange-800';
  };

  const getVisitStatusStyle = (status) => {
    return status === 'completed'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;


  return (
    <>
      <DoctorDetail
        doctor={doctor}
        visits={visits}
        loading={loading}
        deleteDoctor={deleteDoctor}
        calculateTotalSales={calculateTotalSales}
        getDoctorClassStyle={getDoctorClassStyle}
        getDoctorTypeStyle={getDoctorTypeStyle}
        getVisitStatusStyle={getVisitStatusStyle}
        formatCurrency={formatCurrency}
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

export default DoctorDetailContainer;
