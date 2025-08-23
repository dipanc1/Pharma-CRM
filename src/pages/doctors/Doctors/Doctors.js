import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { 
  AddButton, 
  Header, 
  SearchInput, 
  FilterSelect, 
  FilterBadge, 
  Pagination, 
  StatusBadge, 
  Table, 
  ActionButtons,
  Loader
} from '../../../components';
import NoRecordsAddButtonLayout from '../../common/NoRecordsAddButtonLayout';

function Doctors({
  doctors,
  loading,
  searchTerm,
  setSearchTerm,
  classFilter,
  setClassFilter,
  typeFilter,
  setTypeFilter,
  addressFilter,
  setAddressFilter,
  uniqueAddresses,
  page,
  setPage,
  pageSize,
  totalCount,
  deleteDoctor,
  filteredDoctors,
  paginatedDoctors,
  totalFilteredCount,
  maxPage
}) {
  const clearFilters = () => {
    setSearchTerm('');
    setClassFilter('');
    setTypeFilter('');
    setAddressFilter('');
  };

  const hasActiveFilters = searchTerm || classFilter || typeFilter || addressFilter;

  const getDoctorClassStyle = (doctorClass) => {
    const styles = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-yellow-100 text-yellow-800'
    };
    return styles[doctorClass] || styles.C;
  };

  const getDoctorTypeStyle = (doctorType) => {
    return doctorType === 'prescriber'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-orange-100 text-orange-800';
  };

  const classOptions = [
    { value: 'A', label: 'Class A' },
    { value: 'B', label: 'Class B' },
    { value: 'C', label: 'Class C' }
  ];

  const typeOptions = [
    { value: 'dispenser', label: 'Dispenser' },
    { value: 'prescriber', label: 'Prescriber' }
  ];

  const addressOptions = uniqueAddresses.map(city => ({ value: city, label: city }));

  const tableHeaders = [
    'Name', 'Specialization', 'Hospital', 'Address', 'Class', 'Type', 'Contact', 'Actions'
  ];

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <Header title="Doctors" buttons={[
        { to: "/doctors/add", icon: <PlusIcon className="h-4 w-4 mr-2" />, title: "Add Doctor" }
      ]} />

      {/* Search and Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Search & Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SearchInput
            label="Search Doctors"
            placeholder="Search by name, specialization, hospital..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <FilterSelect
            label="Filter by Class"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            options={classOptions}
            placeholder="All Classes"
            id="classFilter"
          />
          
          <FilterSelect
            label="Filter by Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOptions}
            placeholder="All Types"
            id="typeFilter"
          />
          
          <FilterSelect
            label="Filter by City"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            options={addressOptions}
            placeholder="All Cities"
            id="addressFilter"
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <FilterBadge
                label="Search"
                value={`"${searchTerm}"`}
                onRemove={() => setSearchTerm('')}
                colorClass="bg-blue-100 text-blue-800"
              />
            )}
            {classFilter && (
              <FilterBadge
                label="Class"
                value={classFilter}
                onRemove={() => setClassFilter('')}
                colorClass="bg-green-100 text-green-800"
              />
            )}
            {typeFilter && (
              <FilterBadge
                label="Type"
                value={typeFilter}
                onRemove={() => setTypeFilter('')}
                colorClass="bg-purple-100 text-purple-800"
              />
            )}
            {addressFilter && (
              <FilterBadge
                label="City"
                value={addressFilter}
                onRemove={() => setAddressFilter('')}
                colorClass="bg-orange-100 text-orange-800"
              />
            )}
          </div>
        )}
      </div>

      {/* Doctors List */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Doctors List
              {hasActiveFilters && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({totalFilteredCount} filtered)
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-600 mt-1">
              {hasActiveFilters ? (
                <>Showing {Math.min(pageSize, Math.max(0, totalFilteredCount - (page - 1) * pageSize))} of {totalFilteredCount} doctors (filtered from {totalCount} total)</>
              ) : (
                <>Showing {Math.min(pageSize, Math.max(0, totalCount - (page - 1) * pageSize))} of {totalCount} doctors</>
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

        {paginatedDoctors.length > 0 ? (
          <Table headers={tableHeaders}>
            {paginatedDoctors.map((doctor) => (
              <Table.Row key={doctor.id}>
                <Table.Cell className="font-medium text-gray-900">
                  {doctor.name}
                </Table.Cell>
                <Table.Cell>
                  {doctor.specialization || 'N/A'}
                </Table.Cell>
                <Table.Cell>
                  {doctor.hospital || 'N/A'}
                </Table.Cell>
                <Table.Cell className="max-w-xs truncate">
                  {doctor.address || 'N/A'}
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge
                    value={doctor.doctor_class}
                    getStyleFunction={getDoctorClassStyle}
                    prefix="Class "
                  />
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge
                    value={doctor.doctor_type}
                    getStyleFunction={getDoctorTypeStyle}
                  />
                </Table.Cell>
                <Table.Cell>
                  {doctor.contact_number || 'N/A'}
                </Table.Cell>
                <Table.Cell>
                  <ActionButtons
                    viewPath={`/doctors/${doctor.id}`}
                    editPath={`/doctors/${doctor.id}/edit`}
                    onDelete={() => deleteDoctor(doctor.id)}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {hasActiveFilters ? 'No doctors found matching your filters.' : 'No doctors added yet.'}
            </div>
            {!hasActiveFilters ? (
              <NoRecordsAddButtonLayout>
                <AddButton title="Add First Doctor" link="/doctors/add" icon={<PlusIcon className="h-4 w-4 mr-2" />} />
              </NoRecordsAddButtonLayout>
            ) : (
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Doctors;