import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Header, Table, Loader, FilterSelect, SearchInput, Pagination } from '../../components';
import { format } from 'date-fns';
import { 
  ArrowPathIcon, 
  ArrowDownTrayIcon,
  XMarkIcon,
  FunnelIcon,
  ChartBarIcon,
  ListBulletIcon,
  ChevronDownIcon,
  BookmarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const ContactMultiSelect = ({ doctors, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!search) return doctors;
    const s = search.toLowerCase();
    return doctors.filter(d => (d.name || '').toLowerCase().includes(s));
  }, [doctors, search]);

  const toggleContact = (id) => {
    onChange(
      selected.includes(id)
        ? selected.filter(x => x !== id)
        : [...selected, id]
    );
  };

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Contacts
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-field flex items-center justify-between text-left"
      >
        <span className={selected.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
          {selected.length === 0
            ? 'All contacts'
            : `${selected.length} contact${selected.length !== 1 ? 's' : ''} selected`}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full px-3 py-1.5 text-left text-xs font-medium text-primary-600 hover:bg-gray-50 border-b border-gray-200"
            >
              Clear selection (show all)
            </button>
          )}
          <div className="max-h-56 overflow-y-auto">
            {filteredDoctors.length > 0 ? filteredDoctors.map(d => (
              <label
                key={d.id}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-blue-500"
                  checked={selected.includes(d.id)}
                  onChange={() => toggleContact(d.id)}
                />
                <span className="flex-1 truncate">{d.name}</span>
                <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                  d.contact_type === 'chemist' ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {d.contact_type === 'chemist' ? 'Chemist' : 'Doctor'}
                </span>
              </label>
            )) : (
              <p className="px-3 py-2 text-sm text-gray-500">No contacts found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Ledger = ({
  loading,
  entries,
  trialBalance,
  trialBalanceTotal,
  tbTotals,
  tbSelectedContacts,
  setTbSelectedContacts,
  tbMinBalance,
  setTbMinBalance,
  savedSelections,
  onSaveSelection,
  onLoadSelection,
  onDeleteSelection,
  doctorFilter,
  setDoctorFilter,
  sourceType,
  setSourceType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchTerm,
  setSearchTerm,
  doctors,
  onRefresh,
  page,
  setPage,
  totalPages,
  periodTotals,
  onExportCSV,
  onExportTrialBalance,
  onClearFilters,
  hasFilters,
  view,
  setView
}) => {
  const [selectionName, setSelectionName] = useState('');
  const [loadedSelection, setLoadedSelection] = useState('');
  const entryHeaders = ['Date', 'Contact', 'Source Type', 'Invoice #', 'Description', 'Debit', 'Credit', 'Balance'];
  const tbHeaders = ['Contact', 'Details', 'Total Debit', 'Total Credit', 'Current Balance'];

  const doctorOptions = doctors.map(d => ({ value: d.id, label: d.name }));

  const sourceTypeOptions = [
    { value: 'visit', label: 'Visit' },
    { value: 'sale', label: 'Sale' },
    { value: 'cash', label: 'Cash' }
  ];

  const formatCurrency = (value) => {
    const num = parseFloat(value || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const minBalancePresets = [
    { value: '', label: 'All' },
    { value: '5000', label: '≥ ₹5,000' },
    { value: '10000', label: '≥ ₹10,000' }
  ];

  const totals = view === 'trial' ? tbTotals : periodTotals;

  const handleSaveClick = () => {
    if (onSaveSelection(selectionName)) {
      setLoadedSelection(selectionName.trim());
      setSelectionName('');
    }
  };

  const handleLoadChange = (e) => {
    const name = e.target.value;
    setLoadedSelection(name);
    if (name) onLoadSelection(name);
  };

  const handleDeleteClick = () => {
    onDeleteSelection(loadedSelection);
    setLoadedSelection('');
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      <Header 
        title="Ledger Management" 
        subtitle="Track all financial transactions and account balances"
        buttons={[
          {
            onClick: view === 'entries' ? onExportCSV : onExportTrialBalance,
            icon: <ArrowDownTrayIcon className="h-4 w-4 mr-2" />,
            title: `Export ${view === 'entries' ? 'Entries' : 'Trial Balance'}`,
            color: 'primary'
          },
          { 
            onClick: onRefresh, 
            icon: <ArrowPathIcon className="h-4 w-4 mr-2" />, 
            title: 'Refresh',
            color: 'secondary'
          }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setView('entries')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'entries'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ListBulletIcon className="h-5 w-5 mr-2" />
                Ledger Entries
              </button>
              <button
                onClick={() => setView('trial')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'trial'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Trial Balance
              </button>
            </div>
            {hasFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Debit</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(totals.debit)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credit</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(totals.credit)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold mt-1 ${
                totals.net > 0 ? 'text-red-600' : totals.net < 0 ? 'text-green-600' : 'text-gray-900'
              }`}>
                {formatCurrency(Math.abs(totals.net))}
                {totals.net > 0 && <span className="text-sm ml-1">(Dr)</span>}
                {totals.net < 0 && <span className="text-sm ml-1">(Cr)</span>}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              totals.net > 0 ? 'bg-red-100' : totals.net < 0 ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <svg className={`w-6 h-6 ${
                totals.net > 0 ? 'text-red-600' : totals.net < 0 ? 'text-green-600' : 'text-gray-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {view === 'entries' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            {hasFilters && (
              <span className="ml-auto text-sm text-gray-500">
                {periodTotals.count} entries found
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <SearchInput
              placeholder="Search contact or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FilterSelect 
              label="Contact" 
              value={doctorFilter} 
              onChange={(e) => setDoctorFilter(e.target.value)} 
              options={doctorOptions} 
              id="contact_filter"
            />
            <FilterSelect
              label="Source Type"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              options={sourceTypeOptions}
              id="source_filter"
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
      )}

      {view === 'trial' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <span className="ml-auto text-sm text-gray-500">
              Showing {trialBalance.length} of {trialBalanceTotal} contact{trialBalanceTotal !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContactMultiSelect
              doctors={doctors}
              selected={tbSelectedContacts}
              onChange={setTbSelectedContacts}
            />
            <div>
              <label htmlFor="tb_min_balance" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Balance
              </label>
              <div className="flex items-center gap-2">
                {minBalancePresets.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setTbMinBalance(p.value)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      tbMinBalance === p.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <input
                  type="number"
                  id="tb_min_balance"
                  min="0"
                  placeholder="Custom amount"
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={tbMinBalance}
                  onChange={(e) => setTbMinBalance(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tb_saved_selection" className="block text-sm font-medium text-gray-700 mb-2">
                Saved Selections
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="tb_saved_selection"
                  className="input-field flex-1"
                  value={loadedSelection}
                  onChange={handleLoadChange}
                >
                  <option value="">Load a saved selection...</option>
                  {savedSelections.map(s => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.contactIds.length} contact{s.contactIds.length !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
                {loadedSelection && (
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    title={`Delete "${loadedSelection}"`}
                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="tb_selection_name" className="block text-sm font-medium text-gray-700 mb-2">
                Save Current Selection
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="tb_selection_name"
                  placeholder="e.g. Key doctors"
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectionName}
                  onChange={(e) => setSelectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveClick()}
                />
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={tbSelectedContacts.length === 0}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookmarkIcon className="h-4 w-4 mr-1" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'entries' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Ledger Entries
            </h3>
          </div>
          {entries.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table headers={entryHeaders}>
                  {entries.map(e => {
                    const isChemist = e.doctors?.contact_type === 'chemist';
                    return (
                      <Table.Row key={e.id}>
                        <Table.Cell>
                          <div className="whitespace-nowrap">
                            {e.entry_date ? format(new Date(e.entry_date), 'MMM dd, yyyy') : '-'}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{e.doctors?.name || '-'}</span>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              isChemist ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {isChemist ? 'Chemist' : 'Doctor'}
                            </span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800 capitalize">
                            {e.source_type}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="text-sm font-mono text-gray-600">
                            {e.invoice_number || '-'}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="max-w-xs">
                          <div className="truncate" title={e.description || '-'}>
                            {e.description || '-'}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="text-red-600 font-semibold whitespace-nowrap">
                          {parseFloat(e.debit || 0) > 0 ? formatCurrency(e.debit) : '—'}
                        </Table.Cell>
                        <Table.Cell className="text-green-600 font-semibold whitespace-nowrap">
                          {parseFloat(e.credit || 0) > 0 ? formatCurrency(e.credit) : '—'}
                        </Table.Cell>
                        <Table.Cell className={`font-bold whitespace-nowrap ${
                          parseFloat(e.running_balance || 0) > 0 ? 'text-red-600' :
                          parseFloat(e.running_balance || 0) < 0 ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {formatCurrency(Math.abs(e.running_balance || 0))}
                          {parseFloat(e.running_balance || 0) > 0 && <span className="text-xs ml-1">(Dr)</span>}
                          {parseFloat(e.running_balance || 0) < 0 && <span className="text-xs ml-1">(Cr)</span>}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                {hasFilters 
                  ? 'No ledger entries found matching your filters.' 
                  : 'No ledger entries recorded yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {view === 'trial' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Trial Balance
              <span className="ml-2 text-sm font-normal text-gray-500">(All-time totals)</span>
            </h3>
            <span className="text-sm text-gray-600">
              {trialBalance.length} contact{trialBalance.length !== 1 ? 's' : ''}
            </span>
          </div>
          {trialBalance.length > 0 ? (            <div className="overflow-x-auto">
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
                      <Table.Cell>
                        <div className="text-sm text-gray-600">
                          {isChemist ? tb.hospital : tb.specialization || '—'}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="text-red-600 font-semibold whitespace-nowrap">
                        {formatCurrency(tb.total_debit)}
                      </Table.Cell>
                      <Table.Cell className="text-green-600 font-semibold whitespace-nowrap">
                        {formatCurrency(tb.total_credit)}
                      </Table.Cell>
                      <Table.Cell>
                        <div className={`font-bold whitespace-nowrap ${
                          tb.current_balance > 0 ? 'text-red-600' : 
                          tb.current_balance < 0 ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {formatCurrency(Math.abs(tb.current_balance))}
                          {tb.current_balance > 0 && <span className="text-xs ml-1">(Dr)</span>}
                          {tb.current_balance < 0 && <span className="text-xs ml-1">(Cr)</span>}
                          {tb.current_balance === 0 && <span className="text-xs ml-1 text-gray-500">(Balanced)</span>}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                {tbSelectedContacts.length > 0 || tbMinBalance
                  ? 'No contacts match your trial balance filters.'
                  : 'No trial balance data available yet.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Ledger;