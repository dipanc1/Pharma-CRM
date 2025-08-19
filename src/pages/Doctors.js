import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
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
        fetchDoctors();
      } catch (error) {
        console.error('Error deleting doctor:', error);
        alert('Error deleting doctor');
      }
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.hospital?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
        <Link to="/doctors/add" className="btn-primary flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Doctor
        </Link>
      </div>

      {/* Search */}
      <div className="card">
        <div className="max-w-md">
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
      </div>

      {/* Doctors List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Specialization</th>
                <th className="table-header">Hospital</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Email</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.map((doctor) => (
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
                    {doctor.contact_number || 'N/A'}
                  </td>
                  <td className="table-cell text-gray-500">
                    {doctor.email || 'N/A'}
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

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm ? 'No doctors found matching your search.' : 'No doctors added yet.'}
            </div>
            {!searchTerm && (
              <Link to="/doctors/add" className="btn-primary mt-4 inline-flex">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Doctor
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Doctors;
