import React from 'react'
import VisitRow from './VisitRow';

const VisitsTable = ({ visits, calculateTotalSales, getVisitStatusStyle, formatCurrency }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="table-header">Visit Date</th>
          <th className="table-header">Status</th>
          <th className="table-header">Total Sales</th>
          <th className="table-header">Notes</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {visits.map((visit) => (
          <VisitRow 
            key={visit.id} 
            visit={visit} 
            calculateTotalSales={calculateTotalSales}
            getVisitStatusStyle={getVisitStatusStyle}
            formatCurrency={formatCurrency}
          />
        ))}
      </tbody>
    </table>
  </div>
);

export default VisitsTable