import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Toast } from '../../components';
import useToast from '../../hooks/useToast';
import { getCurrentCycleStart, generateCycleOptions, getCycleMonthRanges } from '../../utils/cycleUtils';
import CyclePlanning from './CyclePlanning';

function CyclePlanningContainer() {
  const [selectedCycle, setSelectedCycle] = useState(getCurrentCycleStart());
  const [selectedProductId, setSelectedProductId] = useState('');
  const [products, setProducts] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [cyclePlans, setCyclePlans] = useState([]);
  const [visitAchievements, setVisitAchievements] = useState({});
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const cycleOptions = generateCycleOptions();

  useEffect(() => {
    fetchProducts();
    fetchAllDoctors();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      fetchCyclePlans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycle]);

  useEffect(() => {
    if (cyclePlans.length > 0 && selectedCycle) {
      fetchVisitAchievements();
    } else {
      setVisitAchievements({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cyclePlans, selectedCycle]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, company_name')
        .order('name');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAllDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, specialization, hospital, address, contact_type')
        .eq('contact_type', 'doctor')
        .order('name');
      if (error) throw error;
      setAllDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchCyclePlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cycle_plans')
        .select('*, products(id, name, company_name), doctors(id, name, specialization, hospital)')
        .eq('cycle_start_date', selectedCycle)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setCyclePlans(data || []);
    } catch (error) {
      showError('Failed to load cycle plans.');
      setCyclePlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitAchievements = useCallback(async () => {
    try {
      const monthRanges = getCycleMonthRanges(selectedCycle);
      const doctorIds = [...new Set(cyclePlans.map(p => p.doctor_id))];

      if (doctorIds.length === 0) {
        setVisitAchievements({});
        return;
      }

      // Single query for the entire cycle, group by month on client
      const cycleStart = monthRanges[0].start;
      const cycleEnd = monthRanges[2].end;

      const { data: visits, error } = await supabase
        .from('visits')
        .select('doctor_id, visit_date')
        .in('doctor_id', doctorIds)
        .gte('visit_date', cycleStart)
        .lte('visit_date', cycleEnd)
        .eq('status', 'completed')
        .order('visit_date', { ascending: true });

      if (error) throw error;

      const achievements = {};
      doctorIds.forEach(id => {
        achievements[id] = { month1: [], month2: [], month3: [] };
      });

      (visits || []).forEach(v => {
        if (!achievements[v.doctor_id]) return;
        const date = v.visit_date;
        for (let i = 0; i < 3; i++) {
          if (date >= monthRanges[i].start && date <= monthRanges[i].end) {
            achievements[v.doctor_id][`month${i + 1}`].push(date);
            break;
          }
        }
      });

      setVisitAchievements(achievements);
    } catch (error) {
      console.error('Error fetching visit achievements:', error);
    }
  }, [selectedCycle, cyclePlans]);

  const addDoctorToCycle = async (doctorId) => {
    if (!selectedProductId || !selectedCycle) return;
    try {
      setSubmitting(true);
      const { error } = await supabase.from('cycle_plans').insert({
        cycle_start_date: selectedCycle,
        product_id: selectedProductId,
        doctor_id: doctorId
      });
      if (error) {
        if (error.code === '23505') {
          showError('This doctor is already assigned to this product for the selected cycle.');
        } else {
          throw error;
        }
        return;
      }
      const doctor = allDoctors.find(d => d.id === doctorId);
      showSuccess(`${doctor?.name || 'Doctor'} added to cycle plan.`);
      setDoctorSearch('');
      setShowDoctorDropdown(false);
      await fetchCyclePlans();
    } catch (error) {
      showError('Failed to add doctor to cycle plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeDoctorFromCycle = async (planId, doctorName) => {
    if (!window.confirm(`Remove ${doctorName || 'this doctor'} from the cycle plan?`)) return;
    try {
      const { error } = await supabase.from('cycle_plans').delete().eq('id', planId);
      if (error) throw error;
      showSuccess('Doctor removed from cycle plan.');
      await fetchCyclePlans();
    } catch (error) {
      showError('Failed to remove doctor.');
    }
  };

  // Filter doctors for the dropdown: exclude already-assigned doctors for this product+cycle
  const assignedDoctorIds = cyclePlans
    .filter(p => p.product_id === selectedProductId)
    .map(p => p.doctor_id);

  const filteredDoctors = allDoctors.filter(d => {
    if (assignedDoctorIds.includes(d.id)) return false;
    if (!doctorSearch) return true;
    const search = doctorSearch.toLowerCase();
    return (
      (d.name || '').toLowerCase().includes(search) ||
      (d.specialization || '').toLowerCase().includes(search) ||
      (d.hospital || '').toLowerCase().includes(search)
    );
  });

  // Group plans by product
  const plansByProduct = {};
  cyclePlans.forEach(plan => {
    const pid = plan.product_id;
    if (!plansByProduct[pid]) {
      plansByProduct[pid] = {
        product: plan.products,
        plans: []
      };
    }
    plansByProduct[pid].plans.push(plan);
  });

  return (
    <>
      <CyclePlanning
        selectedCycle={selectedCycle}
        setSelectedCycle={setSelectedCycle}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        cycleOptions={cycleOptions}
        products={products}
        plansByProduct={plansByProduct}
        visitAchievements={visitAchievements}
        cycleMonthRanges={getCycleMonthRanges(selectedCycle)}
        doctorSearch={doctorSearch}
        setDoctorSearch={setDoctorSearch}
        showDoctorDropdown={showDoctorDropdown}
        setShowDoctorDropdown={setShowDoctorDropdown}
        filteredDoctors={filteredDoctors}
        addDoctorToCycle={addDoctorToCycle}
        removeDoctorFromCycle={removeDoctorFromCycle}
        loading={loading}
        submitting={submitting}
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

export default CyclePlanningContainer;
