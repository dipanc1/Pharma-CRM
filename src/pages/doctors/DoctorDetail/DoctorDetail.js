import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, CalendarIcon, PlusIcon, TrashIcon, GiftIcon } from '@heroicons/react/24/outline';
import { 
  AddButton, 
  BackTitleAndButton, 
  DeleteButton, 
  Loader, 
  SecondaryButton,
  Table,
  StatusBadge,
  InfoField,
  NoRecordsAddButtonLayout
} from '../../../components';
import { format, parseISO } from 'date-fns';

function DoctorDetail({ 
  doctor, 
  visits, 
  importantDates,
  loading, 
  deleteDoctor, 
  calculateTotalSales, 
  getDoctorClassStyle, 
  getDoctorTypeStyle, 
  getVisitStatusStyle, 
  formatCurrency,
  addImportantDate,
  deleteImportantDate
}) {
  const { id } = useParams();
  const visitTableHeaders = ['Visit Date', 'Status', 'Total Sales', 'Notes'];
  const [showAddDateForm, setShowAddDateForm] = useState(false);
  const [newDate, setNewDate] = useState({ label: '', date: '', notes: '', is_recurring: false });
  const [addingDate, setAddingDate] = useState(false);
  
  const isChemist = doctor?.contact_type === 'chemist';
  const pageTitle = isChemist ? 'Chemist Details' : 'Doctor Details';

  const handleAddDate = async (e) => {
    e.preventDefault();
    setAddingDate(true);
    await addImportantDate(newDate);
    setNewDate({ label: '', date: '', notes: '', is_recurring: false });
    setShowAddDateForm(false);
    setAddingDate(false);
  };

  return loading ? (
    <Loader />
  ) : !doctor ? (
    <div className="text-center py-12">
      <div className="text-gray-500">Contact not found</div>
      <Link to="/doctors" className="btn-primary mt-4 inline-flex">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Contacts
      </Link>
    </div>
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackTitleAndButton title={pageTitle} backButtonPath="/doctors" />
        <div className="flex space-x-3">
          <SecondaryButton
            link={`/doctors/${id}/edit`}
            icon={<PencilIcon className="h-4 w-4 mr-2" />}
          >
            Edit
          </SecondaryButton>
          <DeleteButton onDelete={deleteDoctor} />
        </div>
      </div>

      {/* Contact Type Badge */}
      {isChemist && (
        <div className="card bg-teal-50 border border-teal-200">
          <div className="flex items-center">
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-teal-100 text-teal-800">
              Chemist/Pharmacy
            </span>
            <p className="ml-3 text-sm text-teal-700">
              This is a chemist contact. Doctor-specific fields are not applicable.
            </p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isChemist ? 'Business Information' : 'Personal Information'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField 
            label={isChemist ? 'Business Name' : 'Name'} 
            value={doctor.name} 
          />
          
          {!isChemist && doctor.specialization && (
            <InfoField label="Specialization" value={doctor.specialization} />
          )}
          
          <InfoField 
            label={isChemist ? 'Location' : 'Hospital/Clinic'} 
            value={doctor.hospital || 'N/A'} 
          />
          
          {!isChemist && doctor.doctor_class && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Doctor Class</label>
              <p className="mt-1 text-sm text-gray-900">
                <StatusBadge
                  value={doctor.doctor_class}
                  getStyleFunction={getDoctorClassStyle}
                  prefix="Class "
                />
              </p>
            </div>
          )}
          
          {!isChemist && doctor.doctor_type && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Doctor Type</label>
              <p className="mt-1 text-sm text-gray-900">
                <StatusBadge
                  value={doctor.doctor_type}
                  getStyleFunction={getDoctorTypeStyle}
                />
              </p>
            </div>
          )}
          
          <InfoField label="Contact Number" value={doctor.contact_number || 'N/A'} />
          <InfoField label="Email" value={doctor.email || 'N/A'} />
          <InfoField label="Address" value={doctor.address || 'N/A'} />
        </div>
      </div>

      {/* Important Dates */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Important Dates</h2>
          <button
            onClick={() => setShowAddDateForm(!showAddDateForm)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Date
          </button>
        </div>

        {/* Add Date Form */}
        {showAddDateForm && (
          <form onSubmit={handleAddDate} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g., Birthday, Anniversary"
                  value={newDate.label}
                  onChange={(e) => setNewDate(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={newDate.date}
                  onChange={(e) => setNewDate(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Optional notes"
                  value={newDate.notes}
                  onChange={(e) => setNewDate(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  checked={newDate.is_recurring}
                  onChange={(e) => setNewDate(prev => ({ ...prev, is_recurring: e.target.checked }))}
                />
                <span className="ml-2 text-sm text-gray-700">Recurring yearly</span>
                <span className="ml-1 text-xs text-gray-400">(e.g., birthday, anniversary)</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2 mt-3">
              <button
                type="button"
                onClick={() => { setShowAddDateForm(false); setNewDate({ label: '', date: '', notes: '', is_recurring: false }); }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingDate}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {addingDate ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {/* Dates List */}
        {importantDates.length > 0 ? (
          <div className="space-y-3">
            {importantDates.map((dateEntry) => {
              const parsedDate = parseISO(dateEntry.date);
              const today = new Date();
              const isToday = parsedDate.getMonth() === today.getMonth() && parsedDate.getDate() === today.getDate();
              
              return (
                <div
                  key={dateEntry.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isToday
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      isToday ? 'bg-yellow-100' : 'bg-primary-50'
                    }`}>
                      <GiftIcon className={`h-5 w-5 ${
                        isToday ? 'text-yellow-600' : 'text-primary-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{dateEntry.label}</span>
                        {dateEntry.is_recurring && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                            Yearly
                          </span>
                        )}
                        {isToday && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Today!
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(parsedDate, 'MMMM dd, yyyy')}
                        {dateEntry.notes && ` — ${dateEntry.notes}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteImportantDate(dateEntry.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove date"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : !showAddDateForm ? (
          <div className="text-center py-6">
            <GiftIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 text-sm">No important dates added yet</p>
          </div>
        ) : null}
      </div>

      {/* Visit History */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Visit History</h2>
          <AddButton
            title="Add Visit"
            link="/visits/add"
            icon={<CalendarIcon className="h-4 w-4 mr-2" />}
          />
        </div>

        {visits.length > 0 ? (
          <Table headers={visitTableHeaders}>
            {visits.map((visit) => (
              <Table.Row key={visit.id}>
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
                  <div className="font-medium text-gray-900">
                    {formatCurrency(calculateTotalSales(visit.sales))}
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
              </Table.Row>
            ))}
          </Table>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500">No visits recorded yet</div>
            <NoRecordsAddButtonLayout>
              <AddButton 
                title="Add First Visit" 
                link="/visits/add" 
                icon={<CalendarIcon className="h-4 w-4 mr-2" />} 
              />
            </NoRecordsAddButtonLayout>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDetail;