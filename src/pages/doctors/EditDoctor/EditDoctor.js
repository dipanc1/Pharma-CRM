import React from 'react';
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
  FORM_FIELDS 
}) {
  const isChemist = formData.contact_type === 'chemist';
  const title = isChemist ? 'Edit Chemist' : 'Edit Doctor';
  const buttonText = isChemist ? 'Save Chemist Changes' : 'Save Doctor Changes';

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