import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { AddButton, Header } from '../../components';
import NoRecordsAddButtonLayout from '../common/NoRecordsAddButtonLayout';

function Doctors() {
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

        const newTotal = totalCount - 1;
        const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
        if (page > maxPage) {
          setPage(maxPage);
        } else {
          fetchDoctors();
        }
      } catch (error) {
        console.error('Error deleting doctor:', error);
        alert('Error deleting doctor: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.hospital?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = !classFilter || doctor.doctor_class === classFilter;
    const matchesType = !typeFilter || doctor.doctor_type === typeFilter;
    
    // Check if address contains the selected city
    const matchesAddress = !addressFilter || (doctor.address && doctor.address.toLowerCase().includes(addressFilter.toLowerCase()));

    return matchesSearch && matchesClass && matchesType && matchesAddress;
  });

  // Apply pagination to filtered results
  const paginatedDoctors = filteredDoctors.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalFilteredCount = filteredDoctors.length;
  const maxPage = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header title="Doctors" buttons={[
        { to: "/doctors/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Doctor" }
      ]} />

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Doctors
            </label>
            <input
              type="text"
              id="search"
              className="input-field"
              placeholder="Search by name, specialization, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="classFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Class
            </label>
            <select
              id="classFilter"
              className="input-field"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              <option value="A">Class A</option>
              <option value="B">Class B</option>
              <option value="C">Class C</option>
            </select>
          </div>
          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              id="typeFilter"
              className="input-field"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="dispenser">Dispenser</option>
              <option value="prescriber">Prescriber</option>
            </select>
          </div>
          <div>
            <label htmlFor="addressFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by City
            </label>
            <select
              id="addressFilter"
              className="input-field"
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
            >
              <option value="">All Cities</option>
              {uniqueAddresses.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {searchTerm || classFilter || typeFilter || addressFilter ? (
              <>Showing {Math.min(pageSize, totalFilteredCount - (page - 1) * pageSize)} of {totalFilteredCount} doctors (filtered from {totalCount} total)</>
            ) : (
              <>Showing {Math.min(pageSize, totalCount - (page - 1) * pageSize)} of {totalCount} doctors</>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={`px-3 py-1 ${
                page === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'btn-secondary hover:bg-gray-300'
              }`}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">Page {page} of {maxPage}</span>
            <button
              className={`px-3 py-1 ${
                page >= maxPage 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'btn-secondary hover:bg-gray-300'
              }`}
              onClick={() => setPage(prev => Math.min(maxPage, prev + 1))}
              disabled={page >= maxPage}
            >
              Next
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Specialization</th>
                <th className="table-header">Hospital</th>
                <th className="table-header">Address</th>
                <th className="table-header">Class</th>
                <th className="table-header">Type</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDoctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">{doctor.name}</div>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">
                    {doctor.specialization || 'N/A'}
                  </td>
                  <td className="table-cell text-gray-500">
                    {doctor.hospital || 'N/A'}
                  </td>
                  <td className="table-cell text-gray-500">
                    {doctor.address || 'N/A'}
                  </td>
                  <td className="table-cell">
                    {doctor.doctor_class ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${doctor.doctor_class === 'A' ? 'bg-green-100 text-green-800' :
                        doctor.doctor_class === 'B' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        Class {doctor.doctor_class}
                      </span>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {doctor.doctor_type ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${doctor.doctor_type === 'prescriber' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                        }`}>
                        {doctor.doctor_type.charAt(0).toUpperCase() + doctor.doctor_type.slice(1)}
                      </span>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="table-cell text-gray-500">
                    {doctor.contact_number || 'N/A'}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <Link
                        to={`/doctors/${doctor.id}`}
                        className="text-primary-600 hover:text-primary-700"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/doctors/${doctor.id}/edit`}
                        className="text-gray-600 hover:text-gray-700"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteDoctor(doctor.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedDoctors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm || classFilter || typeFilter || addressFilter ? 'No doctors found matching your filters.' : 'No doctors added yet.'}
            </div>
            {!searchTerm && !classFilter && !typeFilter && !addressFilter && (
              <NoRecordsAddButtonLayout>
                <AddButton title="Add First Doctor" link="/doctors/add" icon={<PlusIcon className="h-4 w-4 mr-2" />} />
              </NoRecordsAddButtonLayout>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Doctors;
