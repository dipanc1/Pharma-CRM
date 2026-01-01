import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import VisitDetail from './VisitDetail';
import { updateProductStock } from '../../../utils/stockUtils';

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
          doctors (name, specialization, hospital, address, contact_type),
          sales (
            id,
            quantity,
            unit_price,
            total_amount,
            products (name, company_name)
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
        // Get full visit details
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

        // Delete ALL ledger entries for this visit
        if (totalAmount > 0) {
          const { error: deleteLedgerError } = await supabase
            .from('ledger_entries')
            .delete()
            .eq('source_type', 'visit')
            .eq('source_id', id);

          if (deleteLedgerError) {
            console.error('Ledger deletion error:', deleteLedgerError);
            showError('Failed to delete ledger entry. Deletion aborted.');
            return;
          }
        }

        // Delete original stock transactions and add stock back
        if (visitData?.sales) {
          for (const sale of visitData.sales) {
            try {
              // First, delete the original stock transaction for this sale
              const { error: deleteStockError } = await supabase
                .from('stock_transactions')
                .delete()
                .eq('reference_type', 'visit')
                .eq('reference_id', id)
                .eq('product_id', sale.product_id);

              if (deleteStockError) {
                console.error('Stock transaction deletion error:', deleteStockError);
                showError(`Failed to delete stock transaction for ${sale.products?.name}. Deletion aborted.`);
                return;
              }
            } catch (stockError) {
              console.error('Stock deletion error:', stockError);
              showError(`Failed to reverse stock for ${sale.products?.name}. Deletion aborted.`);
              return;
            }
          }
        }

        // Delete the visit
        const { error } = await supabase
          .from('visits')
          .delete()
          .eq('id', id);

        if (error) throw error;

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

        let successMessage = `Visit deleted successfully`;
        if (salesCount > 0) {
          successMessage += `. ${salesCount} sale${salesCount !== 1 ? 's' : ''} and stock transactions removed`;
        }

        showSuccess(successMessage);
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