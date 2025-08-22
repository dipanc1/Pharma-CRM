import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { 
  AddButton, 
  BackTitleAndButton, 
  DeleteButton, 
  Loader, 
  SecondaryButton,
  Table,
  StatusBadge,
  InfoField
} from '../../../components';
import NoRecordsAddButtonLayout from '../../common/NoRecordsAddButtonLayout';
import { format } from 'date-fns';

function DoctorDetail({ doctor, visits, loading, deleteDoctor, calculateTotalSales, getDoctorClassStyle, getDoctorTypeStyle, getVisitStatusStyle, formatCurrency }) {
  const { id } = useParams();
  const visitTableHeaders = ['Visit Date', 'Status', 'Total Sales', 'Notes'];

  return loading ? (
    <Loader />
  ) : !doctor ? (
    <div className="text-center py-12">
      <div className="text-gray-500">Doctor not found</div>
      <Link to="/doctors" className="btn-primary mt-4 inline-flex">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Doctors
      </Link>
    </div>
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackTitleAndButton title="Doctor Details" backButtonPath="/doctors" />
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

      {/* Personal Information */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Name" value={doctor.name} />
          <InfoField label="Specialization" value={doctor.specialization} />
          <InfoField label="Hospital/Clinic" value={doctor.hospital} />
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
          <div>
            <label className="block text-sm font-medium text-gray-500">Doctor Type</label>
            <p className="mt-1 text-sm text-gray-900">
              <StatusBadge
                value={doctor.doctor_type}
                getStyleFunction={getDoctorTypeStyle}
              />
            </p>
          </div>
          <InfoField label="Contact Number" value={doctor.contact_number} />
          <InfoField label="Email" value={doctor.email} />
          <InfoField label="Address" value={doctor.address} />
        </div>
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
