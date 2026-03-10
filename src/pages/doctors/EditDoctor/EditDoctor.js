import React, { useState } from 'react';
import { PlusIcon, TrashIcon, GiftIcon } from '@heroicons/react/24/outline';
import { BackEditTitleAndButton, FilterSelect, Loader, SecondaryButton } from '../../../components';

const FormField = ({ field, formData, handleChange }) => {
  const { name, label, type, required, placeholder, options, rows, colSpan = '' } = field;
  const value = formData[name] || '';

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <FilterSelect
            id={name}
            name={name}
            label=""
            value={value}
            onChange={handleChange}
            options={options}
            placeholder={`Select ${label}`}
            className=""
          />
        );

      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            rows={rows}
            className="input-field"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            required={required}
          />
        );

      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            className="input-field"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            required={required}
          />
        );
    }
  };

  return (
    <div className={colSpan}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      {renderInput()}
    </div>
  );
};

function EditDoctor({ 
  formData, 
  handleChange, 
  handleSubmit, 
  loading, 
  saving, 
  onCancel, 
  FORM_FIELDS,
  importantDates,
  setImportantDates
}) {
  const isChemist = formData.contact_type === 'chemist';
  const title = isChemist ? 'Edit Chemist' : 'Edit Doctor';
  const buttonText = isChemist ? 'Save Chemist Changes' : 'Save Doctor Changes';
  const [newDate, setNewDate] = useState({ label: '', date: '', notes: '', is_recurring: false });
  const [showDateForm, setShowDateForm] = useState(false);

  const handleAddDate = () => {
    if (!newDate.label || !newDate.date) return;
    setImportantDates(prev => [...prev, { ...newDate, _key: Date.now() }]);
    setNewDate({ label: '', date: '', notes: '', is_recurring: false });
    setShowDateForm(false);
  };

  const handleRemoveDate = (key) => {
    setImportantDates(prev => prev.filter(d => d._key !== key));
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <BackEditTitleAndButton title={title} backButtonPath={`/doctors/${formData.id || ''}`} />

      {/* Info Banner */}
      {isChemist && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Chemist Mode</h3>
              <p className="mt-1 text-sm text-blue-700">
                Doctor-specific fields (specialization, class, type) are not applicable for chemists.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FORM_FIELDS.map(field => 
              <FormField key={field.name} field={field} formData={formData} handleChange={handleChange} />
            )}
          </div>

          {/* Important Dates Section */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900">Important Dates</h3>
              <button
                type="button"
                onClick={() => setShowDateForm(!showDateForm)}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <PlusIcon className="h-3.5 w-3.5 mr-1" />
                Add Date
              </button>
            </div>

            {showDateForm && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="Label (e.g., Birthday)"
                    value={newDate.label}
                    onChange={(e) => setNewDate(prev => ({ ...prev, label: e.target.value }))}
                  />
                  <input
                    type="date"
                    className="input-field text-sm"
                    value={newDate.date}
                    onChange={(e) => setNewDate(prev => ({ ...prev, date: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="Notes (optional)"
                    value={newDate.notes}
                    onChange={(e) => setNewDate(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                      checked={newDate.is_recurring}
                      onChange={(e) => setNewDate(prev => ({ ...prev, is_recurring: e.target.checked }))}
                    />
                    <span className="ml-2 text-xs text-gray-700">Recurring yearly</span>
                  </label>
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => { setShowDateForm(false); setNewDate({ label: '', date: '', notes: '', is_recurring: false }); }} className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={handleAddDate} disabled={!newDate.label || !newDate.date} className="px-2.5 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50">Add</button>
                  </div>
                </div>
              </div>
            )}

            {importantDates.length > 0 ? (
              <div className="space-y-2">
                {importantDates.map((d) => (
                  <div key={d._key} className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <GiftIcon className="h-4 w-4 text-primary-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{d.label}</span>
                      <span className="text-xs text-gray-500">{d.date}</span>
                      {d.is_recurring && <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">Yearly</span>}
                      {d.notes && <span className="text-xs text-gray-400">— {d.notes}</span>}
                    </div>
                    <button type="button" onClick={() => handleRemoveDate(d._key)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No important dates. You can also manage them from the detail page.</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <SecondaryButton onClick={onCancel}>
              Cancel
            </SecondaryButton>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDoctor;