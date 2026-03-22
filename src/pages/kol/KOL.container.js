import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Toast } from '../../components';
import useToast from '../../hooks/useToast';
import { getCurrentCycleStart, generateCycleOptions, getCycleMonthRanges } from '../../utils/cycleUtils';
import KOL from './KOL';

function KOLContainer() {
  const [selectedCycle, setSelectedCycle] = useState(getCurrentCycleStart());
  const [kolDoctors, setKolDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [kolVisits, setKolVisits] = useState({});
  const [kolGifts, setKolGifts] = useState({});
  const [kolNotes, setKolNotes] = useState({});
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState({});
  const { toast, showSuccess, showError, hideToast } = useToast();

  const cycleOptions = generateCycleOptions();

  useEffect(() => {
    fetchAllDoctors();
  }, []);

  useEffect(() => {
    fetchKOLDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (kolDoctors.length > 0 && selectedCycle) {
      fetchKOLData();
    } else {
      setKolVisits({});
      setKolGifts({});
      setKolNotes({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kolDoctors, selectedCycle]);

  const fetchAllDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, specialization, hospital, contact_type, is_kol')
        .eq('contact_type', 'doctor')
        .order('name');
      if (error) throw error;
      setAllDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchKOLDoctors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, specialization, hospital, doctor_class, address')
        .eq('is_kol', true)
        .eq('contact_type', 'doctor')
        .order('name');
      if (error) throw error;
      setKolDoctors(data || []);
    } catch (error) {
      showError('Failed to load core doctors.');
      setKolDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchKOLData = useCallback(async () => {
    const kolIds = kolDoctors.map(d => d.id);
    if (kolIds.length === 0) return;

    const monthRanges = getCycleMonthRanges(selectedCycle);
    const cycleStart = monthRanges[0].start;
    const cycleEnd = monthRanges[2].end;

    try {
      // Fetch visits, gifts, and notes in parallel
      const [visitsResult, giftsResult, notesResult] = await Promise.all([
        supabase
          .from('visits')
          .select('id, doctor_id, visit_date, notes, status')
          .in('doctor_id', kolIds)
          .gte('visit_date', cycleStart)
          .lte('visit_date', cycleEnd)
          .order('visit_date', { ascending: true }),
        supabase
          .from('cash_flow')
          .select('id, doctor_id, transaction_date, amount, name, notes')
          .in('doctor_id', kolIds)
          .eq('purpose', 'gift')
          .eq('cash_type', 'out_flow')
          .gte('transaction_date', cycleStart)
          .lte('transaction_date', cycleEnd)
          .order('transaction_date', { ascending: true }),
        supabase
          .from('kol_notes')
          .select('id, doctor_id, notes')
          .in('doctor_id', kolIds)
          .eq('cycle_start_date', selectedCycle)
      ]);

      // Group visits by doctor
      const visitsMap = {};
      (visitsResult.data || []).forEach(v => {
        if (!visitsMap[v.doctor_id]) visitsMap[v.doctor_id] = [];
        visitsMap[v.doctor_id].push(v);
      });
      setKolVisits(visitsMap);

      // Group gifts by doctor
      const giftsMap = {};
      (giftsResult.data || []).forEach(g => {
        if (!giftsMap[g.doctor_id]) giftsMap[g.doctor_id] = [];
        giftsMap[g.doctor_id].push(g);
      });
      setKolGifts(giftsMap);

      // Map notes by doctor
      const notesMap = {};
      (notesResult.data || []).forEach(n => {
        notesMap[n.doctor_id] = { id: n.id, notes: n.notes };
      });
      setKolNotes(notesMap);

    } catch (error) {
      console.error('Error fetching KOL data:', error);
    }
  }, [kolDoctors, selectedCycle]);

  const markAsKOL = async (doctorId) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_kol: true })
        .eq('id', doctorId);
      if (error) throw error;

      const doctor = allDoctors.find(d => d.id === doctorId);
      showSuccess(`${doctor?.name || 'Doctor'} marked as core doctor.`);
      setDoctorSearch('');
      setShowDoctorDropdown(false);
      await Promise.all([fetchKOLDoctors(), fetchAllDoctors()]);
    } catch (error) {
      showError('Failed to mark doctor as core doctor.');
    }
  };

  const unmarkKOL = async (doctorId, doctorName) => {
    if (!window.confirm(`Remove ${doctorName || 'this doctor'} from core doctors list?`)) return;
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_kol: false })
        .eq('id', doctorId);
      if (error) throw error;
      showSuccess(`${doctorName || 'Doctor'} removed from core doctors list.`);
      await Promise.all([fetchKOLDoctors(), fetchAllDoctors()]);
    } catch (error) {
      showError('Failed to remove core doctor status.');
    }
  };

  const saveKOLNotes = async (doctorId, notesText) => {
    try {
      setSavingNotes(prev => ({ ...prev, [doctorId]: true }));
      const { error } = await supabase
        .from('kol_notes')
        .upsert({
          doctor_id: doctorId,
          cycle_start_date: selectedCycle,
          notes: notesText
        }, { onConflict: 'doctor_id,cycle_start_date' });
      if (error) throw error;
      showSuccess('Notes saved.');
      // Update local state
      setKolNotes(prev => ({
        ...prev,
        [doctorId]: { ...prev[doctorId], notes: notesText }
      }));
    } catch (error) {
      showError('Failed to save notes.');
    } finally {
      setSavingNotes(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  // Filter non-KOL doctors for the dropdown
  const filteredDoctors = allDoctors.filter(d => {
    if (d.is_kol) return false;
    if (!doctorSearch) return true;
    const search = doctorSearch.toLowerCase();
    return (
      (d.name || '').toLowerCase().includes(search) ||
      (d.specialization || '').toLowerCase().includes(search) ||
      (d.hospital || '').toLowerCase().includes(search)
    );
  });

  // Summary stats
  const totalVisits = Object.values(kolVisits).reduce((sum, arr) => sum + arr.length, 0);
  const totalGiftsAmount = Object.values(kolGifts).reduce(
    (sum, arr) => sum + arr.reduce((s, g) => s + parseFloat(g.amount || 0), 0), 0
  );

  return (
    <>
      <KOL
        selectedCycle={selectedCycle}
        setSelectedCycle={setSelectedCycle}
        cycleOptions={cycleOptions}
        kolDoctors={kolDoctors}
        kolVisits={kolVisits}
        kolGifts={kolGifts}
        kolNotes={kolNotes}
        doctorSearch={doctorSearch}
        setDoctorSearch={setDoctorSearch}
        showDoctorDropdown={showDoctorDropdown}
        setShowDoctorDropdown={setShowDoctorDropdown}
        filteredDoctors={filteredDoctors}
        markAsKOL={markAsKOL}
        unmarkKOL={unmarkKOL}
        saveKOLNotes={saveKOLNotes}
        savingNotes={savingNotes}
        loading={loading}
        totalVisits={totalVisits}
        totalGiftsAmount={totalGiftsAmount}
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

export default KOLContainer;
