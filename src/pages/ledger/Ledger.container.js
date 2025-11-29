import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import useToast from '../../hooks/useToast';
import Ledger from './Ledger';

const LedgerContainer = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]); // For trial balance
  const [doctorFilter, setDoctorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [doctors, setDoctors] = useState([]);
  const { showError } = useToast();

  useEffect(() => {
    fetchDoctors();
    fetchAllEntries(); // Fetch all entries once for trial balance
  }, []);

  useEffect(() => {
    fetchLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorFilter, startDate, endDate]);

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, name, contact_type')
      .order('name');
    if (error) { console.error(error); }
    setDoctors(data || []);
  };

  const fetchAllEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select(`
          *,
          doctors:doctor_id (id, name, contact_type)
        `);
      if (error) throw error;
      setAllEntries(data || []);
    } catch (e) {
      console.error('Error fetching all entries:', e);
    }
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('ledger_entries')
        .select(`
          *,
          doctors:doctor_id (id, name, contact_type)
        `)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (doctorFilter) query = query.eq('doctor_id', doctorFilter);
      if (startDate && endDate) {
        query = query.gte('entry_date', startDate).lte('entry_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEntries(data || []);
    } catch (e) {
      console.error(e);
      showError('Failed to load ledger entries');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchLedger(), fetchAllEntries()]);
  };

  // Compute trial balance from ALL entries (not filtered)
  const trialBalance = useMemo(() => {
    const balanceMap = {};

    allEntries.forEach(entry => {
      const doctorId = entry.doctor_id;
      if (!balanceMap[doctorId]) {
        balanceMap[doctorId] = {
          doctor_id: doctorId,
          name: entry.doctors?.name || 'Unknown',
          contact_type: entry.doctors?.contact_type || 'doctor',
          total_debit: 0,
          total_credit: 0
        };
      }
      balanceMap[doctorId].total_debit += parseFloat(entry.debit || 0);
      balanceMap[doctorId].total_credit += parseFloat(entry.credit || 0);
    });

    return Object.values(balanceMap)
      .map(tb => ({
        ...tb,
        current_balance: tb.total_debit - tb.total_credit
      }))
      .filter(tb => tb.total_debit !== 0 || tb.total_credit !== 0) // Only show contacts with transactions
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allEntries]);

  return (
    <Ledger
      loading={loading}
      entries={entries}
      trialBalance={trialBalance}
      doctorFilter={doctorFilter}
      setDoctorFilter={setDoctorFilter}
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      setEndDate={setEndDate}
      doctors={doctors}
      onRefresh={handleRefresh}
    />
  );
};

export default LedgerContainer;