import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BackTitleAndButton } from '../../components/common';

function AddDoctor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    hospital: '',
    contact_number: '',
    email: '',
    address: '',
    doctor_class: '',
    doctor_type: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('doctors')
        .insert([{
          ...formData
        }]);

      if (error) throw error;

      alert('Doctor added successfully!');
      navigate('/doctors');
    } catch (error) {
      console.error('Error adding doctor:', error);
      alert('Error adding doctor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackTitleAndButton title="Add New Product" backButtonPath="/products" />


      {/* Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="input-field"
                placeholder="Enter doctor's full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Specialization */}
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                className="input-field"
                placeholder="e.g., Cardiology, Neurology"
                value={formData.specialization}
                onChange={handleChange}
              />
            </div>

            {/* Hospital */}
            <div>
              <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-2">
                Hospital/Clinic
              </label>
              <input
                type="text"
                id="hospital"
                name="hospital"
                className="input-field"
                placeholder="Hospital or clinic name"
                value={formData.hospital}
                onChange={handleChange}
              />
            </div>

            {/* Doctor Class */}
            <div>
              <label htmlFor="doctor_class" className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Class
              </label>
              <select
                id="doctor_class"
                name="doctor_class"
                className="input-field"
                value={formData.doctor_class}
                onChange={handleChange}
              >
                <option value="">Select Class</option>
                <option value="A">Class A</option>
                <option value="B">Class B</option>
                <option value="C">Class C</option>
              </select>
            </div>

            {/* Doctor Type */}
            <div>
              <label htmlFor="doctor_type" className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Type
              </label>
              <select
                id="doctor_type"
                name="doctor_type"
                className="input-field"
                value={formData.doctor_type}
                onChange={handleChange}
              >
                <option value="">Select Type</option>
                <option value="dispenser">Dispenser</option>
                <option value="prescriber">Prescriber</option>
              </select>
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                id="contact_number"
                name="contact_number"
                className="input-field"
                placeholder="Phone number"
                value={formData.contact_number}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="input-field"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                className="input-field"
                placeholder="Full address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/doctors')}
              className="btn-secondary"
            >
              Cancel
            </button>
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
