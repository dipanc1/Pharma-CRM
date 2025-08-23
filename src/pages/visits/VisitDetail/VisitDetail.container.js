import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import VisitDetail from './VisitDetail';

function VisitDetailContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    fetchVisitData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchVisitData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          doctors (name, specialization, hospital),
          sales (
            id,
            quantity,
            unit_price,
            total_amount,
            products (name, category)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setVisit(data);

    } catch (error) {
      console.error('Error fetching visit data:', error);
      showError('Error loading visit details');
      navigate('/visits');
    } finally {
      setLoading(false);
    }
  };

  const deleteVisit = async () => {
    if (window.confirm('Are you sure you want to delete this visit? This will also delete all associated sales.')) {
      try {
        const { error } = await supabase
          .from('visits')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        showSuccess('Visit deleted successfully');
        navigate('/visits');
      } catch (error) {
        console.error('Error deleting visit:', error);
        showError('Error deleting visit');
      }
    }
  };

  const calculateTotalSales = (sales) => {
    return sales?.reduce((total, sale) => total + parseFloat(sale.total_amount), 0) || 0;
  };

  const getVisitStatusStyle = (status) => {
    return status === 'completed'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  return (
    <>
      <VisitDetail
        visit={visit}
        loading={loading}
        deleteVisit={deleteVisit}
        calculateTotalSales={calculateTotalSales}
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

export default VisitDetailContainer;