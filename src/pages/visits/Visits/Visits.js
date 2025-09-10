import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { 
  Header, 
  SearchInput,
  FilterSelect,
  Table,
  ActionButtons,
  Loader,
  AddButton,
  StatusBadge,
  Pagination
} from '../../../components';
import NoRecordsAddButtonLayout from '../../common/NoRecordsAddButtonLayout';
import { format } from 'date-fns';

function Visits({
  loading,
  searchTerm,
  setSearchTerm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  page,
  setPage,
  pageSize,
  totalCount,
  statusFilter,
  setStatusFilter,
  doctorVisitCounts,
  countsLoading,
  deleteVisit,
  calculateTotalSales,
  filteredVisits,
  totalFilteredCount,
  maxPage
}) {
  const tableHeaders = ['Doctor', 'Visit Date', 'Status', 'Total Sales', 'Notes', 'Actions'];
  
  const statusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'other', label: 'Other' }
  ];

  const getVisitStatusStyle = (status) => {
    return status === 'completed'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const hasActiveFilters = searchTerm || startDate || endDate || statusFilter !== 'all';

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      <Header title="Doctor Visits" buttons={[
        { to: "/visits/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Visit" }
      ]} />

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <SearchInput
            label="Search Visits"
            placeholder="Search by doctor name, specialization, status or notes..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            id="visit_search"
          />
          
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
            {startDate && endDate && endDate < startDate && (
              <p className="mt-1 text-xs text-red-600">End date cannot be earlier than start date.</p>
            )}
            {startDate && !endDate && (
              <p className="mt-1 text-xs text-gray-500">Select end date to apply the date range.</p>
            )}
          </div>
          
          {/* Status Filter - Using FilterSelect component */}
          <FilterSelect
            label="Status"
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={statusOptions}
            placeholder="All"
          />
        </div>
      </div>

      {(startDate && endDate && endDate >= startDate && doctorVisitCounts.length > 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Doctor Visit Frequency in Selected Period
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
                  (d.doctor?.hospital || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (d.doctor?.city || '').toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(d => (
                <span
                  key={d.doctor_id}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                    d.count === 0
                      ? 'bg-gray-50 text-gray-700 border-gray-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                  title={`${d.doctor?.name || 'Unknown'} — ${d.count} visit(s) in period${d.doctor?.city ? ` • ${d.doctor.city}` : ''}`}
                >
                  {(d.doctor?.name || 'Unknown')}: {d.count}
                  {d.doctor?.city && (
                    <span className="ml-1 text-gray-500">• {d.doctor.city}</span>
                  )}
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Visits List
              {hasActiveFilters && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({totalFilteredCount} filtered)
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-600 mt-1">
              {hasActiveFilters ? (
                <>Showing {Math.min(pageSize, Math.max(0, totalFilteredCount - (page - 1) * pageSize))} of {totalFilteredCount} visits (filtered from {totalCount} total)</>
              ) : (
                <>Showing {Math.min(pageSize, Math.max(0, totalCount - (page - 1) * pageSize))} of {totalCount} visits</>
              )}
            </div>
          </div>
          
          <Pagination
            currentPage={page}
            totalPages={maxPage}
            onPageChange={setPage}
            showInfo={false}
          />
        </div>

        {filteredVisits.length > 0 ? (
          <Table headers={tableHeaders}>
            {filteredVisits.map((visit) => (
              <Table.Row key={visit.id}>
                <Table.Cell>
                  <div>
                    <div className="font-medium text-gray-900">{visit.doctors?.name}</div>
                    <div className="text-sm text-gray-500">
                      {visit.doctors?.specialization} • {visit.doctors?.hospital}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {format(new Date(visit.visit_date), 'MMM dd, yyyy')}
                </Table.Cell>
                <Table.Cell>
                  {/* Using StatusBadge component */}
                  <StatusBadge
                    value={visit.status}
                    getStyleFunction={getVisitStatusStyle}
                  />
                </Table.Cell>
                <Table.Cell>
                  <div className="font-medium text-gray-900">
                    ₹{calculateTotalSales(visit.sales).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {visit.sales?.length || 0} items
                  </div>
                </Table.Cell>
                <Table.Cell className="max-w-xs">
                  {visit.notes ? (
                    <div className="truncate" title={visit.notes}>
                      {visit.notes}
                    </div>
                  ) : (
                    'No notes'
                  )}
                </Table.Cell>
                <Table.Cell>
                  {/* Using ActionButtons component */}
                  <ActionButtons
                    viewPath={`/visits/${visit.id}`}
                    editPath={`/visits/${visit.id}/edit`}
                    onDelete={() => deleteVisit(visit.id)}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {hasActiveFilters ? 'No visits found matching your filters.' : 'No visits recorded yet.'}
            </div>
            {!hasActiveFilters && (
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