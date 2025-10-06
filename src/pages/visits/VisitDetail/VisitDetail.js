import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import {
  BackTitleAndButton,
  DeleteButton,
  SecondaryButton,
  Table,
  StatusBadge,
  InfoField,
  Loader
} from '../../../components';
import { format } from 'date-fns';

function VisitDetail({
  visit,
  loading,
  deleteVisit,
  calculateTotalSales,
  getVisitStatusStyle,
  formatCurrency
}) {
  const { id } = useParams();
  const salesTableHeaders = ['Product', 'Company Name', 'Quantity', 'Unit Price', 'Total'];

  return loading ? (
    <Loader />
  ) : !visit ? (
    <div className="text-center py-12">
      <div className="text-gray-500">Visit not found</div>
      <Link to="/visits" className="btn-primary mt-4 inline-flex">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Visits
      </Link>
    </div>
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackTitleAndButton title="Visit Details" backButtonPath="/visits" />
        <div className="flex space-x-3">
          <SecondaryButton
            link={`/visits/${id}/edit`}
            icon={<PencilIcon className="h-4 w-4 mr-2" />}
          >
            Edit
          </SecondaryButton>
          <DeleteButton onDelete={deleteVisit} />
        </div>
      </div>

      {/* Visit Information */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Visit Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <InfoField label="Doctor" value={visit.doctors?.name} />
            <p className="text-xs text-gray-500 mt-1">
              {visit.doctors?.specialization} • {visit.doctors?.hospital}
            </p>
          </div>
          <InfoField
            label="Visit Date"
            value={format(new Date(visit.visit_date), 'MMMM dd, yyyy')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1">
              <StatusBadge
                value={visit.status}
                getStyleFunction={getVisitStatusStyle}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Total Sales</label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatCurrency(calculateTotalSales(visit.sales))}
            </p>
          </div>
          <div className="md:col-span-2">
            <InfoField
              label="Notes"
              value={visit.notes || 'No notes recorded'}
            />
          </div>
        </div>
      </div>

      {/* Sales Items */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sales Items</h2>

        {visit.sales && visit.sales.length > 0 ? (
          <Table headers={salesTableHeaders}>
            {visit.sales.map((sale) => (
              <Table.Row key={sale.id}>
                <Table.Cell className="font-medium">
                  {sale.products?.name}
                </Table.Cell>
                <Table.Cell>
                  {sale.products?.company_name || 'N/A'}
                </Table.Cell>
                <Table.Cell>
                  {sale.quantity}
                </Table.Cell>
                <Table.Cell>
                  {formatCurrency(parseFloat(sale.unit_price))}
                </Table.Cell>
                <Table.Cell className="font-medium">
                  {formatCurrency(parseFloat(sale.total_amount))}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500">No sales recorded for this visit</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisitDetail;