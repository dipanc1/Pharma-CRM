import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Toast } from '../../../components';
import useToast from '../../../hooks/useToast';
import Doctors from './Doctors';

function DoctorsContainer() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [uniqueAddresses, setUniqueAddresses] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [contactTypeFilter, setContactTypeFilter] = useState('');

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.hospital?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = !classFilter || doctor.doctor_class === classFilter;
    const matchesType = !typeFilter || doctor.doctor_type === typeFilter;
    const matchesContactType = !contactTypeFilter || doctor.contact_type === contactTypeFilter;
    const matchesAddress = !addressFilter || (doctor.address && doctor.address.toLowerCase().includes(addressFilter.toLowerCase()));

    return matchesSearch && matchesClass && matchesType && matchesContactType && matchesAddress;
  });

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, classFilter, typeFilter, addressFilter]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      // Fetch all doctors for filtering
      const { data, error, count } = await supabase
        .from('doctors')
        .select('*', { count: 'exact' })
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setDoctors(data || []);
      setTotalCount(count || 0);
      
      // Extract unique cities from addresses (assuming city is the last part after last comma)
      const cities = [...new Set((data || [])
        .map(doctor => {
          if (!doctor.address || doctor.address.trim() === '') return null;
          // Extract city from address - assuming it's the last part after comma
          const parts = doctor.address.split(',');
          return parts[parts.length - 1].trim();
        })
        .filter(city => city && city !== '')
      )].sort();
      setUniqueAddresses(cities);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      showError('Error loading doctors. Please try again.');
      setDoctors([]);
      setTotalCount(0);
      setUniqueAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteDoctor = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const { error } = await supabase
          .from('doctors')
          .delete()
          .eq('id', id);

        if (error) throw error;

        showSuccess('Doctor deleted successfully');
        const newTotal = totalCount - 1;
        const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
        if (page > maxPage) {
          setPage(maxPage);
        } else {
          fetchDoctors();
        }
      } catch (error) {
        console.error('Error deleting doctor:', error);
        showError('Error deleting doctor: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Apply pagination to filtered results
  const paginatedDoctors = filteredDoctors.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalFilteredCount = filteredDoctors.length;
  const maxPage = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  return (
    <>
      <Doctors
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        addressFilter={addressFilter}
        setAddressFilter={setAddressFilter}
        uniqueAddresses={uniqueAddresses}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        totalCount={totalCount}
        deleteDoctor={deleteDoctor}
        paginatedDoctors={paginatedDoctors}
        totalFilteredCount={totalFilteredCount}
        maxPage={maxPage}
        contactTypeFilter={contactTypeFilter}
        setContactTypeFilter={setContactTypeFilter}
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

export default DoctorsContainer;