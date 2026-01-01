import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import VisitDetail from './VisitDetail';
import { addStockTransaction, updateProductStock, TRANSACTION_TYPES } from '../../../utils/stockUtils';
import { generateInvoiceNumber } from '../../../utils/invoiceUtils';

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
            source_id: null,
            description: `Reversal for deleted visit - ${salesCount} item${salesCount !== 1 ? 's' : ''} (Reversal Invoice: ${reversalInvoiceNumber})`,
            debit: 0,
            credit: totalAmount,
            invoice_number: reversalInvoiceNumber
          });

          if (reversalLedgerError) {
            console.error('Reversal ledger error:', reversalLedgerError);
            showError('Failed to create reversal ledger entry. Deletion aborted.');
            return;
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
          successMessage += ` and ${salesCount} sale${salesCount !== 1 ? 's' : ''} reversed`;
        }
        if (reversalInvoiceNumber) {
          successMessage += ` (Reversal Invoice: ${reversalInvoiceNumber})`;
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