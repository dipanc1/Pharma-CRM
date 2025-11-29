import { supabase } from '../lib/supabase';

export const generateInvoiceNumber = async () => {
  try {
    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Format: INV-YYYY-MM-XXXX
    const prefix = `INV-${year}-${month}`;
    
    // Get the last invoice number for this month
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    let nextNumber = 1;
    if (data && data.length > 0 && data[0].invoice_number) {
      // Extract the last 4 digits and increment
      const lastInvoice = data[0].invoice_number;
      const lastNumber = parseInt(lastInvoice.split('-').pop(), 10);
      nextNumber = lastNumber + 1;
    }
    
    // Format with leading zeros (4 digits)
    const invoiceNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
    return invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to timestamp-based number
    return `INV-${Date.now()}`;
  }
};

export const calculateRunningBalance = (entries, doctorId) => {
  // Sort entries by date and creation time
  const sortedEntries = entries
    .filter(entry => entry.doctor_id === doctorId)
    .sort((a, b) => {
      const dateA = new Date(a.entry_date);
      const dateB = new Date(b.entry_date);
      if (dateA.getTime() === dateB.getTime()) {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return dateA - dateB;
    });
  
  let runningBalance = 0;
  return sortedEntries.map(entry => {
    runningBalance += parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0);
    return {
      ...entry,
      running_balance: runningBalance
    };
  });
};

// New utility for creating payment ledger entries
export const createPaymentEntry = async (doctorId, amount, paymentDate, paymentMethod = 'cash', description = '') => {
  try {
    const invoiceNumber = await generateInvoiceNumber();
    
    const { data, error } = await supabase.from('ledger_entries').insert({
      doctor_id: doctorId,
      entry_date: paymentDate,
      source_type: 'cash',
      description: description || `Payment received via ${paymentMethod} (Receipt: ${invoiceNumber})`,
      debit: 0,
      credit: amount, // CREDIT - Customer paid, reducing their debt
      invoice_number: invoiceNumber
    }).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating payment entry:', error);
    throw error;
  }
};

// Utility for creating adjustment entries
export const createAdjustmentEntry = async (doctorId, amount, adjustmentDate, reason, isDebit = true) => {
  try {
    const invoiceNumber = await generateInvoiceNumber();
    
    const { data, error } = await supabase.from('ledger_entries').insert({
      doctor_id: doctorId,
      entry_date: adjustmentDate,
      source_type: 'cash',
      description: `${isDebit ? 'Debit' : 'Credit'} adjustment: ${reason} (Ref: ${invoiceNumber})`,
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount,
      invoice_number: invoiceNumber
    }).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating adjustment entry:', error);
    throw error;
  }
};
