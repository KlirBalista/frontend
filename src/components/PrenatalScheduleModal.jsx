import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, User } from 'lucide-react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from '@/lib/axios';
import CustomDialog from './CustomDialog';

const PrenatalScheduleModal = ({ 
  isOpen, 
  onClose, 
  onScheduleCreated,
  birthcareId 
}) => {
  const [formData, setFormData] = useState({
    selected_patient: null,
    patient_first_name: '',
    patient_middle_name: '',
    patient_last_name: '',
    patient_contact: '',
    scheduled_date: new Date().toISOString().split('T')[0], // Today's date
    auto_schedule_visits: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // WHO 8-Visit Schedule reference
  const whoSchedule = [
    { number: 1, name: "First visit", week: "before 12 weeks", description: "Initial assessment, confirm pregnancy" },
    { number: 2, name: "Second visit", week: "20 weeks", description: "Anatomy scan, genetic screening" },
    { number: 3, name: "Third visit", week: "26 weeks", description: "Glucose screening, blood pressure check" },
    { number: 4, name: "Fourth visit", week: "30 weeks", description: "Growth monitoring, position check" },
    { number: 5, name: "Fifth visit", week: "34 weeks", description: "Preterm prevention, birth planning" },
    { number: 6, name: "Sixth visit", week: "36 weeks", description: "Final preparations, positioning" },
    { number: 7, name: "Seventh visit", week: "38 weeks", description: "Labor readiness, final checks" },
    { number: 8, name: "Eighth visit", week: "40 weeks", description: "Due date assessment, delivery planning" }
  ];

  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Fetch actual patients from the API
        const response = await axios.get(`/api/birthcare/${birthcareId}/patients`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        // Handle the response data
        const patients = response.data?.data || response.data || [];
        
        // Transform the data to include full_name for easier searching
        const transformedPatients = patients.map(patient => ({
          ...patient,
          full_name: `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.replace(/\s+/g, ' ').trim()
        }));
        
        setPatients(transformedPatients);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
        // You might want to show an error message to the user
        setErrors(prev => ({ ...prev, fetch: 'Failed to load patients. Please try again.' }));
      }
    };

    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen, birthcareId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.patient-search-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientSelect = (patient) => {
    setFormData(prev => ({
      ...prev,
      selected_patient: patient,
      patient_first_name: patient.first_name,
      patient_middle_name: patient.middle_name,
      patient_last_name: patient.last_name,
      patient_contact: patient.contact_number
    }));
    setSearchTerm(patient.full_name);
    setShowDropdown(false);
    
    // Clear any existing errors
    if (errors.patient_first_name) {
      setErrors(prev => ({ ...prev, patient_first_name: '' }));
    }
    if (errors.patient_last_name) {
      setErrors(prev => ({ ...prev, patient_last_name: '' }));
    }
    if (errors.patient_contact) {
      setErrors(prev => ({ ...prev, patient_contact: '' }));
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    // If search is cleared, reset patient selection
    if (!value) {
      setFormData(prev => ({
        ...prev,
        selected_patient: null,
        patient_first_name: '',
        patient_middle_name: '',
        patient_last_name: '',
        patient_contact: ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.selected_patient) {
      newErrors.selected_patient = 'Please select a patient';
    }
    
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Call the parent callback to handle schedule creation
      await onScheduleCreated?.(formData);
      
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Schedule creation error:', error);
      setErrorMessage(error.message || 'Failed to create schedule. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    onClose();
    // Reset form
    setFormData({
      selected_patient: null,
      patient_first_name: '',
      patient_middle_name: '',
      patient_last_name: '',
      patient_contact: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      auto_schedule_visits: true
    });
    setSearchTerm('');
    setShowDropdown(false);
    setErrors({});
  };

  return (
    <>
      <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm">
        <div className="relative mx-auto w-11/12 max-w-4xl my-6">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Prenatal Form */}
            <>
              {/* Header with Rose Gradient */}
              <div className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-white">Create Prenatal Schedule</h2>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Error Message */}
                {(errors.submit || errors.fetch) && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                    <div className="text-sm text-red-700">{errors.submit || errors.fetch}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Patient Information */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Patient Information
                    </h4>
                    
                    {/* Patient Search Dropdown */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Patient <span className="text-red-500">*</span>
                      </label>
                      <div className="relative patient-search-dropdown">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search for a patient..."
                            className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm ${
                              errors.selected_patient ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        
                        {/* Dropdown Results */}
                        {showDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredPatients.length > 0 ? (
                              filteredPatients.map((patient) => (
                                <div
                                  key={patient.id}
                                  onClick={() => handlePatientSelect(patient)}
                                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                >
                                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <div className="font-medium text-gray-900">{patient.full_name}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500">
                                {searchTerm ? 'No patients found' : 'Type to search patients...'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {errors.selected_patient && (
                        <p className="mt-1 text-sm text-red-600">{errors.selected_patient}</p>
                      )}
                    </div>

                  </div>

                  {/* Scheduled Date for the visits */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Schedule Information
                    </h4>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scheduled Date <span className="text-red-500">*</span> <span className="text-xs text-blue-600">(Automatically set to today)</span>
                      </label>
                      <input
                        type="date"
                        name="scheduled_date"
                        value={formData.scheduled_date}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#BF3853] focus:border-[#BF3853] text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This will be used as the base date to schedule all 8 WHO visits on the calendar
                      </p>
                    </div>
                  </div>

                  {/* Additional Information removed as per requirements */}

                  {/* WHO Schedule Reference */}
                  {true && (
                    <div className="bg-gray-50 border border-gray-900 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3">WHO 8-Visit Schedule (Auto-scheduled)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {whoSchedule.map((visit) => (
                          <div key={visit.number} className="flex items-center justify-between p-2 bg-white rounded border border-gray-900">
                            <span className="font-medium text-gray-900">Visit {visit.number}</span>
                            <span className="text-gray-900">{visit.week}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons (match PatientRegistrationModal) */}
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
                          Creating...
                        </div>
                      ) : (
                        'Create Schedule'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <CustomDialog
        isOpen={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        title="Prenatal Schedule Created Successfully!"
        message={`Prenatal schedule for ${formData.patient_first_name || ''} ${formData.patient_last_name || ''} has been successfully created.`}
        type="success"
        confirmText="OK"
      />

      {/* Error Dialog */}
      <CustomDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title="Failed to Create Schedule"
        message={errorMessage}
        type="error"
        confirmText="Close"
      />
    </>
  );
};

export default PrenatalScheduleModal;