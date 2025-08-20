import React from 'react'
import { format } from 'date-fns';

const VisitRow = ({ visit, calculateTotalSales, getVisitStatusStyle, formatCurrency }) => (
  <tr className="hover:bg-gray-50">
    <td className="table-cell">
      {format(new Date(visit.visit_date), 'MMM dd, yyyy')}
    </td>
    <td className="table-cell">
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVisitStatusStyle(visit.status)}`}>
        {visit.status}
      </span>
    </td>
    <td className="table-cell">
      <div className="font-medium text-gray-900">
        {formatCurrency(calculateTotalSales(visit.sales))}
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
);

export default VisitRow