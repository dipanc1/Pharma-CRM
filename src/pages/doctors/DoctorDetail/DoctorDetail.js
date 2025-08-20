import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { AddButton, BackTitleAndButton, DeleteButton, Loader, SecondaryButton } from '../../../components';
import VisitsTable from './components/VisitTable/VisitsTable';
import EmptyVisits from './components/EmptyVisits';
import InfoField from './components/InfoField';
import BadgeField from './components/BadgeField';


function DoctorDetail({ doctor, visits, loading, deleteDoctor, calculateTotalSales, getDoctorClassStyle, getDoctorTypeStyle, getVisitStatusStyle, formatCurrency }) {
  const { id } = useParams();

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

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Name" value={doctor.name} />
          <InfoField label="Specialization" value={doctor.specialization} />
          <InfoField label="Hospital/Clinic" value={doctor.hospital} />
          <BadgeField
            label="Doctor Class"
            value={doctor.doctor_class}
            getBadgeStyle={getDoctorClassStyle}
            prefix="Class "
          />
          <BadgeField
            label="Doctor Type"
            value={doctor.doctor_type}
            getBadgeStyle={getDoctorTypeStyle}
          />
          <InfoField label="Contact Number" value={doctor.contact_number} />
          <InfoField label="Email" value={doctor.email} />
          <InfoField label="Address" value={doctor.address} />
        </div>
      </div>
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
          <VisitsTable 
            visits={visits} 
            calculateTotalSales={calculateTotalSales}
            getVisitStatusStyle={getVisitStatusStyle}
            formatCurrency={formatCurrency}
          />
        ) : (
          <EmptyVisits />
        )}
      </div>
    </div>
  );
}

export default DoctorDetail;
