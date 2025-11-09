"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth";
import { saveBirthDetailsAsPDF, downloadBirthDetailsPDF } from "@/utils/pdfGenerator";
import SearchablePatientSelect from "@/components/SearchablePatientSelect";
import CustomDialog from "@/components/CustomDialog";
import Loading from '@/components/Loading';

export default function BirthDetails() {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [birthCareInfo, setBirthCareInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null, showCancel: false, confirmText: 'OK', cancelText: 'Cancel' });

  // Birth Details Form Data
  const [birthDetails, setBirthDetails] = useState({
    patient_id: '',
    // Birth Information
    baby_name: '',
    date_of_birth: new Date().toISOString().split('T')[0],
    time_of_birth: new Date().toTimeString().slice(0, 5),
    place_of_birth: '',
    delivery_type: 'normal', // normal, cesarean, assisted
    delivery_complications: '',
    
    // Baby Information
    sex: 'male', // male, female
    weight: '', // in grams
    length: '', // in centimeters
    head_circumference: '', // in centimeters
    chest_circumference: '', // in centimeters
    presentation: 'vertex', // vertex, breech, transverse
    plurality: 'single', // single, twin, triplet
    
    // Health Status
    alive_at_birth: true,
    condition_at_birth: 'good', // good, fair, poor
    resuscitation_required: false,
    resuscitation_details: '',
    
    // Birth Attendant
    attendant_name: '',
    attendant_title: 'doctor', // doctor, midwife, nurse
    attendant_license: '',
    
    // Additional Notes
    birth_defects: '',
    special_conditions: '',
    notes: ''
  });

  // APGAR Scores - 1 minute and 5 minutes
  const [apgarScores, setApgarScores] = useState({
    one_minute: {
      activity: 0, // A - Activity (Muscle Tone)
      pulse: 0,    // P - Pulse
      grimace: 0,  // G - Grimace (Reflex Irritability)
      appearance: 0, // A - Appearance (Skin Color)
      respiration: 0 // R - Respiration
    },
    five_minutes: {
      activity: 0,
      pulse: 0,
      grimace: 0,
      appearance: 0,
      respiration: 0
    }
  });

  useEffect(() => {
    fetchPatients();
    fetchBirthCareInfo();
  }, []);

  if (!user) {
    return <Loading />;
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_birth_details"))
  ) {
    return <div>Unauthorized</div>;
  }

  const fetchPatients = async () => {
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
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBirthCareInfo = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}`);
      // Handle multiple possible response shapes
      const facilityData = response.data.data || response.data;
      setBirthCareInfo(facilityData);
    } catch (error) {
      console.error('Error fetching birth care info:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setBirthDetails(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePatientSelect = (patientId) => {
    const patient = patients.find(p => p.id === parseInt(patientId));
    setSelectedPatient(patient);
    setBirthDetails(prev => ({
      ...prev,
      patient_id: patientId
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!birthDetails.patient_id) newErrors.patient_id = 'Patient is required';
    if (!birthDetails.baby_name) newErrors.baby_name = 'Baby\'s name is required';
    if (!birthDetails.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!birthDetails.time_of_birth) newErrors.time_of_birth = 'Time of birth is required';
    if (!birthDetails.place_of_birth) newErrors.place_of_birth = 'Place of birth is required';
    if (!birthDetails.weight) newErrors.weight = 'Weight is required';
    if (!birthDetails.length) newErrors.length = 'Length is required';
    if (!birthDetails.attendant_name) newErrors.attendant_name = 'Attendant name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Generate PDF and save to patient documents
      if (selectedPatient) {
        // Combine birth details with APGAR scores
        const completeData = {
          ...birthDetails,
          apgar_scores: {
            one_minute: {
              activity: apgarScores.one_minute.activity,
              pulse: apgarScores.one_minute.pulse,
              grimace: apgarScores.one_minute.grimace,
              appearance: apgarScores.one_minute.appearance,
              respiration: apgarScores.one_minute.respiration,
              total: calculateTotal('one_minute')
            },
            five_minutes: {
              activity: apgarScores.five_minutes.activity,
              pulse: apgarScores.five_minutes.pulse,
              grimace: apgarScores.five_minutes.grimace,
              appearance: apgarScores.five_minutes.appearance,
              respiration: apgarScores.five_minutes.respiration,
              total: calculateTotal('five_minutes')
            }
          }
        };
        
        // Generate PDF data with complete information
        const pdfData = await saveBirthDetailsAsPDF(completeData, selectedPatient, birthcare_Id, birthCareInfo);
        
        // Save to patient documents
        await axios.post(`/api/birthcare/${birthcare_Id}/patient-documents/from-data`, {
          patient_id: birthDetails.patient_id,
          title: pdfData.title,
          document_type: pdfData.document_type,
          content: pdfData.base64PDF,
          metadata: pdfData.metadata,
        });
        
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Birth details record created and saved to patient documents successfully!',
          onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
        });
        
        // Reset form
        setBirthDetails({
          patient_id: '',
          baby_name: '',
          date_of_birth: new Date().toISOString().split('T')[0],
          time_of_birth: new Date().toTimeString().slice(0, 5),
          place_of_birth: '',
          delivery_type: 'normal',
          delivery_complications: '',
          sex: 'male',
          weight: '',
          length: '',
          head_circumference: '',
          chest_circumference: '',
          presentation: 'vertex',
          plurality: 'single',
          alive_at_birth: true,
          condition_at_birth: 'good',
          resuscitation_required: false,
          resuscitation_details: '',
          attendant_name: '',
          attendant_title: 'doctor',
          attendant_license: '',
          birth_defects: '',
          special_conditions: '',
          notes: ''
        });
        
        // Reset APGAR scores
        setApgarScores({
          one_minute: {
            activity: 0,
            pulse: 0,
            grimace: 0,
            appearance: 0,
            respiration: 0
          },
          five_minutes: {
            activity: 0,
            pulse: 0,
            grimace: 0,
            appearance: 0,
            respiration: 0
          }
        });
        
        // Clear selected patient
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error('Error saving birth details:', error);
      if (error.response?.data?.message) {
        setDialog({ isOpen: true, type: 'error', title: 'Error', message: `Error: ${error.response.data.message}`, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
      } else {
        setDialog({ isOpen: true, type: 'error', title: 'Error', message: 'Error saving birth details. Please try again.', onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
      }
    } finally {
      setSaving(false);
    }
  };

  // APGAR Score handling functions
  const handleScoreChange = (timeframe, category, score) => {
    setApgarScores(prev => ({
      ...prev,
      [timeframe]: {
        ...prev[timeframe],
        [category]: parseInt(score)
      }
    }));
  };

  const calculateTotal = (timeframe) => {
    const scores = apgarScores[timeframe];
    return scores.activity + scores.pulse + scores.grimace + scores.appearance + scores.respiration;
  };

  const getScoreInterpretation = (total) => {
    if (total >= 7) return { text: 'Normal', color: 'text-green-600' };
    if (total >= 4) return { text: 'Might require some resuscitative measures', color: 'text-yellow-600' };
    return { text: 'Immediate Resuscitation', color: 'text-red-600' };
  };

  // APGAR Scoring criteria
  const scoringCriteria = {
    activity: {
      0: { label: 'Absent', description: 'No movement, muscle tone absent' },
      1: { label: 'Arms and Legs Flexed', description: 'Some flexion of extremities' },
      2: { label: 'Active Movements', description: 'Active motion, good muscle tone' }
    },
    pulse: {
      0: { label: 'Absent', description: 'No heart rate' },
      1: { label: 'Below 100bpm', description: 'Heart rate less than 100 beats per minute' },
      2: { label: 'Above 100bpm', description: 'Heart rate over 100 beats per minute' }
    },
    grimace: {
      0: { label: 'No Response', description: 'No response to stimulation' },
      1: { label: 'Grimace', description: 'Grimace or weak cry with stimulation' },
      2: { label: 'Sneeze, Cough, Pulls Away', description: 'Good response, sneeze, cough, pulls away' }
    },
    appearance: {
      0: { label: 'Blue-Gray Pale All Over', description: 'Completely blue or pale' },
      1: { label: 'Normal Except for Extremities', description: 'Body pink, extremities blue' },
      2: { label: 'Normal Over Entire Body', description: 'Completely pink or normal color' }
    },
    respiration: {
      0: { label: 'Absent', description: 'No breathing effort' },
      1: { label: 'Slow, Irregular', description: 'Weak cry, irregular breathing' },
      2: { label: 'Good, Crying', description: 'Strong cry, regular breathing' }
    }
  };

  // Handle preview PDF
  const handlePreviewPDF = () => {
    if (!birthDetails.patient_id) {
      setDialog({ isOpen: true, type: 'error', title: 'Missing Patient', message: 'Please select a patient first.', onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
      return;
    }
    
    if (!selectedPatient) {
      setDialog({ isOpen: true, type: 'error', title: 'Not Loaded', message: 'Patient information not loaded.', onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
      return;
    }
    
    try {
      // Combine birth details with APGAR scores for preview
      const completeData = {
        ...birthDetails,
        apgar_scores: {
          one_minute: {
            activity: apgarScores.one_minute.activity,
            pulse: apgarScores.one_minute.pulse,
            grimace: apgarScores.one_minute.grimace,
            appearance: apgarScores.one_minute.appearance,
            respiration: apgarScores.one_minute.respiration,
            total: calculateTotal('one_minute')
          },
          five_minutes: {
            activity: apgarScores.five_minutes.activity,
            pulse: apgarScores.five_minutes.pulse,
            grimace: apgarScores.five_minutes.grimace,
            appearance: apgarScores.five_minutes.appearance,
            respiration: apgarScores.five_minutes.respiration,
            total: calculateTotal('five_minutes')
          }
        }
      };
      
      downloadBirthDetailsPDF(completeData, selectedPatient, birthCareInfo);
    } catch (error) {
      setDialog({ isOpen: true, type: 'error', title: 'Preview Failed', message: 'Failed to generate PDF preview.', onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
      <CustomDialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        showCancel={dialog.showCancel}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">BIRTH DETAILS & APGAR SCORE</h1>
              <p className="text-sm text-gray-900 mt-1 font-medium">Record complete birth details, baby information, and APGAR score assessment</p>
            </div>
          </div>
        </div>

        {/* Patient Selection */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 focus:ring-[#A41F39] focus:border-transparent p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Select Patient Name</label>
              <SearchablePatientSelect
                patients={patients}
                value={birthDetails.patient_id}
                onChange={(patientId) => handlePatientSelect(patientId)}
                placeholder="Search and select the mother/patient..."
                onOpen={fetchPatients}
                className="focus:ring-[#A41F39] focus:border-transparent"
              />
              {errors.patient_id && <p className="text-red-500 text-xs mt-1">{errors.patient_id}</p>}
            </div>
          </div>
        </div>

        {/* Birth Details Form */}
        <div id="birth-details-form" className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Form Header with Sample Data Button */}
            <div className="mb-6 flex justify-between items-start border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Birth Details & APGAR Score Information</h2>
                <p className="text-gray-600 mt-1">
                  Complete the form below to create a new birth details record
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBirthDetails({
                    ...birthDetails,
                    baby_name: 'Maria Isabella Santos',
                    date_of_birth: '2024-01-15',
                    time_of_birth: '08:30',
                    place_of_birth: 'Buhangin Medical Center',
                    delivery_type: 'normal',
                    delivery_complications: 'None',
                    sex: 'female',
                    weight: '3250',
                    length: '50.5',
                    head_circumference: '35.0',
                    chest_circumference: '33.0',
                    presentation: 'vertex',
                    plurality: 'single',
                    alive_at_birth: true,
                    condition_at_birth: 'good',
                    resuscitation_required: false,
                    resuscitation_details: '',
                    attendant_name: 'Dr. Sarah Johnson',
                    attendant_title: 'doctor',
                    attendant_license: 'MD-2019-001234',
                    birth_defects: 'None observed',
                    special_conditions: 'None',
                    notes: 'Normal spontaneous vaginal delivery. Baby born in good condition with strong cry. APGAR scores 8/9. Mother and baby doing well.'
                  });
                  // Set sample APGAR scores
                  setApgarScores({
                    one_minute: {
                      activity: 2,    // Active Movements
                      pulse: 2,       // Above 100bpm
                      grimace: 1,     // Grimace
                      appearance: 1,  // Normal except for extremities
                      respiration: 2  // Good, Crying
                    },
                    five_minutes: {
                      activity: 2,    // Active Movements
                      pulse: 2,       // Above 100bpm
                      grimace: 2,     // Sneeze, Cough, Pulls Away
                      appearance: 2,  // Normal over entire body
                      respiration: 2  // Good, Crying
                    }
                  });
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border border-transparent rounded-xl text-sm font-medium text-white hover:shadow-lg hover:shadow-[#BF3853]/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853] transition-all duration-300 hover:scale-105"
              >
                Fill Sample Data
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Birth Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">
                  Birth Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Baby's Name</label>
                    <input
                      type="text"
                      placeholder="Enter baby's full name"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      value={birthDetails.baby_name}
                      onChange={(e) => handleInputChange('baby_name', e.target.value)}
                    />
                    {errors.baby_name && <p className="text-red-500 text-xs mt-1">{errors.baby_name}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.date_of_birth}
                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      />
                      {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time of Birth</label>
                      <input
                        type="time"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.time_of_birth}
                        onChange={(e) => handleInputChange('time_of_birth', e.target.value)}
                      />
                      {errors.time_of_birth && <p className="text-red-500 text-xs mt-1">{errors.time_of_birth}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                    <input
                      type="text"
                      placeholder="Facility name or location"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      value={birthDetails.place_of_birth}
                      onChange={(e) => handleInputChange('place_of_birth', e.target.value)}
                    />
                    {errors.place_of_birth && <p className="text-red-500 text-xs mt-1">{errors.place_of_birth}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.delivery_type}
                        onChange={(e) => handleInputChange('delivery_type', e.target.value)}
                      >
                        <option value="normal">Normal/Vaginal</option>
                        <option value="cesarean">Cesarean Section</option>
                        <option value="assisted">Assisted Delivery</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Presentation</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.presentation}
                        onChange={(e) => handleInputChange('presentation', e.target.value)}
                      >
                        <option value="vertex">Vertex (Head Down)</option>
                        <option value="breech">Breech</option>
                        <option value="transverse">Transverse</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Complications</label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      rows="3"
                      placeholder="Any complications during delivery..."
                      value={birthDetails.delivery_complications}
                      onChange={(e) => handleInputChange('delivery_complications', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Baby Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">
                  Baby Information
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.sex}
                        onChange={(e) => handleInputChange('sex', e.target.value)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plurality</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.plurality}
                        onChange={(e) => handleInputChange('plurality', e.target.value)}
                      >
                        <option value="single">Single</option>
                        <option value="twin">Twin</option>
                        <option value="triplet">Triplet</option>
                        <option value="multiple">Multiple</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3250"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                      />
                      {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 50.5"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.length}
                        onChange={(e) => handleInputChange('length', e.target.value)}
                      />
                      {errors.length && <p className="text-red-500 text-xs mt-1">{errors.length}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Head Circumference (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 35.0"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.head_circumference}
                        onChange={(e) => handleInputChange('head_circumference', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chest Circumference (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 33.0"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        value={birthDetails.chest_circumference}
                        onChange={(e) => handleInputChange('chest_circumference', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Health Status at Birth</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="alive_at_birth"
                            value="true"
                            checked={birthDetails.alive_at_birth === true}
                            onChange={() => handleInputChange('alive_at_birth', true)}
                            className="mr-2"
                          />
                          Alive at Birth
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="alive_at_birth"
                            value="false"
                            checked={birthDetails.alive_at_birth === false}
                            onChange={() => handleInputChange('alive_at_birth', false)}
                            className="mr-2"
                          />
                          Not Alive at Birth
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition at Birth</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      value={birthDetails.condition_at_birth}
                      onChange={(e) => handleInputChange('condition_at_birth', e.target.value)}
                    >
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={birthDetails.resuscitation_required}
                        onChange={(e) => handleInputChange('resuscitation_required', e.target.checked)}
                        className="mr-2"
                      />
                      Resuscitation Required
                    </label>
                    {birthDetails.resuscitation_required && (
                      <textarea
                        className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        rows="2"
                        placeholder="Resuscitation details..."
                        value={birthDetails.resuscitation_details}
                        onChange={(e) => handleInputChange('resuscitation_details', e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Birth Attendant Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Birth Attendant Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendant Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    value={birthDetails.attendant_name}
                    onChange={(e) => handleInputChange('attendant_name', e.target.value)}
                  />
                  {errors.attendant_name && <p className="text-red-500 text-xs mt-1">{errors.attendant_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title/Position</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    value={birthDetails.attendant_title}
                    onChange={(e) => handleInputChange('attendant_title', e.target.value)}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="midwife">Midwife</option>
                    <option value="nurse">Nurse</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    placeholder="Professional license number"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    value={birthDetails.attendant_license}
                    onChange={(e) => handleInputChange('attendant_license', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Defects/Abnormalities</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    rows="3"
                    placeholder="Any visible birth defects or abnormalities..."
                    value={birthDetails.birth_defects}
                    onChange={(e) => handleInputChange('birth_defects', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Conditions</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    rows="3"
                    placeholder="Any special medical conditions or considerations..."
                    value={birthDetails.special_conditions}
                    onChange={(e) => handleInputChange('special_conditions', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    rows="4"
                    placeholder="Any additional observations or notes..."
                    value={birthDetails.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* APGAR Score Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">APGAR Score Assessment</h3>
              <p className="text-gray-600 mb-6">Complete the APGAR score evaluation for both 1-minute and 5-minute intervals after birth.</p>
              
              {/* APGAR Score Table */}
              <div className="overflow-x-auto bg-gray-50 p-4 rounded-lg">
                <table className="min-w-full border-collapse border-2 border-gray-300 bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-900 w-20"></th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-900">
                        SIGN<br/>
                        <span className="font-normal text-sm">Assessment Criteria</span>
                      </th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-900">0 POINT</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-900">1 POINT</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-900">2 POINT</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-900">1 MINUTE</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold text-gray-900">5 MINUTES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Activity Row */}
                    <tr>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold bg-gray-50">A</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <strong>Activity</strong><br/>
                        <span className="text-sm">(Muscle Tone)</span>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Absent</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Arms and<br/>Legs Flexed</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Active<br/>Movements</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.one_minute.activity}
                          onChange={(e) => handleScoreChange('one_minute', 'activity', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.five_minutes.activity}
                          onChange={(e) => handleScoreChange('five_minutes', 'activity', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                    </tr>

                    {/* Pulse Row */}
                    <tr>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold bg-gray-50">P</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <strong>Pulse</strong>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Absent</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Below<br/>100bpm</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Above 100bpm</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.one_minute.pulse}
                          onChange={(e) => handleScoreChange('one_minute', 'pulse', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.five_minutes.pulse}
                          onChange={(e) => handleScoreChange('five_minutes', 'pulse', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                    </tr>

                    {/* Grimace Row */}
                    <tr>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold bg-gray-50">G</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <strong>Grimace</strong><br/>
                        <span className="text-sm">(Reflex Irritability)</span>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">No Response</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Grimace</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Sneeze, Cough,<br/>Pulls Away</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.one_minute.grimace}
                          onChange={(e) => handleScoreChange('one_minute', 'grimace', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.five_minutes.grimace}
                          onChange={(e) => handleScoreChange('five_minutes', 'grimace', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                    </tr>

                    {/* Appearance Row */}
                    <tr>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold bg-gray-50">A</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <strong>Appearance</strong><br/>
                        <span className="text-sm">(Skin Color)</span>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Blue-Gray<br/>Pale All Over</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Normal<br/>Except for<br/>Extremities</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Normal Over<br/>Entire Body</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.one_minute.appearance}
                          onChange={(e) => handleScoreChange('one_minute', 'appearance', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.five_minutes.appearance}
                          onChange={(e) => handleScoreChange('five_minutes', 'appearance', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                    </tr>

                    {/* Respiration Row */}
                    <tr>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold bg-gray-50">R</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <strong>Respiration</strong>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Absent</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Slow,<br/>Irregular</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm">Good, Crying</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.one_minute.respiration}
                          onChange={(e) => handleScoreChange('one_minute', 'respiration', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={apgarScores.five_minutes.respiration}
                          onChange={(e) => handleScoreChange('five_minutes', 'respiration', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                    </tr>

                    {/* Total Row */}
                    <tr className="bg-blue-50">
                      <td className="border-2 border-gray-300 px-4 py-3 text-center font-bold" colSpan={5}>
                        <strong>TOTAL</strong>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {calculateTotal('one_minute')}
                        </div>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {calculateTotal('five_minutes')}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Score Interpretation */}
              <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">APGAR Score Interpretation:</h4>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="font-medium">➤ 7 to 10</span>
                    <span className="text-gray-900 font-medium">Normal</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="font-medium">➤ 4 to 6</span>
                    <span className="text-gray-900 font-medium">Might require some resuscitative measures</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="font-medium">➤ 0 to 3</span>
                    <span className="text-gray-900 font-medium">Immediate Resuscitation</span>
                  </div>
                </div>

                {/* Current Scores Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border-1 border-black-500">
                    <h5 className="font-semibold text-gray-900 mb-2">1 Minute Score</h5>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {calculateTotal('one_minute')}
                    </div>
                    <div className={`font-medium ${getScoreInterpretation(calculateTotal('one_minute')).color}`}>
                      {getScoreInterpretation(calculateTotal('one_minute')).text}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border-1 border-black-500">
                    <h5 className="font-semibold text-gray-900 mb-2">5 Minutes Score</h5>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {calculateTotal('five_minutes')}
                    </div>
                    <div className={`font-medium ${getScoreInterpretation(calculateTotal('five_minutes')).color}`}>
                      {getScoreInterpretation(calculateTotal('five_minutes')).text}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
              <button
                type="button"
                onClick={handlePreviewPDF}
                disabled={!birthDetails.patient_id || saving}
                className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center">
                  Preview PDF
                </span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#8B1D36] border border-transparent rounded-lg text-sm font-semibold text-white hover:shadow-lg hover:shadow-[#BF3853]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center">
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving to Patient Documents...
                    </>
                  ) : (
                    <>
                      Save to Documents
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}