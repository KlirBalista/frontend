"use client";
import { useAuth } from "@/hooks/auth";
import React, { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useParams } from "next/navigation";
import { CheckCircle, X, Calendar, User } from "lucide-react";
import SearchablePatientSelect from "@/components/SearchablePatientSelect";
import Loading from '@/components/Loading';

const PatientPrenatalPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  
  // Patients
  const [patients, setPatients] = useState([]);
  const [birthCareInfo, setBirthCareInfo] = useState(null);
  
  // Form state for prenatal visit
  const [formData, setFormData] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;
    return {
      patientId: '',
      visitNumber: 1,
      visitName: 'First visit (before 12 weeks)',
      recommendedWeek: 8,
      scheduledDate: todayDate, // Set to today's date for first visit by default
      status: 'Scheduled'
    };
  });

  // Predefined visit schedule based on WHO guidelines
  const visitSchedule = [
    { number: 1, name: 'First visit (before 12 weeks)', week: 8 },
    { number: 2, name: 'Second visit', week: 20 },
    { number: 3, name: 'Third visit', week: 26 },
    { number: 4, name: 'Fourth visit', week: 30 },
    { number: 5, name: 'Fifth visit', week: 34 },
    { number: 6, name: 'Sixth visit', week: 36 },
    { number: 7, name: 'Seventh visit', week: 38 },
    { number: 8, name: 'Eighth visit', week: 40 },
  ];

  // Fetch patients and birthcare info when component mounts
  useEffect(() => {
    fetchPatients();
    fetchBirthCareInfo();
  }, []);


  // Update visit details when visit number changes
  useEffect(() => {
    const selectedVisit = visitSchedule.find(visit => visit.number === parseInt(formData.visitNumber));
    if (selectedVisit) {
      // If it's the first visit, set scheduled date to today
      const isFirstVisit = parseInt(formData.visitNumber) === 1;
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayDate = `${year}-${month}-${day}`;
      
      setFormData(prev => ({
        ...prev,
        visitName: selectedVisit.name,
        recommendedWeek: selectedVisit.week,
        scheduledDate: isFirstVisit ? todayDate : prev.scheduledDate
      }));
    }
  }, [formData.visitNumber]);

  const fetchBirthCareInfo = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      // Handle multiple possible response shapes
      const facilityData = response.data.data || response.data;
      setBirthCareInfo(facilityData);
    } catch (error) {
      console.error('Error fetching birth care info:', error);
    }
  };

  const fetchPatients = async () => {
    if (!user) return;
    
    try {
      let allPatients = [];
      let currentPage = 1;
      let hasMorePages = true;
      
      // Keep fetching pages until we have all patients
      while (hasMorePages) {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}/patients`, {
          params: {
            page: currentPage,
            per_page: 50 // Reasonable page size
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        const pageData = response.data.data || response.data || [];
        allPatients = [...allPatients, ...pageData];
        
        // Check if there are more pages
        const totalPages = response.data.last_page || response.data.meta?.last_page || 1;
        hasMorePages = currentPage < totalPages;
        currentPage++;
        
        
        // Safety break to avoid infinite loops
        if (currentPage > 10) break;
      }
      
      setPatients(allPatients);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setErrorMessage('Failed to load patients. Please try again.');
      setShowError(true);
    }
  };

  if (!user) {
    return <Loading />;
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_prenatal_schedule"))
  ) {
    return <div>Unauthorized</div>;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePatientChange = (patientId) => {
    setFormData(prev => ({ ...prev, patientId: patientId }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.patientId) {
      alert('Please select a patient');
      return;
    }

    if (!formData.scheduledDate) {
      alert('Please enter the scheduled date');
      return;
    }

    setIsLoading(true);
    
    // Prepare data for backend API
    const prenatalData = {
      patient_id: parseInt(formData.patientId),
      visit_number: parseInt(formData.visitNumber),
      visit_name: formData.visitName,
      recommended_week: parseInt(formData.recommendedWeek),
      scheduled_date: formData.scheduledDate,
      status: formData.status
    };

    try {
      // Save to backend
      const response = await axios.post(`/api/birthcare/${birthcare_Id}/prenatal-visits`, prenatalData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 201) {
        setSuccessMessage('Prenatal visit scheduled successfully!');
        setShowSuccess(true);
        
        // Reset form with today's date for first visit
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayDate = `${year}-${month}-${day}`;
        setFormData({
          patientId: '',
          visitNumber: 1,
          visitName: 'First visit (before 12 weeks)',
          recommendedWeek: 8,
          scheduledDate: todayDate,
          status: 'Scheduled'
        });
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving prenatal visit:', error);
      
      // Check if it's a "visit already exists" error
      if (error.response?.status === 409 && error.response?.data?.message?.includes('already exists')) {
        const visitNumber = parseInt(formData.visitNumber);
        const selectedPatient = getSelectedPatient();
        const patientName = selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'this patient';
        setDialogMessage(`Visit ${visitNumber} is already scheduled for ${patientName}. Please select a different visit number or check the existing schedule.`);
        setShowDialog(true);
      } else {
        // Handle other errors with the error banner
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          const errorMessages = Object.values(errors).flat().join('\n');
          setErrorMessage(`Validation errors:\n${errorMessages}`);
        } else if (error.response?.data?.message) {
          setErrorMessage(`Error: ${error.response.data.message}`);
        } else {
          setErrorMessage('Error scheduling prenatal visit. Please try again.');
        }
        
        setShowError(true);
        
        // Auto-hide error message after 5 seconds
        setTimeout(() => {
          setShowError(false);
        }, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedPatient = () => {
    return patients.find(patient => patient.id.toString() === formData.patientId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-green-400 hover:text-green-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 flex items-start space-x-3 max-w-md">
            <div className="flex-shrink-0 mt-0.5">
              <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1 whitespace-pre-line">{errorMessage}</p>
            </div>
            <button onClick={() => setShowError(false)} className="text-red-400 hover:text-red-600 flex-shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Dialog Modal for Visit Already Exists */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Visit Already Scheduled</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">{dialogMessage}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-pink-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] transition-all duration-300 hover:scale-105"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Official Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-8 text-center border-b border-gray-200">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v2a1 1 0 001 1h4a1 1 0 001-1v-2a1 1 0 00-1-1h-4a1 1 0 00-1 1z" />
                </svg>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              {birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY'}
            </h1>
            <p className="text-sm text-gray-600 mb-4">
              {birthCareInfo?.description || 'Loading facility address...'}
            </p>
            <div className="border-t border-b border-gray-300 py-3">
              <h2 className="text-xl font-bold text-gray-900">PATIENT PRENATAL VISIT</h2>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-6">


            <form className="space-y-8">
              {/* Patient Selection */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Select Patient
                </h3>
                
                {/* Patient Searchable Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                  <SearchablePatientSelect
                    patients={patients}
                    value={formData.patientId}
                    onChange={handlePatientChange}
                    placeholder="Search and select a patient..."
                    required={true}
                    onOpen={fetchPatients}
                    className="focus:ring-blue-500"
                  />
                </div>

              </div>

              {/* Visit Details */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Visit Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Number *</label>
                    <select
                      name="visitNumber"
                      value={formData.visitNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {visitSchedule.map((visit) => (
                        <option key={visit.number} value={visit.number}>
                          Visit {visit.number} (Week {visit.week})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Missed">Missed</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visit Name</label>
                  <input
                    type="text"
                    name="visitName"
                    value={formData.visitName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Week</label>
                    <input
                      type="number"
                      name="recommendedWeek"
                      value={formData.recommendedWeek}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date *
                      {parseInt(formData.visitNumber) === 1 && (
                        <span className="text-xs text-blue-600 ml-2">(Automatically set to today)</span>
                      )}
                    </label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      disabled={parseInt(formData.visitNumber) === 1}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                        parseInt(formData.visitNumber) === 1 
                          ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                          : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center">
                <button type="button" onClick={handleSave} disabled={isLoading} className="px-8 py-3 bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-pink-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105">
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Scheduling...
                    </div>
                  ) : (
                    'Schedule Visit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPrenatalPage;
