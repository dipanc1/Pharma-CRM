import React from 'react';
import { Header, Table, Loader, SearchInput, FilterSelect } from '../../components';
import { format } from 'date-fns';

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
  doctors
}) => {
  const entryHeaders = ['Date', 'Contact', 'Type', 'Description', 'Debit', 'Credit', 'Balance'];
  const tbHeaders = ['Contact', 'Type', 'Total Debit', 'Total Credit', 'Current Balance'];

  const doctorOptions = [{ value: '', label: 'All Contacts' }].concat(
    (doctors || []).map(d => ({ value: d.id, label: d.name }))
  );

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      <Header title="Ledger" />
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <FilterSelect label="Contact" value={doctorFilter} onChange={setDoctorFilter} options={doctorOptions} />
          <SearchInput label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <SearchInput label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <Table headers={entryHeaders}>
          {entries.map(e => (
            <Table.Row key={e.id}>
              <Table.Cell>{e.entry_date ? format(new Date(e.entry_date), 'MMM dd, yyyy') : '-'}</Table.Cell>
              <Table.Cell>{e.doctors?.name || '-'}</Table.Cell>
              <Table.Cell>{e.source_type}</Table.Cell>
              <Table.Cell>{e.description || '-'}</Table.Cell>
              <Table.Cell>₹{parseFloat(e.debit || 0).toFixed(2)}</Table.Cell>
              <Table.Cell>₹{parseFloat(e.credit || 0).toFixed(2)}</Table.Cell>
              <Table.Cell>{e.balance != null ? `₹${parseFloat(e.balance).toFixed(2)}` : '—'}</Table.Cell>
            </Table.Row>
          ))}
        </Table>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trial Balance</h3>
        <Table headers={tbHeaders}>
          {trialBalance.map(tb => (
            <Table.Row key={tb.doctor_id}>
              <Table.Cell>{tb.name}</Table.Cell>
              <Table.Cell>{tb.contact_type === 'chemist' ? 'Chemist' : 'Doctor'}</Table.Cell>
              <Table.Cell>₹{parseFloat(tb.total_debit).toFixed(2)}</Table.Cell>
              <Table.Cell>₹{parseFloat(tb.total_credit).toFixed(2)}</Table.Cell>
              <Table.Cell className="font-medium">₹{parseFloat(tb.current_balance).toFixed(2)}</Table.Cell>
            </Table.Row>
          ))}
        </Table>
      </div>
    </div>
  );
};

export default Ledger;