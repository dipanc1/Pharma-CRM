import { supabase } from '../lib/supabase';

export const generateInvoiceNumber = async () => {
  try {
    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Format: INV-YYYY-MM-XXXX (string, not UUID)
    const prefix = `INV-${year}-${month}`;
    
    // Add retry logic for race conditions
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
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
          const lastParts = lastInvoice.split('-');
          if (lastParts.length >= 4) {
            const lastNumber = parseInt(lastParts[lastParts.length - 1], 10);
            if (!isNaN(lastNumber)) {
              nextNumber = lastNumber + 1;
            }
          }
        }
        
        // Format with leading zeros (4 digits)
        const invoiceNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
        
        // Validate the generated invoice number
        if (!invoiceNumber || invoiceNumber.length < 12) {
          throw new Error('Generated invoice number is invalid');
        }
        
        return invoiceNumber;
      } catch (attemptError) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw attemptError;
        }
        // Wait a short time before retrying to avoid race conditions
        const delay = 100 * attempts;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Enhanced fallback with timestamp and random component
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
  }
};

export const calculateRunningBalance = (entries, doctorId) => {
  try {
    // Filter and validate entries for this doctor
    const doctorEntries = entries.filter(entry => {
      return entry.doctor_id === doctorId && 
             entry.entry_date && 
             entry.created_at &&
             (parseFloat(entry.debit || 0) >= 0) &&
             (parseFloat(entry.credit || 0) >= 0);
    });

    if (doctorEntries.length === 0) {
      return [];
    }

    // Sort entries by date and creation time
    const sortedEntries = doctorEntries.sort((a, b) => {
      const dateA = new Date(a.entry_date);
      const dateB = new Date(b.entry_date);
      
      // Handle invalid dates
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      
      if (dateA.getTime() === dateB.getTime()) {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return dateA - dateB;
    });
    
    let runningBalance = 0;
    return sortedEntries.map(entry => {
      const debit = parseFloat(entry.debit || 0);
      const credit = parseFloat(entry.credit || 0);
      runningBalance += debit - credit;
      
      return {
        ...entry,
        running_balance: runningBalance
      };
    });
  } catch (error) {
    console.error('Error calculating running balance:', error);
    return entries.filter(entry => entry.doctor_id === doctorId).map(entry => ({
      ...entry,
      running_balance: 0
    }));
  }
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
