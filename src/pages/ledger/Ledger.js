import React from 'react';
import { Header, Table, Loader, FilterSelect } from '../../components';
import { format } from 'date-fns';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { handleReload } from '../../helper';

const Ledger = ({
  loading,
  entries,
  trialBalance,
  doctorFilter,
  setDoctorFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  doctors,
  onRefresh
}) => {
  const entryHeaders = ['Date', 'Contact', 'Type', 'Source', 'Description', 'Debit', 'Credit'];
  const tbHeaders = ['Contact', 'Type', 'Total Debit', 'Total Credit', 'Current Balance'];

  const doctorOptions = [{ value: '', label: 'All Contacts' }].concat(
    (doctors || []).map(d => ({ value: d.id, label: d.name }))
  );

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      <Header 
        title="Ledger" 
        buttons={[
          { 
            onClick: onRefresh || handleReload, 
            icon: <ArrowPathIcon className="h-4 w-4 mr-2" />, 
            title: 'Refresh' 
          }
        ]}
      />

      {/* Filters Card */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FilterSelect 
            label="Contact" 
            value={doctorFilter} 
            onChange={(e) => setDoctorFilter(e.target.value)} 
            options={doctorOptions} 
            id="contact_filter"
          />
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="end_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
            />
          </div>
        </div>
      </div>

      {/* Ledger Entries */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Ledger Entries
          {(doctorFilter || startDate || endDate) && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({entries.length} filtered)
            </span>
          )}
        </h3>
        {entries.length > 0 ? (
          <Table headers={entryHeaders}>
            {entries.map(e => {
              const isChemist = e.doctors?.contact_type === 'chemist';
              return (
                <Table.Row key={e.id}>
                  <Table.Cell>{e.entry_date ? format(new Date(e.entry_date), 'MMM dd, yyyy') : '-'}</Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <span>{e.doctors?.name || '-'}</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isChemist ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {isChemist ? 'Chemist' : 'Doctor'}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="capitalize">{e.source_type}</span>
                  </Table.Cell>
                  <Table.Cell className="max-w-xs truncate" title={e.description || '-'}>
                    {e.description || '-'}
                  </Table.Cell>
                  <Table.Cell className="text-red-600 font-medium">
                    {parseFloat(e.debit || 0) > 0 ? `₹${parseFloat(e.debit).toFixed(2)}` : '-'}
                  </Table.Cell>
                  <Table.Cell className="text-green-600 font-medium">
                    {parseFloat(e.credit || 0) > 0 ? `₹${parseFloat(e.credit).toFixed(2)}` : '-'}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {doctorFilter || startDate || endDate 
              ? 'No ledger entries found matching your filters.' 
              : 'No ledger entries recorded yet.'}
          </div>
        )}
      </div>

      {/* Trial Balance */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Trial Balance
          <span className="ml-2 text-sm font-normal text-gray-500">(All-time totals)</span>
        </h3>
        {trialBalance.length > 0 ? (
          <Table headers={tbHeaders}>
            {trialBalance.map(tb => {
              const isChemist = tb.contact_type === 'chemist';
              return (
                <Table.Row key={tb.doctor_id}>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tb.name}</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isChemist ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {isChemist ? 'Chemist' : 'Doctor'}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-red-600">₹{parseFloat(tb.total_debit).toFixed(2)}</Table.Cell>
                  <Table.Cell className="text-green-600">₹{parseFloat(tb.total_credit).toFixed(2)}</Table.Cell>
                  <Table.Cell className={`font-bold ${
                    tb.current_balance > 0 ? 'text-red-600' : tb.current_balance < 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    ₹{Math.abs(parseFloat(tb.current_balance)).toFixed(2)}
                    {tb.current_balance > 0 && <span className="text-xs ml-1">(Dr)</span>}
                    {tb.current_balance < 0 && <span className="text-xs ml-1">(Cr)</span>}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No trial balance data available yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Ledger;