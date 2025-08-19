import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { AddButton, Header } from '../../components';
import NoRecordsAddButtonLayout from '../common/NoRecordsAddButtonLayout';

function Visits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // New: status filter
  const [statusFilter, setStatusFilter] = useState('all');

  // New state: aggregated counts by doctor for the selected period
  const [doctorVisitCounts, setDoctorVisitCounts] = useState([]);
  const [countsLoading, setCountsLoading] = useState(false);

  useEffect(() => {
    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, page, pageSize, statusFilter]);

  // New effect: fetch visit counts per doctor for the selected period (not paginated)
  useEffect(() => {
    fetchDoctorVisitCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, statusFilter]); // include status filter

  const fetchVisits = async () => {
    try {
      setLoading(true);

      // Date validation and short-circuit rules
      const justStart = !!(startDate && !endDate);
      const justEnd = !!(!startDate && endDate);
      const invalidRange = !!(startDate && endDate && endDate < startDate);

      if (justStart || justEnd || invalidRange) {
        setVisits([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      let query = supabase
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
        `, { count: 'exact' })
        .order('visit_date', { ascending: false });

      // Apply date filters only when both dates are selected and valid
      if (startDate && endDate) {
        query = query.gte('visit_date', startDate).lte('visit_date', endDate);
      }

      // Apply status filter on server-side
      if (statusFilter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (statusFilter === 'other') {
        query = query.neq('status', 'completed');
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setVisits(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  // New helper: fetch all visits in range and group by doctor
  const fetchDoctorVisitCounts = async () => {
    try {
      // Only query when both dates are selected and valid
      const noDates = !startDate && !endDate;
      const justStart = !!(startDate && !endDate);
      const justEnd = !!(!startDate && endDate);
      const invalidRange = !!(startDate && endDate && endDate < startDate);

      if (noDates || justStart || justEnd || invalidRange) {
        setDoctorVisitCounts([]);
        return;
      }

      setCountsLoading(true);
      let query = supabase
        .from('visits')
        .select(`
          doctor_id,
          status,
          doctors (name, specialization, hospital)
        `);

      // Valid full range
      query = query.gte('visit_date', startDate).lte('visit_date', endDate);

      // Apply status filter
      if (statusFilter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (statusFilter === 'other') {
        query = query.neq('status', 'completed');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by doctor_id
      const map = new Map();
      (data || []).forEach((row) => {
        if (!row.doctor_id) return;
        const existing = map.get(row.doctor_id) || {
          doctor_id: row.doctor_id,
          doctor: row.doctors,
          count: 0,
        };
        existing.count += 1;
        if (!existing.doctor && row.doctors) existing.doctor = row.doctors;
        map.set(row.doctor_id, existing);
      });

      const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
      setDoctorVisitCounts(list);
    } catch (err) {
      console.error('Error fetching doctor visit counts:', err);
      setDoctorVisitCounts([]);
    } finally {
      setCountsLoading(false);
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
    // Safer search handling
    const matchesSearch =
      (visit.doctors?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visit.doctors?.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visit.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visit.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
      <Header title="Doctor Visits" buttons={[
        { to: "/visits/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Visit" }
      ]} />

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Visits
            </label>
            <input
              type="text"
              id="search"
              className="input-field"
              placeholder="Search by doctor name, specialization, status or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="input-field"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
            {/* Hint when only end date is selected */}
            {endDate && !startDate && (
              <p className="mt-1 text-xs text-gray-500">Select start date to apply the date range.</p>
            )}
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="input-field"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
            {/* Inline validation/help text */}
            {startDate && endDate && endDate < startDate && (
              <p className="mt-1 text-xs text-red-600">End date cannot be earlier than start date.</p>
            )}
            {startDate && !endDate && (
              <p className="mt-1 text-xs text-gray-500">Select end date to apply the date range.</p>
            )}
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="statusFilter"
              className="input-field"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visit Frequency summary: only when both dates are selected and valid */}
      {(startDate && endDate && endDate >= startDate && doctorVisitCounts.length > 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Visit Frequency in Selected Period
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Status: {statusFilter}</span>
              {countsLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(doctorVisitCounts || [])
              .filter(d =>
                !searchTerm
                  ? true
                  : (d.doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (d.doctor?.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (d.doctor?.hospital || '').toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(d => (
                <span
                  key={d.doctor_id}
                  className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium border border-blue-200"
                  title={`${d.doctor?.name || 'Unknown'} — ${d.count} visit(s) in period`}
                >
                  {(d.doctor?.name || 'Unknown')}: {d.count}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Visits List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredVisits.length} of {totalCount} visits
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="btn-secondary px-3 py-1"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">Page {page}</span>
            <button
              className="btn-secondary px-3 py-1"
              onClick={() => {
                const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
                setPage(prev => Math.min(maxPage, prev + 1));
              }}
              disabled={page >= Math.ceil(totalCount / pageSize)}
            >
              Next
            </button>
          </div>
        </div>
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
              {searchTerm || startDate || endDate ? 'No visits found matching your filters.' : 'No visits recorded yet.'}
            </div>
            {!searchTerm && !startDate && !endDate && (
              <NoRecordsAddButtonLayout>
                <AddButton title="Add First Visit" link="/visits/add" icon={<PlusIcon className="h-4 w-4 mr-2" />} />
              </NoRecordsAddButtonLayout>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Visits;
