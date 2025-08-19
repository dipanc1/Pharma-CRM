import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { AddButton } from '../../components';

function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);

      // Fetch doctor details
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (doctorError) throw doctorError;
      setDoctor(doctorData);

      // Fetch doctor's visits with sales data
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select(`
          *,
          sales (
            id,
            quantity,
            total_amount,
            products (name, category)
          )
        `)
        .eq('doctor_id', id)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;
      setVisits(visitsData || []);

    } catch (error) {
      console.error('Error fetching doctor data:', error);
      alert('Error loading doctor details');
    } finally {
      setLoading(false);
    }
  };

  const deleteDoctor = async () => {
    if (window.confirm('Are you sure you want to delete this doctor? This will also delete all associated visits and sales.')) {
      try {
        const { error } = await supabase
          .from('doctors')
          .delete()
          .eq('id', id);

        if (error) throw error;
        alert('Doctor deleted successfully');
        navigate('/doctors');
      } catch (error) {
        console.error('Error deleting doctor:', error);
        alert('Error deleting doctor');
      }
    }
  };

  const calculateTotalSales = (sales) => {
    return sales?.reduce((total, sale) => total + parseFloat(sale.total_amount), 0) || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Doctor not found</div>
        <Link to="/doctors" className="btn-primary mt-4 inline-flex">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/doctors')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Details</h1>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/doctors/${id}/edit`}
            className="btn-secondary flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={deleteDoctor}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <TrashIcon className="h-4 w-4 mr-2 inline" />
            Delete
          </button>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-sm text-gray-900">{doctor.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Specialization</label>
            <p className="mt-1 text-sm text-gray-900">{doctor.specialization || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Hospital/Clinic</label>
            <p className="mt-1 text-sm text-gray-900">{doctor.hospital || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Doctor Class</label>
            <p className="mt-1 text-sm text-gray-900">
              {doctor.doctor_class ? (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${doctor.doctor_class === 'A' ? 'bg-green-100 text-green-800' :
                  doctor.doctor_class === 'B' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                  Class {doctor.doctor_class}
                </span>
              ) : (
                'N/A'
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Doctor Type</label>
            <p className="mt-1 text-sm text-gray-900">
              {doctor.doctor_type ? (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${doctor.doctor_type === 'prescriber' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                  }`}>
                  {doctor.doctor_type.charAt(0).toUpperCase() + doctor.doctor_type.slice(1)}
                </span>
              ) : (
                'N/A'
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Contact Number</label>
            <p className="mt-1 text-sm text-gray-900">{doctor.contact_number || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-sm text-gray-900">{doctor.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Address</label>
            <p className="mt-1 text-sm text-gray-900">{doctor.address || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Visit History */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Visit History</h2>
          <Link to="/visits/add" className="btn-primary flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Add Visit
          </Link>
        </div>

        {visits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Visit Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Total Sales</th>
                  <th className="table-header">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      {format(new Date(visit.visit_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${visit.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {visit.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">
                        ₹{calculateTotalSales(visit.sales).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {visit.sales?.length || 0} items
                      </div>
                    </td>
                    <td className="table-cell text-gray-500 max-w-xs">
                      {visit.notes ? (
                        <div className="truncate" title={visit.notes}>
                          {visit.notes}
                        </div>
                      ) : (
                        'No notes'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500">No visits recorded yet</div>
            <div className="inline-flex mt-4">
              <AddButton title="Add First Visit" link="/visits/add" icon={<CalendarIcon className="h-4 w-4 mr-2" />} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDetail;
