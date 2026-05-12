import React from 'react';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
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
import NoRecordsAddButtonLayout from '../../../components/common/NoRecordsAddButtonLayout';
import { format } from 'date-fns';
import { handleReload } from '../../../helper';

function Visits({
  loading,
  role,
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
  cityFilter,
  setCityFilter,
  cityOptions,
  creatorFilter,
  setCreatorFilter,
  creatorOptions,
  doctorVisitCounts,
  countsLoading,
  doctorPage,
  setDoctorPage,
  doctorPageSize,
  deleteVisit,
  calculateTotalSales,
  filteredVisits,
  totalFilteredCount,
  maxPage,
  showSales
}) {
  const tableHeaders = showSales
    ? ['Contact', 'Type', 'Visit Date', 'Status', 'Added By', 'Total Sales', 'Notes', 'Actions']
    : ['Contact', 'Type', 'Visit Date', 'Status', 'Added By', 'Notes', 'Actions'];

  const statusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'other', label: 'Other' }
  ];

  const cityFilterOptions = cityOptions.map(city => ({
    value: city,
    label: city
  }));

  const getVisitStatusStyle = (status) => {
    return status === 'completed'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const hasActiveFilters = searchTerm || startDate || endDate || statusFilter !== 'all' || cityFilter || creatorFilter !== 'all';

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      <Header title="Visits" buttons={[
        { to: "/visits/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Visit" },
        { onClick: handleReload, icon: <ArrowPathIcon className="h-4 w-4 mr-2" />, title: 'Refresh' }
      ]} />

      <div className="card">
        <div className={`grid grid-cols-1 ${role === 'owner' ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-4`}>

          <SearchInput
            label="Search Visits"
            placeholder="Search by name, hospital, status or notes..."
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

          {/* Status Filter */}
          <FilterSelect
            label="Status"
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={statusOptions}
            placeholder="All"
          />

          <FilterSelect
            label="City"
            id="cityFilter"
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            options={cityFilterOptions}
            placeholder="All Cities"
          />

          {role === 'owner' && (
            <FilterSelect
              label="Added By"
              id="creatorFilter"
              value={creatorFilter}
              onChange={(e) => { setCreatorFilter(e.target.value); setPage(1); }}
              options={creatorOptions.map(creator => ({ value: creator, label: creator }))}
              placeholder="All Users"
            />
          )}
        </div>
      </div>

      {/* Visit Frequency Section */}
      {(startDate && endDate && endDate >= startDate && doctorVisitCounts.filter(d => d.doctor?.contact_type !== 'chemist').length > 0) && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Doctor Visit Frequency
                {cityFilter && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (City: {cityFilter})
                  </span>
                )}
              </h3>
              <div className="text-sm text-gray-600 mt-1">
                {(() => {
                  const filteredDoctors = (doctorVisitCounts || [])
                    .filter(d => d.doctor?.contact_type !== 'chemist')
                    .filter(d =>
                      !searchTerm
                        ? true
                        : (d.doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (d.doctor?.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (d.doctor?.hospital || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (d.doctor?.city || '').toLowerCase().includes(searchTerm.toLowerCase())
                    );
                  const totalDoctors = filteredDoctors.length;
                  const showingStart = Math.min(doctorPageSize, Math.max(0, totalDoctors - (doctorPage - 1) * doctorPageSize));
                  return `Showing ${showingStart} of ${totalDoctors} doctors`;
                })()}
              </div>
            </div>

            {(() => {
              const filteredDoctors = (doctorVisitCounts || [])
                .filter(d => d.doctor?.contact_type !== 'chemist')
                .filter(d =>
                  !searchTerm
                    ? true
                    : (d.doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (d.doctor?.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (d.doctor?.hospital || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (d.doctor?.city || '').toLowerCase().includes(searchTerm.toLowerCase())
                );
              const maxDoctorPage = Math.max(1, Math.ceil(filteredDoctors.length / doctorPageSize));
              return (
                <Pagination
                  currentPage={doctorPage}
                  totalPages={maxDoctorPage}
                  onPageChange={setDoctorPage}
                  showInfo={false}
                />
              );
            })()}
          </div>

          {countsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor Name
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visits
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Met
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const filteredDoctors = (doctorVisitCounts || [])
                      .filter(d => d.doctor?.contact_type !== 'chemist')
                      .filter(d =>
                        !searchTerm
                          ? true
                          : (d.doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.doctor?.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.doctor?.hospital || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.doctor?.city || '').toLowerCase().includes(searchTerm.toLowerCase())
                      );
                    const paginatedDoctors = filteredDoctors.slice(
                      (doctorPage - 1) * doctorPageSize,
                      doctorPage * doctorPageSize
                    );
                    
                    return paginatedDoctors.map(d => (
                      <tr key={d.doctor_id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{d.doctor?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{d.doctor?.specialization}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                            {d.count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {d.lastVisitDate ? format(new Date(d.lastVisitDate), 'MMM dd, yyyy') : 'N/A'}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Visits List */}
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
            {filteredVisits.map((visit) => {
              const isChemist = visit.doctors?.contact_type === 'chemist';
              return (
                <Table.Row key={visit.id}>
                  <Table.Cell>
                    <div>
                      <div className="font-medium text-gray-900">{visit.doctors?.name}</div>
                      <div className="text-sm text-gray-500">
                        {isChemist ? (
                          <>
                            {visit.doctors?.hospital && visit.doctors.hospital}
                            {visit.doctors?.hospital && visit.doctors?.address && ' • '}
                            {visit.doctors?.address && visit.doctors.address}
                          </>
                        ) : (
                          <>
                            {visit.doctors?.specialization} • {visit.doctors?.hospital}
                            {visit.doctors?.address && (
                              <span className="ml-1">• {visit.doctors.address}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isChemist
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-indigo-100 text-indigo-800'
                      }`}>
                      {isChemist ? 'Chemist' : 'Doctor'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    {format(new Date(visit.visit_date), 'MMM dd, yyyy')}
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge
                      value={visit.status}
                      getStyleFunction={getVisitStatusStyle}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-gray-600">
                      {visit.created_by || 'Unknown'}
                    </span>
                  </Table.Cell>
                  {showSales && (
                    <Table.Cell>
                      <div className="font-medium text-gray-900">
                        ₹{calculateTotalSales(visit.sales).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {visit.sales?.length || 0} items
                      </div>
                    </Table.Cell>
                  )}
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
                    <ActionButtons
                      viewPath={`/visits/${visit.id}`}
                      editPath={`/visits/${visit.id}/edit`}
                      onDelete={() => deleteVisit(visit.id)}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
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