import React from 'react';
import { BackTitleAndButton, SecondaryButton } from '../../../components/common';


const renderFormField = (
  field,
  formData,
  handleChange
) => {
  const { name, label, type, required, placeholder, options, rows, colSpan = '' } = field;
  const value = formData[name] || '';

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            id={name}
            name={name}
            className="input-field"
            value={value}
            onChange={handleChange}
            required={required}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
    <div key={name} className={colSpan}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      {renderInput()}
    </div>
  );
};

function AddDoctor({ formData, handleChange, handleSubmit, loading, FORM_FIELDS }) {

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackTitleAndButton title="Add New Doctor" backButtonPath="/doctors" />

      {/* Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FORM_FIELDS.map(field => renderFormField(field, formData, handleChange))}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <SecondaryButton link="/doctors">
              Cancel
            </SecondaryButton>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddDoctor;
