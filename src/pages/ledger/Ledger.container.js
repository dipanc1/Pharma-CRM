import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import useToast from '../../hooks/useToast';
import Ledger from './Ledger';
import { format } from 'date-fns';
import { calculateRunningBalance } from '../../utils/invoiceUtils';

const TB_SELECTIONS_KEY = 'ledger_tb_saved_selections';

const loadSavedSelections = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(TB_SELECTIONS_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const LedgerContainer = () => {
  const [loading, setLoading] = useState(true);
  const [allEntries, setAllEntries] = useState([]);
  const [doctorFilter, setDoctorFilter] = useState('');
  // Financial year runs April 1 to March 31
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  let financialYearStartDate, financialYearEndDate;
  
  if (currentMonth < 3) {
    financialYearStartDate = new Date(currentYear - 1, 3, 1);
    financialYearEndDate = new Date(currentYear, 2, 31);
  } else {
    financialYearStartDate = new Date(currentYear, 3, 1);
    financialYearEndDate = new Date(currentYear + 1, 2, 31);
  }
  
  const initialStartDate = format(financialYearStartDate, 'yyyy-MM-dd');
  const initialEndDate = format(financialYearEndDate, 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [doctors, setDoctors] = useState([]);
  const [sourceType, setSourceType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('entries');
  const [entriesWithBalance, setEntriesWithBalance] = useState([]);
  const [tbSelectedContacts, setTbSelectedContacts] = useState([]);
  const [tbMinBalance, setTbMinBalance] = useState('');
  const [savedSelections, setSavedSelections] = useState(loadSavedSelections);
  const pageSize = 25;
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchDoctors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Running balance and trial balance are computed client-side from allEntries.
  useEffect(() => {
    fetchAllEntries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorFilter, view]);

  useEffect(() => {
    fetchLedger();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorFilter, startDate, endDate, sourceType, allEntries]);

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, name, contact_type, hospital, specialization')
      .order('name');
    if (error) {
      console.error(error);
      showError('Failed to load contacts');
    }
    setDoctors(data || []);
  };

  const fetchAllEntries = async () => {
    try {
      let query = supabase
        .from('ledger_entries')
        .select(`
          *,
          doctors:doctor_id (id, name, contact_type, hospital, specialization)
        `);

      // Trial balance aggregates across all contacts, so skip doctor scoping there
      if (doctorFilter && view !== 'trial') {
        query = query.eq('doctor_id', doctorFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAllEntries(data || []);
    } catch (e) {
      console.error('Error fetching all entries:', e);
    }
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      
      if (allEntries.length === 0) {
        setEntriesWithBalance([]);
        return;
      }

      let query = supabase
        .from('ledger_entries')
        .select(`
          *,
          doctors:doctor_id (id, name, contact_type, hospital, specialization)
        `)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (doctorFilter) query = query.eq('doctor_id', doctorFilter);
      if (sourceType) query = query.eq('source_type', sourceType);
      if (startDate && endDate) {
        query = query.gte('entry_date', startDate).lte('entry_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        setEntriesWithBalance([]);
        return;
      }

      try {
        const entriesWithRunningBalance = [];
        const doctorIds = [...new Set(data.map(entry => entry.doctor_id))];
        
        for (const doctorId of doctorIds) {
          const doctorEntries = calculateRunningBalance(allEntries, doctorId);
          
          const filteredDoctorEntries = doctorEntries.filter(entry => 
            data.some(d => d.id === entry.id)
          );
          
          entriesWithRunningBalance.push(...filteredDoctorEntries);
        }

        entriesWithRunningBalance.sort((a, b) => {
          const dateA = new Date(a.entry_date);
          const dateB = new Date(b.entry_date);
          if (dateB.getTime() === dateA.getTime()) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return dateB - dateA;
        });

        setEntriesWithBalance(entriesWithRunningBalance);
      } catch (balanceError) {
        console.error('Error calculating running balance:', balanceError);
        setEntriesWithBalance(data.map(entry => ({ ...entry, running_balance: 0 })));
      }
    } catch (e) {
      console.error('Error fetching ledger:', e);
      showError('Failed to load ledger entries');
      setEntriesWithBalance([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    await fetchAllEntries();
    // fetchLedger reruns automatically via the allEntries effect dependency.
    showSuccess('Ledger refreshed successfully');
  };
  const filteredForDisplay = useMemo(() => {
    let filtered = entriesWithBalance;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        (e.doctors?.name || '').toLowerCase().includes(s) ||
        (e.description || '').toLowerCase().includes(s) ||
        (e.invoice_number || '').toLowerCase().includes(s)
      );
    }
    return filtered;
  }, [entriesWithBalance, searchTerm]);

  const displayEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredForDisplay.slice(start, start + pageSize);
  }, [filteredForDisplay, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredForDisplay.length / pageSize)),
    [filteredForDisplay]
  );

  const periodTotals = useMemo(() => {
    const debit = filteredForDisplay.reduce((s, e) => s + parseFloat(e.debit || 0), 0);
    const credit = filteredForDisplay.reduce((s, e) => s + parseFloat(e.credit || 0), 0);
    return { debit, credit, net: debit - credit, count: filteredForDisplay.length };
  }, [filteredForDisplay]);

  const trialBalance = useMemo(() => {
    const balanceMap = {};
    allEntries.forEach(entry => {
      const doctorId = entry.doctor_id;
      if (!balanceMap[doctorId]) {
        balanceMap[doctorId] = {
          doctor_id: doctorId,
          name: entry.doctors?.name || 'Unknown',
          contact_type: entry.doctors?.contact_type || 'doctor',
          hospital: entry.doctors?.hospital || '',
          specialization: entry.doctors?.specialization || '',
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
      .filter(tb => tb.total_debit !== 0 || tb.total_credit !== 0)
      .sort((a, b) => Math.abs(b.current_balance) - Math.abs(a.current_balance));
  }, [allEntries]);

  const filteredTrialBalance = useMemo(() => {
    let filtered = trialBalance;
    if (tbSelectedContacts.length > 0) {
      const selected = new Set(tbSelectedContacts);
      filtered = filtered.filter(tb => selected.has(tb.doctor_id));
    }
    const min = parseFloat(tbMinBalance);
    if (!isNaN(min) && min > 0) {
      filtered = filtered.filter(tb => Math.abs(tb.current_balance) >= min);
    }
    return filtered;
  }, [trialBalance, tbSelectedContacts, tbMinBalance]);

  const tbTotals = useMemo(() => {
    const debit = filteredTrialBalance.reduce((s, tb) => s + tb.total_debit, 0);
    const credit = filteredTrialBalance.reduce((s, tb) => s + tb.total_credit, 0);
    return { debit, credit, net: debit - credit };
  }, [filteredTrialBalance]);

  const persistSelections = (selections) => {
    setSavedSelections(selections);
    try {
      localStorage.setItem(TB_SELECTIONS_KEY, JSON.stringify(selections));
    } catch (e) {
      console.error('Failed to persist selections:', e);
    }
  };

  const handleSaveSelection = (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      showError('Enter a name for the selection');
      return false;
    }
    if (tbSelectedContacts.length === 0) {
      showError('Select at least one contact to save');
      return false;
    }
    const updated = [
      ...savedSelections.filter(s => s.name !== trimmed),
      { name: trimmed, contactIds: tbSelectedContacts }
    ];
    persistSelections(updated);
    showSuccess(`Selection "${trimmed}" saved`);
    return true;
  };

  const handleLoadSelection = (name) => {
    const selection = savedSelections.find(s => s.name === name);
    if (selection) setTbSelectedContacts(selection.contactIds);
  };

  const handleDeleteSelection = (name) => {
    persistSelections(savedSelections.filter(s => s.name !== name));
    showSuccess(`Selection "${name}" deleted`);
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Date', 'Invoice #', 'Contact', 'Type', 'Source', 'Description', 'Debit', 'Credit', 'Balance'];
      const rows = filteredForDisplay.map(e => [
        e.entry_date,
        e.invoice_number || '',
        e.doctors?.name || '',
        e.doctors?.contact_type || '',
        e.source_type,
        (e.description || '').replace(/(\r\n|\n|\r|,)/g, ' '),
        parseFloat(e.debit || 0).toFixed(2),
        parseFloat(e.credit || 0).toFixed(2),
        parseFloat(e.running_balance || 0).toFixed(2)
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Ledger exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export ledger');
    }
  };

  const handleExportTrialBalance = () => {
    try {
      const headers = ['Contact', 'Type', 'Hospital/Specialization', 'Total Debit', 'Total Credit', 'Current Balance', 'Status'];
      const rows = filteredTrialBalance.map(tb => [
        tb.name,
        tb.contact_type === 'chemist' ? 'Chemist' : 'Doctor',
        tb.contact_type === 'chemist' ? tb.hospital : tb.specialization,
        parseFloat(tb.total_debit).toFixed(2),
        parseFloat(tb.total_credit).toFixed(2),
        Math.abs(parseFloat(tb.current_balance)).toFixed(2),
        tb.current_balance > 0 ? 'Debit' : tb.current_balance < 0 ? 'Credit' : 'Balanced'
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trial_balance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Trial balance exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export trial balance');
    }
  };

  const handleClearFilters = () => {
    setDoctorFilter('');
    setSourceType('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setTbSelectedContacts([]);
    setTbMinBalance('');
    setPage(1);
  };

  const hasFilters = doctorFilter || sourceType || startDate || endDate || searchTerm ||
    tbSelectedContacts.length > 0 || tbMinBalance;

  return (
    <Ledger
      loading={loading}
      entries={displayEntries}
      trialBalance={filteredTrialBalance}
      trialBalanceTotal={trialBalance.length}
      tbTotals={tbTotals}
      tbSelectedContacts={tbSelectedContacts}
      setTbSelectedContacts={setTbSelectedContacts}
      tbMinBalance={tbMinBalance}
      setTbMinBalance={setTbMinBalance}
      savedSelections={savedSelections}
      onSaveSelection={handleSaveSelection}
      onLoadSelection={handleLoadSelection}
      onDeleteSelection={handleDeleteSelection}
      doctorFilter={doctorFilter}
      setDoctorFilter={setDoctorFilter}
      sourceType={sourceType}
      setSourceType={setSourceType}
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      setEndDate={setEndDate}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      doctors={doctors}
      onRefresh={handleRefresh}
      page={page}
      setPage={setPage}
      totalPages={totalPages}
      periodTotals={periodTotals}
      onExportCSV={handleExportCSV}
      onExportTrialBalance={handleExportTrialBalance}
      onClearFilters={handleClearFilters}
      hasFilters={hasFilters}
      view={view}
      setView={setView}
    />
  );
};

export default LedgerContainer;