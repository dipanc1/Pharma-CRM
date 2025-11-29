import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import useToast from '../../hooks/useToast';
import Ledger from './Ledger';

const LedgerContainer = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [trialBalance, setTrialBalance] = useState([]);
  const [doctorFilter, setDoctorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [doctors, setDoctors] = useState([]);
  const { showError } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchLedger();
    fetchTrialBalance();
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

  const fetchTrialBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('ledger_trial_balance')
        .select('*')
        .order('name');
      if (error) throw error;
      setTrialBalance(data || []);
    } catch (e) {
      console.error(e);
    }
  };

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
    />
  );
};

export default LedgerContainer;