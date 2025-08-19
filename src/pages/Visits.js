import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

function Visits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          doctors (name, specialization, hospital),
          sales (
            id,
            quantity,
            total_amount,
            products (name)
          )
        `)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteVisit = async (id) => {
    if (window.confirm('Are you sure you want to delete this visit? This will also delete all associated sales.')) {
      try {
        const { error } = await supabase
          .from('visits')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchVisits();
      } catch (error) {
        console.error('Error deleting visit:', error);
        alert('Error deleting visit');
      }
    }
  };

  const calculateTotalSales = (sales) => {
    return sales?.reduce((total, sale) => total + parseFloat(sale.total_amount), 0) || 0;
  };

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = 
      visit.doctors?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.doctors?.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || visit.visit_date === dateFilter;
    
    return matchesSearch && matchesDate;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Doctor Visits</h1>
        <Link to="/visits/add" className="btn-primary flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Visit
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Visits
            </label>
            <input
              type="text"
              id="search"
              className="input-field"
              placeholder="Search by doctor name, specialization, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <input
              type="date"
              id="dateFilter"
              className="input-field"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Visits List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Doctor</th>
                <th className="table-header">Visit Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Total Sales</th>
                <th className="table-header">Notes</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVisits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">{visit.doctors?.name}</div>
                      <div className="text-sm text-gray-500">
                        {visit.doctors?.specialization} • {visit.doctors?.hospital}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {format(new Date(visit.visit_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      visit.status === 'completed' 
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
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <Link
                        to={`/visits/${visit.id}`}
                        className="text-primary-600 hover:text-primary-700"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/visits/${visit.id}/edit`}
                        className="text-gray-600 hover:text-gray-700"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteVisit(visit.id)}
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

        {filteredVisits.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm || dateFilter ? 'No visits found matching your filters.' : 'No visits recorded yet.'}
            </div>
            {!searchTerm && !dateFilter && (
              <Link to="/visits/add" className="btn-primary mt-4 inline-flex">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Visit
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Visits;
