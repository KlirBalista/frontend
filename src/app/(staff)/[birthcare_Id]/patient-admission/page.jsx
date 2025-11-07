"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";
import { CheckCircle, X, ChevronDown, Search } from "lucide-react";

const PatientAdmissionPage = () => {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [birthCareInfo, setBirthCareInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: "",
    admission_date: new Date().toISOString().split('T')[0],
    admission_time: new Date().toTimeString().slice(0, 5),
    admission_type: "regular",
    chief_complaint: "",
    reason_for_admission: "",
    medical_history: "",
    allergies: "",
    current_medications: "",
    vital_signs_temperature: "",
    vital_signs_blood_pressure: "",
    vital_signs_heart_rate: "",
    vital_signs_respiratory_rate: "",
    vital_signs_oxygen_saturation: "",
    weight: "",
    height: "",
    // Admission-specific fields
    attending_physician: "",
    primary_nurse: "",
    room_id: "",
    bed_id: "",
    ward_section: "",
    admission_source: "",
    insurance_information: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    patient_belongings: "",
    special_dietary_requirements: "",
    mobility_assistance_needed: false,
    fall_risk_assessment: "low",
    isolation_precautions: "",
    patient_orientation_completed: false,
    family_notification_completed: false,
    advance_directives: "",
    discharge_planning_needs: "",
    physical_examination: "",
    initial_diagnosis: "",
    treatment_plan: "",
    status: "in-labor",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch birthcare info when component mounts
  const fetchBirthCareInfo = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      const data = response?.data?.data || response?.data || null;
      if (data) setBirthCareInfo(data);
    } catch (error) {
      console.error('Error fetching birth care info:', error);
    }
  };

  // Fetch patients for dropdown
  const fetchPatients = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/patients?all=true`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );
      const patientsData = response.data.data || response.data;
      setPatients(patientsData);
      setFilteredPatients(patientsData);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rooms for dropdown
  const fetchRooms = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/rooms`
      );
      const roomsData = response.data.data || response.data;
      setRooms(roomsData);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };

  // Fetch beds for selected room
  const fetchBeds = async (roomId) => {
    if (!roomId) {
      setBeds([]);
      return;
    }
    
    console.log('Fetching beds for room ID:', roomId);
    setLoadingRooms(true);
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/rooms/${roomId}/beds`
      );
      console.log('Beds API response:', response);
      
      const bedsData = response.data.data || response.data;
      console.log('Processed beds data:', bedsData);
      
      setBeds(bedsData);
    } catch (err) {
      console.error("Failed to fetch beds:", err);
      console.error("Error details:", err.response?.data || err.message);
      setBeds([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (user && birthcare_Id) {
      fetchBirthCareInfo();
      fetchPatients();
      fetchRooms();
    }
  }, [user, birthcare_Id]);

  // Search functionality
  useEffect(() => {
    if (patients.length > 0) {
      const filtered = patients.filter((patient) => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const phoneNumber = patient.phone_number || '';
        return (
          fullName.includes(searchTerm.toLowerCase()) ||
          phoneNumber.includes(searchTerm)
        );
      });
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      ...formData,
      patient_id: patient.patient_id || patient.id,
    });
    setSearchTerm(`${patient.first_name} ${patient.last_name}`);
    setShowPatientDropdown(false);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'room_id') {
      // When room changes, fetch beds for that room and clear bed selection
      setFormData(prev => ({
        ...prev,
        room_id: value,
        bed_id: ""
      }));
      fetchBeds(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Fill sample data for testing - only fills empty fields
  const fillSampleData = () => {
    const firstPatient = patients.length > 0 ? patients[0] : null;
    const firstPatientId = firstPatient ? (firstPatient.patient_id || firstPatient.id) : "";
    
    // Set selected patient and search term only if no patient is currently selected
    if (firstPatient && !selectedPatient) {
      setSelectedPatient(firstPatient);
      setSearchTerm(`${firstPatient.first_name} ${firstPatient.last_name}`);
    }
    
    // Define sample data
    const sampleData = {
      patient_id: firstPatientId,
      admission_type: "emergency",
      chief_complaint: "Severe abdominal pain and contractions",
      reason_for_admission: "Patient presents with regular contractions every 3-5 minutes, cervical dilation of 4cm, and rupture of membranes. Admitted for active labor management and delivery.",
      medical_history: "Previous cesarean section (2020), gestational diabetes in previous pregnancy, no other significant medical history.",
      allergies: "Penicillin (rash), Latex (contact dermatitis)",
      current_medications: "Prenatal vitamins, Iron supplements, Folic acid 400mcg daily",
      vital_signs_temperature: "37.2",
      vital_signs_blood_pressure: "130/85",
      vital_signs_heart_rate: "88",
      vital_signs_respiratory_rate: "18",
      vital_signs_oxygen_saturation: "98",
      weight: "68.5",
      height: "165.0",
      attending_physician: "Dr. Maria Santos",
      primary_nurse: "Nurse Jane Doe",
      ward_section: "labor_delivery",
      admission_source: "emergency",
      insurance_information: "PhilHealth Member - Active, Policy #: 123456789012. Coverage includes maternity benefits and newborn care.",
      emergency_contact_name: "Juan Dela Cruz",
      emergency_contact_relationship: "Spouse",
      emergency_contact_phone: "09123456789",
      patient_belongings: "Mobile phone, charger, personal toiletries, birth plan documents, insurance cards",
      special_dietary_requirements: "Diabetic diet - low sugar, high fiber. No seafood due to allergies.",
      mobility_assistance_needed: true,
      fall_risk_assessment: "moderate",
      isolation_precautions: "Standard precautions",
      patient_orientation_completed: true,
      family_notification_completed: true,
      advance_directives: "No DNR orders. Patient wishes for natural birth if possible, but consents to C-section if medically necessary.",
      discharge_planning_needs: "Postpartum care education, breastfeeding support, newborn care instructions, follow-up appointment scheduling",
      physical_examination: "Gravid uterus at 39 weeks gestation, fetal heart rate 140-150 bpm, vertex presentation, cervix 4cm dilated and 80% effaced, membranes ruptured with clear fluid.",
      initial_diagnosis: "Active labor at 39 weeks gestation, G2P1, previous C-section",
      treatment_plan: "Continuous fetal monitoring, IV hydration, pain management as requested, prepare for vaginal delivery with C-section backup plan",
      status: "in-labor",
      notes: "Patient is anxious about VBAC (vaginal birth after cesarean). Discussed risks and benefits. Birth plan reviewed and documented. Partner present and supportive."
    };
    
    // Only fill fields that are currently empty
    const updatedFormData = { ...formData };
    Object.keys(sampleData).forEach(key => {
      // For string fields, check if they are empty or just whitespace
      if (typeof formData[key] === 'string') {
        if (!formData[key] || formData[key].trim() === '') {
          updatedFormData[key] = sampleData[key];
        }
      }
      // For boolean fields, only update if they are false (default state)
      else if (typeof formData[key] === 'boolean') {
        if (!formData[key]) {
          updatedFormData[key] = sampleData[key];
        }
      }
      // For other fields (like patient_id), only update if empty
      else if (!formData[key]) {
        updatedFormData[key] = sampleData[key];
      }
    });
    
    setFormData(updatedFormData);
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Debug: Log form data before submission
    console.log('Form data being submitted:', formData);
    console.log('Selected patient:', selectedPatient);
    
    // Client-side validation
    if (!formData.patient_id) {
      setErrorMessage('Please select a patient before submitting the form.');
      setShowError(true);
      setSubmitting(false);
      return;
    }
    
    try {
      const response = await axios.post(`/api/birthcare/${birthcare_Id}/patient-admissions`, formData);
      
      if (response.status === 201 || response.status === 200) {
        setSuccessMessage('Patient admission created successfully!');
        setShowSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
      
      // Reset form and patient selection
      setFormData({
        patient_id: "",
        admission_date: new Date().toISOString().split('T')[0],
        admission_time: new Date().toTimeString().slice(0, 5),
        admission_type: "regular",
        chief_complaint: "",
        reason_for_admission: "",
        medical_history: "",
        allergies: "",
        current_medications: "",
        vital_signs_temperature: "",
        vital_signs_blood_pressure: "",
        vital_signs_heart_rate: "",
        vital_signs_respiratory_rate: "",
        vital_signs_oxygen_saturation: "",
        weight: "",
        height: "",
        attending_physician: "",
        primary_nurse: "",
        room_id: "",
        bed_id: "",
        ward_section: "",
        admission_source: "",
        insurance_information: "",
        emergency_contact_name: "",
        emergency_contact_relationship: "",
        emergency_contact_phone: "",
        patient_belongings: "",
        special_dietary_requirements: "",
        mobility_assistance_needed: false,
        fall_risk_assessment: "low",
        isolation_precautions: "",
        patient_orientation_completed: false,
        family_notification_completed: false,
        advance_directives: "",
        discharge_planning_needs: "",
        physical_examination: "",
        initial_diagnosis: "",
        treatment_plan: "",
        status: "in-labor",
        notes: "",
      });
      setSelectedPatient(null);
      setSearchTerm('');
      setBeds([]);
      
    } catch (error) {
      console.error('Error creating admission:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMsg = 'Error creating admission. Please try again.';
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        errorMsg = `Validation errors:\n${errorMessages}`;
      } else if (error.response?.data?.message) {
        errorMsg = `Server Error: ${error.response.data.message}`;
      } else if (error.response?.status) {
        errorMsg = `HTTP ${error.response.status}: ${error.response.statusText || 'Server Error'}`;
      } else if (error.message) {
        errorMsg = `Network Error: ${error.message}`;
      }
      
      setErrorMessage(errorMsg);
      setShowError(true);
      
      // Auto-hide error message after 8 seconds for longer error messages
      setTimeout(() => {
        setShowError(false);
      }, 8000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_patient_admission"))
  ) {
    return <div>Unauthorized</div>;
  }

  if (loading && patients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading patients...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              {birthCareInfo?.description || ''}
            </p>
            <div className="border-t border-b border-gray-300 py-3">
              <h2 className="text-xl font-bold text-gray-900">PATIENT ADMISSION</h2>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-4rem)]">
          <div className="px-6 py-6 h-full flex flex-col">
            {/* Form Header */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Patient Admission</h1>
                <p className="text-gray-600 mt-1">
                  Complete patient admission form for the birthing facility
                </p>
              </div>
              <button
                type="button"
                onClick={fillSampleData}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 hover:scale-105"
              >
                Fill Sample Data
              </button>
            </div>

            {/* Form */}
            <div className="flex-1">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowPatientDropdown(true);
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Search patients by name or phone..."
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!selectedPatient}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Dropdown List */}
                  {showPatientDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient, index) => (
                          <div
                            key={patient.patient_id || patient.id || `patient-${index}`}
                            onClick={() => handlePatientSelect(patient)}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">
                              {`${patient.first_name} ${patient.middle_name || ""} ${patient.last_name}`.trim()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          No patients found
                        </div>
                      )}
                    </div>
                  )}
                  
                  
                  {/* Click outside to close dropdown */}
                  {showPatientDropdown && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowPatientDropdown(false)}
                    ></div>
                  )}
                </div>

                {/* Admission Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Admission Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admission Date *
                      </label>
                      <input
                        type="date"
                        name="admission_date"
                        value={formData.admission_date}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admission Time *
                      </label>
                      <input
                        type="time"
                        name="admission_time"
                        value={formData.admission_time}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admission Type *
                      </label>
                      <select
                        name="admission_type"
                        value={formData.admission_type}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="regular">Regular</option>
                        <option value="emergency">Emergency</option>
                        <option value="referral">Referral</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Chief Complaint & Present Illness */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chief Complaint
                      </label>
                      <input
                        type="text"
                        name="chief_complaint"
                        value={formData.chief_complaint}
                        onChange={handleFormChange}
                        placeholder="Main reason for admission"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="in-labor">In-Labor</option>
                        <option value="delivered">Delivered</option>
                        <option value="discharged">Discharged</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Admission
                    </label>
                    <textarea
                      name="reason_for_admission"
                      value={formData.reason_for_admission}
                      onChange={handleFormChange}
                      rows={4}
                      placeholder="Detailed reason for admission to the birthing facility"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Medical History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical History
                      </label>
                      <textarea
                        name="medical_history"
                        value={formData.medical_history}
                        onChange={handleFormChange}
                        rows={4}
                        placeholder="Past medical conditions, surgeries, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allergies
                      </label>
                      <textarea
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleFormChange}
                        rows={2}
                        placeholder="Known allergies (drugs, food, environmental)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>

                      <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                        Current Medications
                      </label>
                      <textarea
                        name="current_medications"
                        value={formData.current_medications}
                        onChange={handleFormChange}
                        rows={2}
                        placeholder="Current medications and dosages"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Vital Signs */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Vital Signs</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature
                      </label>
                      <input
                        type="text"
                        name="vital_signs_temperature"
                        value={formData.vital_signs_temperature}
                        onChange={handleFormChange}
                        placeholder="°C"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Pressure
                      </label>
                      <input
                        type="text"
                        name="vital_signs_blood_pressure"
                        value={formData.vital_signs_blood_pressure}
                        onChange={handleFormChange}
                        placeholder="mmHg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate
                      </label>
                      <input
                        type="text"
                        name="vital_signs_heart_rate"
                        value={formData.vital_signs_heart_rate}
                        onChange={handleFormChange}
                        placeholder="bpm"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Respiratory Rate
                      </label>
                      <input
                        type="text"
                        name="vital_signs_respiratory_rate"
                        value={formData.vital_signs_respiratory_rate}
                        onChange={handleFormChange}
                        placeholder="rpm"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        O2 Saturation
                      </label>
                      <input
                        type="text"
                        name="vital_signs_oxygen_saturation"
                        value={formData.vital_signs_oxygen_saturation}
                        onChange={handleFormChange}
                        placeholder="%"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Physical Measurements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="weight"
                        value={formData.weight}
                        onChange={handleFormChange}
                        placeholder="e.g., 65.5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="height"
                        value={formData.height}
                        onChange={handleFormChange}
                        placeholder="e.g., 165.0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Facility Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Facility & Ward Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Nurse
                      </label>
                      <input
                        type="text"
                        name="primary_nurse"
                        value={formData.primary_nurse}
                        onChange={handleFormChange}
                        placeholder="Assigned primary nurse"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ward/Section
                      </label>
                      <select
                        name="ward_section"
                        value={formData.ward_section}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select ward/section</option>
                        <option value="maternity">Maternity Ward</option>
                        <option value="labor_delivery">Labor & Delivery</option>
                        <option value="postpartum">Postpartum</option>
                        <option value="nicu">NICU</option>
                        <option value="general">General Ward</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admission Source
                      </label>
                      <select
                        name="admission_source"
                        value={formData.admission_source}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select source</option>
                        <option value="home">Home</option>
                        <option value="clinic">Clinic</option>
                        <option value="emergency">Emergency Department</option>
                        <option value="transfer">Transfer from Another Facility</option>
                        <option value="physician_referral">Physician Referral</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact & Insurance */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact & Insurance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emergency Contact Name
                        </label>
                        <input
                          type="text"
                          name="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={handleFormChange}
                          placeholder="Full name of emergency contact"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <input
                          type="text"
                          name="emergency_contact_relationship"
                          value={formData.emergency_contact_relationship}
                          onChange={handleFormChange}
                          placeholder="e.g., Spouse, Parent, Sibling"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emergency Contact Phone
                        </label>
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={handleFormChange}
                          placeholder="Contact phone number"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Information
                      </label>
                      <textarea
                        name="insurance_information"
                        value={formData.insurance_information}
                        onChange={handleFormChange}
                        rows={6}
                        placeholder="Insurance provider, policy number, coverage details..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Care Requirements & Precautions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Care Requirements & Precautions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Special Dietary Requirements
                        </label>
                        <textarea
                          name="special_dietary_requirements"
                          value={formData.special_dietary_requirements}
                          onChange={handleFormChange}
                          rows={2}
                          placeholder="Dietary restrictions, preferences, or requirements"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fall Risk Assessment
                        </label>
                        <select
                          name="fall_risk_assessment"
                          value={formData.fall_risk_assessment}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="low">Low Risk</option>
                          <option value="moderate">Moderate Risk</option>
                          <option value="high">High Risk</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Isolation Precautions
                        </label>
                        <input
                          type="text"
                          name="isolation_precautions"
                          value={formData.isolation_precautions}
                          onChange={handleFormChange}
                          placeholder="Any isolation requirements (if applicable)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Patient Belongings
                        </label>
                        <textarea
                          name="patient_belongings"
                          value={formData.patient_belongings}
                          onChange={handleFormChange}
                          rows={2}
                          placeholder="List of personal belongings brought by patient"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                      </div>

                      <div>
                        <label className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            name="mobility_assistance_needed"
                            checked={formData.mobility_assistance_needed}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              mobility_assistance_needed: e.target.checked
                            }))}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Mobility Assistance Needed</span>
                        </label>
                      </div>

                      <div>
                        <label className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            name="patient_orientation_completed"
                            checked={formData.patient_orientation_completed}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              patient_orientation_completed: e.target.checked
                            }))}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Patient Orientation Completed</span>
                        </label>
                      </div>

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="family_notification_completed"
                            checked={formData.family_notification_completed}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              family_notification_completed: e.target.checked
                            }))}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Family Notification Completed</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Directives & Discharge Planning */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Directives & Discharge Planning</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Advance Directives
                      </label>
                      <textarea
                        name="advance_directives"
                        value={formData.advance_directives}
                        onChange={handleFormChange}
                        rows={4}
                        placeholder="Living will, healthcare proxy, DNR orders, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discharge Planning Needs
                      </label>
                      <textarea
                        name="discharge_planning_needs"
                        value={formData.discharge_planning_needs}
                        onChange={handleFormChange}
                        rows={4}
                        placeholder="Anticipated discharge needs, home care requirements, follow-up appointments"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Clinical Assessment */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Assessment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Physical Examination
                      </label>
                      <textarea
                        name="physical_examination"
                        value={formData.physical_examination}
                        onChange={handleFormChange}
                        rows={4}
                        placeholder="Physical examination findings"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Initial Diagnosis
                      </label>
                      <textarea
                        name="initial_diagnosis"
                        value={formData.initial_diagnosis}
                        onChange={handleFormChange}
                        rows={2}
                        placeholder="Working diagnosis"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>

                      <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                        Treatment Plan
                      </label>
                      <textarea
                        name="treatment_plan"
                        value={formData.treatment_plan}
                        onChange={handleFormChange}
                        rows={2}
                        placeholder="Planned treatment and care"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Administrative Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Administrative Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attending Physician
                      </label>
                      <input
                        type="text"
                        name="attending_physician"
                        value={formData.attending_physician}
                        onChange={handleFormChange}
                        placeholder="Dr. Name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Room
                      </label>
                      <select
                        name="room_id"
                        value={formData.room_id}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Select a room --</option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bed
                      </label>
                      <select
                        name="bed_id"
                        value={formData.bed_id}
                        onChange={handleFormChange}
                        disabled={!formData.room_id || loadingRooms}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select a bed --</option>
                        {beds
                          .filter(bed => !bed.is_occupied)
                          .map((bed) => (
                            <option key={bed.id} value={bed.id}>
                              Bed {bed.bed_no}
                            </option>
                          ))
                        }
                      </select>
                      {loadingRooms && (
                        <div className="mt-2 text-sm text-gray-500 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Loading beds...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={4}
                    placeholder="Any additional notes or observations"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ></textarea>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        patient_id: "",
                        admission_date: new Date().toISOString().split('T')[0],
                        admission_time: new Date().toTimeString().slice(0, 5),
                        admission_type: "regular",
                        chief_complaint: "",
                        reason_for_admission: "",
                        medical_history: "",
                        allergies: "",
                        current_medications: "",
                        vital_signs_temperature: "",
                        vital_signs_blood_pressure: "",
                        vital_signs_heart_rate: "",
                        vital_signs_respiratory_rate: "",
                        vital_signs_oxygen_saturation: "",
                        weight: "",
                        height: "",
                        attending_physician: "",
                        primary_nurse: "",
                        room_id: "",
                        bed_id: "",
                        ward_section: "",
                        admission_source: "",
                        insurance_information: "",
                        emergency_contact_name: "",
                        emergency_contact_relationship: "",
                        emergency_contact_phone: "",
                        patient_belongings: "",
                        special_dietary_requirements: "",
                        mobility_assistance_needed: false,
                        fall_risk_assessment: "low",
                        isolation_precautions: "",
                        patient_orientation_completed: false,
                        family_notification_completed: false,
                        advance_directives: "",
                        discharge_planning_needs: "",
                        physical_examination: "",
                        initial_diagnosis: "",
                        treatment_plan: "",
                        status: "in-labor",
                        notes: "",
                      });
                      setBeds([]);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-normal text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] transition-all duration-300"
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.room_id || !formData.bed_id}
                    className="px-6 py-3 bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-pink-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer disabled:hover:scale-100 transition-all duration-300 hover:scale-105"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Admission...
                      </>
                    ) : (
                      'Create Patient Admission'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAdmissionPage;
