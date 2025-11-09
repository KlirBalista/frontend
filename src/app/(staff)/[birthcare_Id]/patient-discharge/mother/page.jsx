"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth";
import { CheckCircle, X, ChevronDown, Search, Plus, Trash2 } from "lucide-react";
import { saveMotherDischargeAsPDF, downloadMotherDischargePDF } from "@/utils/pdfGenerator";
import Loading from '@/components/Loading';


const MotherDischargePage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const admissionId = searchParams.get('admissionId');
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Keep for compatibility
  
  // Helper function to get current datetime in YYYY-MM-DDTHH:MM format
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Normalize date to YYYY-MM-DD format for date inputs
  const normalizeDate = (value) => {
    if (!value) return '';

    // If it's already a plain date string, keep it
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    // If it's an ISO string with time (e.g., ...T00:00:00Z), convert to local date
    if (typeof value === 'string' && /T/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    // Fallback: try to parse anything else safely
    const d = new Date(value);
    if (!isNaN(d)) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  };

  // Helpers to fill only empty fields when inserting sample data
  const isEmptyStr = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  const mergeIfEmpty = (prev, sample) => {
    const out = { ...prev };

    // Merge simple string fields
    const stringKeys = [
      'patientName','bedNumber','caseNumber','dateAdmitted','dateTimedischarged','dischargeDiagnosis','finalDiagnosis','condition',
      'specialInstructions','followUpCheckUp','staffName','staffSignature','patientSignature','relativeName'
    ];
    for (const k of stringKeys) {
      if (k in sample && isEmptyStr(out[k])) out[k] = sample[k];
    }

    // Merge medications array of objects
    if (Array.isArray(sample.medications)) {
      const len = Math.max(Array.isArray(out.medications) ? out.medications.length : 0, sample.medications.length);
      const merged = [];
      for (let i = 0; i < len; i++) {
        const prevItem = (out.medications && out.medications[i]) || {};
        const sampleItem = sample.medications[i] || {};
        merged[i] = { ...prevItem };
        for (const key of ['name','dosage','frequency','duration']) {
          if (key in sampleItem && isEmptyStr(merged[i][key])) merged[i][key] = sampleItem[key];
        }
      }
      out.medications = merged;
    }

    return out;
  };

  const [formData, setFormData] = useState({
    patient_id: "",
    patientName: "",
    bedNumber: "",
    caseNumber: "",
    dateAdmitted: "",
    dateTimedischarged: getCurrentDateTime(),
    dischargeDiagnosis: "",
    finalDiagnosis: "",
    condition: "",
    medications: [
      { name: "Iron Supplement", dosage: "", frequency: "", duration: "" },
      { name: "Folic Acid", dosage: "", frequency: "", duration: "" },
      { name: "Pain Relief", dosage: "", frequency: "", duration: "" },
      { name: "Others:", dosage: "", frequency: "", duration: "" }
    ],
    specialInstructions: "",
    followUpCheckUp: "",
    staffName: user ? `${user.firstname} ${user.lastname}` : "",
    staffSignature: "",
    patientSignature: "",
    relativeName: ""
  });

  const [facility, setFacility] = useState(null);
  const [loadingFacility, setLoadingFacility] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Patient dropdown state
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Midwife and Patient signature dropdowns
  const [midwives, setMidwives] = useState([]);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [patientSigSearchTerm, setPatientSigSearchTerm] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showPatientSigDropdown, setShowPatientSigDropdown] = useState(false);

  // Fetch facility data
  useEffect(() => {
    const fetchFacility = async () => {
      try {
        console.log('Fetching facility data for:', birthcare_Id);
        const response = await axios.get(`/api/birthcare/${birthcare_Id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        console.log('Facility response:', response.data);
        // Handle multiple possible response shapes
        const facilityData = response.data.data || response.data;
        setFacility(facilityData);
        console.log('Set facility data:', facilityData);
      } catch (error) {
        console.error("Error fetching facility:", error);
      } finally {
        setLoadingFacility(false);
      }
    };

    if (birthcare_Id) {
      fetchFacility();
    }
  }, [birthcare_Id]);

  // Fetch patients for dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}/patients`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        const patientsData = response.data?.data || response.data || [];
        setPatients(patientsData);
        setFilteredPatients(patientsData);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoadingPatients(false);
      }
    };

    if (birthcare_Id) {
      fetchPatients();
    }
  }, [birthcare_Id]);

  // Fetch midwives for healthcare name dropdown
  useEffect(() => {
    const fetchMidwives = async () => {
      try {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}/staff`);
        const staff = response.data || [];
        const mids = staff.filter(s => s.role_name && s.role_name.toLowerCase().includes('midwife'));
        setMidwives(mids);
      } catch (error) {
        console.error('Error fetching midwives:', error);
      }
    };

    if (birthcare_Id) {
      fetchMidwives();
    }
  }, [birthcare_Id]);

  // Auto-select patient if patientId or admissionId is provided in URL
  useEffect(() => {
    if (admissionId) {
      // If admissionId is provided, fetch specific admission data
      fetchAdmissionData(admissionId);
    } else if (patientId) {
      // Fallback to patientId-based selection
      fetchLatestAdmissionForPatient(patientId);
    }
  }, [admissionId, patientId]);

  // Filter patients based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => {
        const fullName = `${patient.first_name || ''} ${patient.middle_name || ''} ${patient.last_name || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.patient-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index][field] = value;
    setFormData(prev => ({
      ...prev,
      medications: updatedMedications
    }));
  };

  const handleAddMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: "", dosage: "", frequency: "", duration: "" }]
    }));
  };

  const handleRemoveMedication = (index) => {
    if (formData.medications.length > 1) {
      const updatedMedications = formData.medications.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        medications: updatedMedications
      }));
    }
  };
  
  // Handle patient selection from dropdown
  const handlePatientSelect = async (patient) => {
    const fullName = `${patient.first_name || ''} ${patient.middle_name || ''} ${patient.last_name || ''}`.trim();
    setSelectedPatient(patient);
    setSearchTerm(fullName);
    setShowDropdown(false);
    
    // Try to fetch latest admission data for selected patient
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/patients/${patient.id}/admission-data`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );
      
      const admissionData = response.data.admission || response.data;
      
      console.log('Setting admission data:', { 
        admission_date: admissionData?.admission_date,
        normalized: admissionData?.admission_date ? normalizeDate(admissionData.admission_date) : 'N/A'
      });
      setFormData(prev => ({
        ...prev,
        patient_id: patient.id,
        patientName: fullName,
        bedNumber: admissionData ? (admissionData.bed_number || admissionData.room_name || 'N/A') : 'N/A',
        caseNumber: admissionData ? (admissionData.case_number || admissionData.id?.toString() || '') : '',
        dateAdmitted: admissionData?.admission_date ? normalizeDate(admissionData.admission_date) : '',
        dateTimedischarged: getCurrentDateTime()
      }));
    } catch (error) {
      console.error('Error fetching admission data for patient:', error);
      // Still set basic patient info even if admission data fetch fails
      setFormData(prev => ({
        ...prev,
        patient_id: patient.id,
        patientName: fullName,
        bedNumber: 'N/A',
        caseNumber: '',
        dateAdmitted: '',
        dateTimedischarged: getCurrentDateTime()
      }));
    }
  };

  // Fetch specific admission data when admissionId is provided
  const fetchAdmissionData = async (admissionIdParam) => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/patient-admissions/${admissionIdParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );
      
      const admission = response.data;
      const patient = admission.patient;
      const fullName = `${patient.first_name || ''} ${patient.middle_name || ''} ${patient.last_name || ''}`.trim();
      
      setSelectedPatient(patient);
      setSearchTerm(fullName);
      
      console.log('Setting admission data from fetchAdmissionData:', { 
        admission_date: admission.admission_date,
        normalized: admission.admission_date ? normalizeDate(admission.admission_date) : 'N/A'
      });
      setFormData(prev => ({
        ...prev,
        patient_id: patient.id,
        patientName: fullName,
        bedNumber: admission.bed?.bed_no || admission.room?.name || 'N/A',
        caseNumber: admission.id.toString(),
        dateAdmitted: admission.admission_date ? normalizeDate(admission.admission_date) : '',
        dateTimedischarged: getCurrentDateTime() // Auto-set current date/time for discharge
      }));
    } catch (error) {
      console.error('Error fetching specific admission data:', error);
    }
  };

  // Fetch latest admission data using patientId (fallback when no admissionId)
  const fetchLatestAdmissionForPatient = async (patientIdParam) => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/patients/${patientIdParam}/admission-data`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );

      const admissionData = response.data.admission || response.data;
      const patient = response.data.patient || admissionData?.patient;
      const fullName = patient ? `${patient.first_name || ''} ${patient.middle_name || ''} ${patient.last_name || ''}`.trim() : '';

      if (patient) {
        setSelectedPatient(patient);
        setSearchTerm(fullName);
      }

      console.log('Setting admission data from fetchLatestAdmission:', { 
        admission_date: admissionData?.admission_date,
        normalized: admissionData?.admission_date ? normalizeDate(admissionData.admission_date) : 'N/A'
      });
      setFormData(prev => ({
        ...prev,
        patient_id: patient?.id || response.data.patient_id,
        patientName: fullName,
        bedNumber: admissionData ? (admissionData.bed_number || admissionData.room_name || 'N/A') : 'N/A',
        caseNumber: admissionData ? (admissionData.case_number || admissionData.id?.toString() || '') : '',
        dateAdmitted: admissionData?.admission_date ? normalizeDate(admissionData.admission_date) : '',
        dateTimedischarged: getCurrentDateTime(),
      }));
    } catch (error) {
      console.error('Error fetching latest admission for patient:', error);
    }
  };
  
  // Reset form helper
  const resetForm = () => {
    setFormData({
      patient_id: "",
      patientName: "",
      bedNumber: "",
      caseNumber: "",
      dateAdmitted: "",
      dateTimedischarged: getCurrentDateTime(), // Reset to current date/time
      dischargeDiagnosis: "",
      finalDiagnosis: "",
      condition: "",
      medications: [
        { name: "Iron Supplement", dosage: "", frequency: "", duration: "" },
        { name: "Folic Acid", dosage: "", frequency: "", duration: "" },
        { name: "Pain Relief", dosage: "", frequency: "", duration: "" },
        { name: "Others:", dosage: "", frequency: "", duration: "" }
      ],
      specialInstructions: "",
      followUpCheckUp: "",
      staffName: user ? `${user.firstname} ${user.lastname}` : "",
      staffSignature: "",
      patientSignature: "",
      relativeName: ""
    });
    setSelectedPatient(null);
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // First save the discharge form
      await axios.post(`/api/birthcare/${birthcare_Id}/discharge/mother`, {
        patient_id: formData.patient_id,
        discharge_data: {
          patient_name: formData.patientName,
          admission_date: formData.dateAdmitted,
          discharge_date: formData.dateTimedischarged,
          diagnosis: formData.dischargeDiagnosis,
          physician_name: formData.staffName,
          nurse_name: formData.staffName, // Using same as physician for now
          instructions: formData.specialInstructions,
          medications: formData.medications,
          follow_up_date: normalizeDate(formData.followUpCheckUp)
        }
      });
      
      // Generate PDF and save to patient documents
      const pdfData = await saveMotherDischargeAsPDF(formData, birthcare_Id, facility);
      
      await axios.post(`/api/birthcare/${birthcare_Id}/patient-documents/from-data`, {
        patient_id: formData.patient_id,
        title: pdfData.title,
        document_type: pdfData.document_type,
        content: pdfData.base64PDF,
        metadata: pdfData.metadata,
      });
      
      setSuccessMessage('Mother discharge form created and saved to patient documents successfully!');
      setShowSuccess(true);
      
      // Reset form
      resetForm();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving form:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join('\n');
        setErrorMessage(`Validation errors:\n${errorMessages}`);
      } else if (error.response?.data?.message) {
        setErrorMessage(`Error: ${error.response.data.message}`);
      } else {
        setErrorMessage('Error saving form. Please try again.');
      }
      
      setShowError(true);
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setShowError(false);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  // Handle preview PDF
  const handlePreviewPDF = () => {
    if (!formData.patient_id) {
      alert('Please select a patient first.');
      return;
    }
    
    try {
      downloadMotherDischargePDF(formData, facility);
    } catch (error) {
      alert('Failed to generate PDF preview.');
    }
  };

  const fillSampleData = () => {
    const sample = {
      patientName: "Maria Santos Dela Cruz",
      bedNumber: "M-201",
      caseNumber: "MDC-2025-001",
      dateAdmitted: "2025-10-10",
      dateTimedischarged: "2025-10-14T10:30",
      dischargeDiagnosis: "Normal Spontaneous Delivery, Live Term Baby",
      finalDiagnosis: "Post Partum - Normal Delivery",
      condition: "Stable, ambulatory, no complications",
      medications: [
        { name: "Iron Supplement", dosage: "325mg", frequency: "Once daily", duration: "30 days" },
        { name: "Folic Acid", dosage: "400mcg", frequency: "Once daily", duration: "30 days" },
        { name: "Pain Relief", dosage: "400mg", frequency: "As needed", duration: "As needed for pain" },
        { name: "Multivitamins", dosage: "1 tablet", frequency: "Once daily", duration: "30 days" }
      ],
      specialInstructions: "Rest for at least 6 weeks. No heavy lifting. Keep incision area clean and dry. Breastfeed regularly. Watch for signs of infection, excessive bleeding, or fever. Return immediately if experiencing severe pain, heavy bleeding, or fever above 38°C.",
      followUpCheckUp: "2025-10-21",
      staffName: "Dr. Anna Rivera, MD",
      staffSignature: "",
      patientSignature: "",
      relativeName: "Mr. Juan Dela Cruz (Husband)"
    };
    setFormData(prev => mergeIfEmpty(prev, sample));
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
      !user.permissions?.includes("manage_patient_discharge"))
  ) {
    return <div>Unauthorized</div>;
  }

  if (loadingFacility) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading facility information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8 text-gray-900 print:bg-white print:py-0">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">
        {/* Official Header */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 mb-6 print:shadow-none print:border-black print:rounded-none overflow-hidden">
          <div className="px-6 py-5 border-b border-white/20 bg-white print:bg-white print:border-b print:border-black text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">MOTHER DISCHARGE INSTRUCTION</h1>
                <p className="text-sm text-gray-900 mt-1">Complete and manage mother discharge documentation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 mb-6 print:shadow-none print:border-black print:rounded-none overflow-hidden">
          <div className="px-6 py-6 h-full flex flex-col">
            {/* Form Header */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 drop-shadow">Patient Information</h3>
            </div>
            
            {/* Form */}
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Patient Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="patient-dropdown relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Patient Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="Search and select patient..."
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        
                        {showDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {loadingPatients ? (
                              <div className="p-4 text-center text-gray-500">
                                Loading patients...
                              </div>
                            ) : filteredPatients.length > 0 ? (
                              filteredPatients.map((patient) => {
                                const fullName = `${patient.first_name || ''} ${patient.middle_name || ''} ${patient.last_name || ''}`.trim();
                                return (
                                  <div
                                    key={patient.id}
                                    onClick={() => handlePatientSelect(patient)}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900">{fullName}</div>
                                    <div className="text-sm text-gray-500">
                                      ID: {patient.id} • {patient.phone || 'No phone'}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                {searchTerm ? 'No patients found' : 'Start typing to search patients'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bed #
                      </label>
                      <input
                        type="text"
                        name="bedNumber"
                        value={formData.bedNumber}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Case No.
                      </label>
                      <input
                        type="text"
                        name="caseNumber"
                        value={formData.caseNumber}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Admission & Discharge Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Admission & Discharge Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Admitted
                      </label>
                      <input
                        type="date"
                        name="dateAdmitted"
                        value={normalizeDate(formData.dateAdmitted)}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date/Time Discharged *
                      </label>
                      <input
                        type="datetime-local"
                        name="dateTimedischarged"
                        value={formData.dateTimedischarged}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discharge Diagnosis *
                      </label>
                      <input
                        type="text"
                        name="dischargeDiagnosis"
                        value={formData.dischargeDiagnosis}
                        onChange={handleInputChange}
                        placeholder="e.g. Normal Spontaneous Delivery"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Final Diagnosis
                      </label>
                      <input
                        type="text"
                        name="finalDiagnosis"
                        value={formData.finalDiagnosis}
                        onChange={handleInputChange}
                        placeholder="e.g. Post Partum - Normal Delivery"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition on Discharge
                    </label>
                    <input
                      type="text"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      placeholder="e.g. Stable, ambulatory, no complications"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                    />
                  </div>
                </div>

                {/* Medications Table */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Medications Prescribed</h3>
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-4 w-4" />
                      Add Medication
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Medication Name
                          </th>
                          <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Dosage
                          </th>
                          <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Frequency
                          </th>
                          <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Duration
                          </th>
                          <th className="border-b border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 w-20">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.medications.map((medication, index) => (
                          <tr key={index} className="border-b border-gray-200 last:border-b-0">
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={medication.name}
                                onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                placeholder="Medication name"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={medication.dosage}
                                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                placeholder="e.g. 325mg"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={medication.frequency}
                                onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                placeholder="e.g. Once daily"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={medication.duration}
                                onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                placeholder="e.g. 30 days"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {formData.medications.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedication(index)}
                                  className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove medication"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Instructions & Follow-up */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions & Follow-up</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions for Mother
                      </label>
                      <textarea
                        name="specialInstructions"
                        value={formData.specialInstructions}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder="Enter detailed discharge instructions for postpartum care, activity restrictions, warning signs to watch for, breastfeeding guidance, etc..."
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        name="followUpCheckUp"
                        value={normalizeDate(formData.followUpCheckUp)}
                        onChange={handleInputChange}
                        placeholder="YYYY-MM-DD"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Signatures</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Healthcare Name
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={staffSearchTerm || formData.staffName}
                          onChange={(e) => {
                            setStaffSearchTerm(e.target.value);
                            setFormData(prev => ({ ...prev, staffName: e.target.value }));
                            setShowStaffDropdown(true);
                          }}
                          onFocus={() => setShowStaffDropdown(true)}
                          placeholder="Search midwife..."
                          className="w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                        />
                      </div>
                      {showStaffDropdown && (staffSearchTerm || formData.staffName) && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {midwives.filter(m => m.name?.toLowerCase().includes((staffSearchTerm || formData.staffName).toLowerCase())).length > 0 ? (
                            midwives.filter(m => m.name?.toLowerCase().includes((staffSearchTerm || formData.staffName).toLowerCase())).map(mw => (
                              <div
                                key={mw.id}
                                onClick={() => {
                                  setStaffSearchTerm(mw.name);
                                  setFormData(prev => ({ ...prev, staffName: mw.name }));
                                  setShowStaffDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{mw.name}</div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500 text-sm">No midwives found</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Patient Name
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={patientSigSearchTerm || formData.patientSignature}
                          onChange={(e) => {
                            setPatientSigSearchTerm(e.target.value);
                            setFormData(prev => ({ ...prev, patientSignature: e.target.value }));
                            setShowPatientSigDropdown(true);
                          }}
                          onFocus={() => setShowPatientSigDropdown(true)}
                          placeholder="Search patient..."
                          className="w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                        />
                      </div>
                      {showPatientSigDropdown && (patientSigSearchTerm || formData.patientSignature) && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {patients.filter(p => `${p.first_name} ${p.middle_name || ''} ${p.last_name}`.toLowerCase().includes((patientSigSearchTerm || formData.patientSignature).toLowerCase())).length > 0 ? (
                            patients.filter(p => `${p.first_name} ${p.middle_name || ''} ${p.last_name}`.toLowerCase().includes((patientSigSearchTerm || formData.patientSignature).toLowerCase())).map(pt => (
                              <div
                                key={pt.id}
                                onClick={() => {
                                  const fullName = `${pt.first_name} ${pt.middle_name || ''} ${pt.last_name}`.trim();
                                  setPatientSigSearchTerm(fullName);
                                  setFormData(prev => ({ ...prev, patientSignature: fullName }));
                                  setShowPatientSigDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{pt.first_name} {pt.middle_name || ''} {pt.last_name}</div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500 text-sm">No patients found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relative/Companion Name
                      </label>
                      <input
                        type="text"
                        name="relativeName"
                        value={formData.relativeName}
                        onChange={handleInputChange}
                        placeholder="Enter Relative/Companion Name"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 print:hidden">
                  <button
                    type="button"
                    onClick={handlePreviewPDF}
                    disabled={!formData.patient_id}
                    className="px-6 py-3 border-2 border-gray-500 rounded-xl text-sm font-semibold text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                  >
                    Preview PDF
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving Form...
                      </>
                    ) : (
                      'Save to Patient Documents'
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

export default MotherDischargePage;