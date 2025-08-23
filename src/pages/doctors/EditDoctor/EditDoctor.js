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
  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <BackEditTitleAndButton title="Edit Doctor" backButtonPath={`/doctors/${formData.id || ''}`} />

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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDoctor;