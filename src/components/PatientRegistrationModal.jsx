import React, { useState } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import CustomDialog from './CustomDialog';

const PatientRegistrationModal = ({ 
  isOpen, 
  onClose, 
  onPatientRegistered,
  facilityName = 'Birthing Center',
  facilityAddress = '',
  birthcareId,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    age: '',
    civil_status: 'Single',
    address: '',
    contact_number: '',
    philhealth_number: '',
    philhealth_category: 'None',
    facility_name: facilityName,
    // Indirect PhilHealth member fields
    principal_philhealth_number: '',
    principal_name: '',
    relationship_to_principal: '',
    principal_date_of_birth: '',
    patient_philhealth_number: ''
  });
  const [errors, setErrors] = useState({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const civilStatusOptions = [
    'Single',
    'Married',
    'Widowed',
    'Separated',
    'Divorced'
  ];

  const philhealthCategories = [
    'None',
    'Direct',
    'Indirect'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for PhilHealth number fields - allow only 12 digits
    if (name === 'philhealth_number' || name === 'principal_philhealth_number' || name === 'patient_philhealth_number') {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      // Limit to 12 digits
      const limitedValue = digitsOnly.slice(0, 12);
      
      setFormData(prev => ({
        ...prev,
        [name]: limitedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Calculate age when date of birth changes
    if (name === 'date_of_birth' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({
        ...prev,
        age: age.toString()
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    
    if (!formData.age) {
      newErrors.age = 'Age is required';
    }
    
    if (!formData.civil_status) {
      newErrors.civil_status = 'Civil status is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Call the parent callback to handle registration
      await onPatientRegistered?.(formData);
      
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Patient registration error:', error);
      setErrorMessage(error.message || 'Failed to register patient. Please try again.');
      setShowErrorDialog(true);
    }
  };

  const handleFillSampleData = () => {
    setFormData({
      first_name: 'Maria',
      middle_name: 'Santos',
      last_name: 'Dela Cruz',
      date_of_birth: '1995-03-15',
      age: '29',
      civil_status: 'Married',
      address: '123 Main Street, Barangay San Jose, Quezon City',
      contact_number: '09123456789',
      philhealth_number: '123456789012',
      philhealth_category: 'Direct',
      facility_name: facilityName,
      principal_philhealth_number: '',
      principal_name: '',
      relationship_to_principal: '',
      principal_date_of_birth: '',
      patient_philhealth_number: ''
    });
    setErrors({});
  };

  if (!isOpen) return null;

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    onClose();
    // Reset form
    setFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      date_of_birth: '',
      age: '',
      civil_status: 'Single',
      address: '',
      contact_number: '',
      philhealth_number: '',
      philhealth_category: 'None',
      facility_name: facilityName,
      principal_philhealth_number: '',
      principal_name: '',
      relationship_to_principal: '',
      principal_date_of_birth: '',
      patient_philhealth_number: ''
    });
    setErrors({});
  };

  return (
    <>
      <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm" style={{ display: isOpen ? 'flex' : 'none' }}>
        <div className="relative mx-auto w-11/12 max-w-5xl my-6">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with Rose Gradient */}
              <div className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-white">Register Patient</h2>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">


                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Facility Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facility Name
                    </label>
                    <input
                      type="text"
                      name="facility_name"
                      value={formData.facility_name}
                      disabled
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">This patient will be registered to the above facility</p>
                  </div>

                  {/* Basic Patient Information */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Basic Patient Information</h4>
                    
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder=""
                          className={`block w-full px-3 py-2 border rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm ${
                            errors.first_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        {errors.first_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Middle Name
                        </label>
                        <input
                          type="text"
                          name="middle_name"
                          value={formData.middle_name}
                          onChange={handleInputChange}
                          placeholder=""
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder=""
                          className={`block w-full px-3 py-2 border rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm ${
                            errors.last_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        {errors.last_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Date, Age, Civil Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                          max={(() => {
                            const date = new Date();
                            date.setFullYear(date.getFullYear() - 18);
                            return date.toISOString().split('T')[0];
                          })()}
                          className={`block w-full px-3 py-2 border rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm ${
                            errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        {errors.date_of_birth && (
                          <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder=""
                          className={`block w-full px-3 py-2 border rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm ${
                            errors.age ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        {errors.age && (
                          <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Civil Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="civil_status"
                          value={formData.civil_status}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 border rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm ${
                            errors.civil_status ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        >
                          {civilStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        {errors.civil_status && (
                          <p className="mt-1 text-sm text-red-600">{errors.civil_status}</p>
                        )}
                      </div>
                    </div>

                    {/* Address and Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows="3"
                          placeholder=""
                          className={`block w-full px-3 py-2 border rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        />
                        {errors.address && (
                          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          name="contact_number"
                          value={formData.contact_number}
                          onChange={handleInputChange}
                          placeholder=""
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PhilHealth Information */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">PhilHealth Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PhilHealth Number
                        </label>
                        <input
                          type="text"
                          name="philhealth_number"
                          value={formData.philhealth_number}
                          onChange={handleInputChange}
                          placeholder="12 digits"
                          maxLength="12"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">Enter exactly 12 digits</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PhilHealth Category
                        </label>
                        <select
                          name="philhealth_category"
                          value={formData.philhealth_category}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm"
                        >
                          {philhealthCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Indirect PhilHealth Member Additional Fields */}
                    {formData.philhealth_category === 'Indirect' && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Principal Member's Information</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Principal Member's PhilHealth No. <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="principal_philhealth_number"
                              value={formData.principal_philhealth_number}
                              onChange={handleInputChange}
                              placeholder="12 digits"
                              maxLength="12"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm bg-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Principal Member's Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="principal_name"
                              value={formData.principal_name}
                              onChange={handleInputChange}
                              placeholder="Last, First, Middle"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm bg-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Relationship to Principal Member <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="relationship_to_principal"
                              value={formData.relationship_to_principal}
                              onChange={handleInputChange}
                              placeholder="e.g., Spouse, Child"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm bg-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Principal Member's Date of Birth
                            </label>
                            <input
                              type="date"
                              name="principal_date_of_birth"
                              value={formData.principal_date_of_birth}
                              onChange={handleInputChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm bg-white"
                            />
                            <p className="mt-1 text-xs text-gray-500">Optional but recommended</p>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Patient's PhilHealth No.
                            </label>
                            <input
                              type="text"
                              name="patient_philhealth_number"
                              value={formData.patient_philhealth_number}
                              onChange={handleInputChange}
                              placeholder="12 digits"
                              maxLength="12"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm bg-white"
                            />
                            <p className="mt-1 text-xs text-gray-500">Optional</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853] transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border border-transparent rounded-xl text-sm font-medium text-white hover:shadow-lg hover:shadow-[#BF3853]/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Registering...
                        </div>
                      ) : (
                        'Register Patient'
                      )}
                    </button>
                  </div>
                </form>
              </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <CustomDialog
        isOpen={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        title="Patient Registered Successfully!"
        message={`${formData.first_name} ${formData.middle_name} ${formData.last_name} has been successfully registered to ${facilityName}.`}
        type="success"
        confirmText="OK"
      />

      {/* Error Dialog */}
      <CustomDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title="Registration Failed"
        message={errorMessage}
        type="error"
        confirmText="Try Again"
      />
    </>
  );
};

export default PatientRegistrationModal;
