"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth";
import { saveBirthDetailsAsPDF, downloadBirthDetailsPDF } from "@/utils/pdfGenerator";
import SearchablePatientSelect from "@/components/SearchablePatientSelect";
import SearchableMidwifeSelect from "@/components/SearchableMidwifeSelect";
import CustomDialog from "@/components/CustomDialog";

export default function BirthDetails() {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [birthCareInfo, setBirthCareInfo] = useState(null);
  const [midwives, setMidwives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null, showCancel: false, confirmText: 'OK', cancelText: 'Cancel' });

  // Common Birth Information (shared across all babies)
  const [birthInfo, setBirthInfo] = useState({
    patient_id: '',
    date_of_birth: new Date().toISOString().split('T')[0],
    time_of_birth: new Date().toTimeString().slice(0, 5),
    place_of_birth: '',
    delivery_type: 'normal',
    delivery_complications: '',
    presentation: 'vertex',
    plurality: 'single',
    // Birth Attendant (shared)
    attendant_name: '',
    attendant_title: 'doctor',
    attendant_license: '',
  });

  // Individual Baby Information (array of babies)
  const [babies, setBabies] = useState([{
    id: 1,
    baby_name: '',
    sex: 'male',
    weight: '',
    length: '',
    head_circumference: '',
    chest_circumference: '',
    alive_at_birth: true,
    condition_at_birth: 'good',
    resuscitation_required: false,
    resuscitation_details: '',
    birth_defects: '',
    special_conditions: '',
    notes: '',
    apgar_scores: {
      one_minute: { activity: 0, pulse: 0, grimace: 0, appearance: 0, respiration: 0 },
      five_minutes: { activity: 0, pulse: 0, grimace: 0, appearance: 0, respiration: 0 }
    }
  }]);

  useEffect(() => {
    fetchPatients();
    fetchBirthCareInfo();
    fetchMidwives();
  }, []);

  if (!user) {
    return null;
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

      // Auto-fill place of birth from the registered facility name and enforce normal delivery type
      const facilityName = facilityData?.facility_name || facilityData?.name || facilityData?.clinic_name || '';
      setBirthInfo(prev => ({
        ...prev,
        place_of_birth: facilityName || prev.place_of_birth,
        delivery_type: 'normal',
      }));
    } catch (error) {
      console.error('Error fetching birth care info:', error);
    }
  };

  const fetchMidwives = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/staff`);
      // Filter only midwives (those with role that contains "midwife" or role_id for midwife)
      const allStaff = response.data || [];
      const midwivesOnly = allStaff.filter(staff => 
        staff.role?.toLowerCase().includes('midwife') || 
        staff.role_name?.toLowerCase().includes('midwife')
      );
      setMidwives(midwivesOnly);
    } catch (error) {
      console.error('Error fetching midwives:', error);
    }
  };

  // Handle common birth info changes
  const handleBirthInfoChange = (field, value) => {
    setBirthInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // When plurality changes, adjust number of babies
    if (field === 'plurality') {
      let targetCount = 1;
      if (value === 'twin') targetCount = 2;
      else if (value === 'triplet') targetCount = 3;
      else if (value === 'single') targetCount = 1;
      
      if (value !== 'multiple') {
        setBabies(prev => {
          const current = [...prev];
          if (current.length < targetCount) {
            // Add babies
            for (let i = current.length; i < targetCount; i++) {
              current.push({
                id: i + 1,
                baby_name: '',
                sex: 'male',
                weight: '',
                length: '',
                head_circumference: '',
                chest_circumference: '',
                alive_at_birth: true,
                condition_at_birth: 'good',
                resuscitation_required: false,
                resuscitation_details: '',
                birth_defects: '',
                special_conditions: '',
                notes: '',
                apgar_scores: {
                  one_minute: { activity: 0, pulse: 0, grimace: 0, appearance: 0, respiration: 0 },
                  five_minutes: { activity: 0, pulse: 0, grimace: 0, appearance: 0, respiration: 0 }
                }
              });
            }
          } else if (current.length > targetCount) {
            // Remove extra babies
            return current.slice(0, targetCount);
          }
          return current;
        });
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle individual baby info changes
  const handleBabyChange = (babyId, field, value) => {
    setBabies(prev => prev.map(baby => 
      baby.id === babyId ? { ...baby, [field]: value } : baby
    ));
    if (errors[`baby_${babyId}_${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`baby_${babyId}_${field}`]: ''
      }));
    }
  };

  // Handle APGAR score changes for specific baby
  const handleApgarChange = (babyId, timeframe, category, score) => {
    setBabies(prev => prev.map(baby => 
      baby.id === babyId ? {
        ...baby,
        apgar_scores: {
          ...baby.apgar_scores,
          [timeframe]: {
            ...baby.apgar_scores[timeframe],
            [category]: parseInt(score)
          }
        }
      } : baby
    ));
  };

  // Add a new baby (for multiple births)
  const addBaby = () => {
    const newId = Math.max(...babies.map(b => b.id)) + 1;
    setBabies(prev => [...prev, {
      id: newId,
      baby_name: '',
      sex: 'male',
      weight: '',
      length: '',
      head_circumference: '',
      chest_circumference: '',
      alive_at_birth: true,
      condition_at_birth: 'good',
      resuscitation_required: false,
      resuscitation_details: '',
      birth_defects: '',
      special_conditions: '',
      notes: '',
      apgar_scores: {
        one_minute: { activity: 0, pulse: 0, grimace: 0, appearance: 0, respiration: 0 },
        five_minutes: { activity: 0, pulse: 0, grimace: 0, appearance: 0, respiration: 0 }
      }
    }]);
  };

  // Remove a baby (for multiple births)
  const removeBaby = (babyId) => {
    if (babies.length > 1) {
      setBabies(prev => prev.filter(baby => baby.id !== babyId));
    }
  };

  const handlePatientSelect = (patientId) => {
    const patient = patients.find(p => p.id === parseInt(patientId));
    setSelectedPatient(patient);
    setBirthInfo(prev => ({
      ...prev,
      patient_id: patientId
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate common birth info
    if (!birthInfo.patient_id) newErrors.patient_id = 'Patient is required';
    if (!birthInfo.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!birthInfo.time_of_birth) newErrors.time_of_birth = 'Time of birth is required';
    if (!birthInfo.place_of_birth) newErrors.place_of_birth = 'Place of birth is required';
    if (!birthInfo.attendant_name) newErrors.attendant_name = 'Attendant name is required';

    // Validate each baby
    babies.forEach((baby, index) => {
      if (!baby.baby_name) newErrors[`baby_${baby.id}_baby_name`] = `Baby ${index + 1} name is required`;
      if (!baby.weight) newErrors[`baby_${baby.id}_weight`] = `Baby ${index + 1} weight is required`;
      if (!baby.length) newErrors[`baby_${baby.id}_length`] = `Baby ${index + 1} length is required`;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = (apgarScores) => {
    return apgarScores.activity + apgarScores.pulse + apgarScores.grimace + apgarScores.appearance + apgarScores.respiration;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (selectedPatient) {
        // Save each baby's birth details
        for (const baby of babies) {
          // Combine birth info with baby-specific details
          const completeData = {
            ...birthInfo,
            ...baby,
            apgar_scores: {
              one_minute: {
                ...baby.apgar_scores.one_minute,
                total: calculateTotal(baby.apgar_scores.one_minute)
              },
              five_minutes: {
                ...baby.apgar_scores.five_minutes,
                total: calculateTotal(baby.apgar_scores.five_minutes)
              }
            }
          };
          
          // Generate PDF for this baby
          const pdfData = await saveBirthDetailsAsPDF(completeData, selectedPatient, birthcare_Id, birthCareInfo);
          
          // Save to patient documents
          await axios.post(`/api/birthcare/${birthcare_Id}/patient-documents/from-data`, {
            patient_id: birthInfo.patient_id,
            title: pdfData.title,
            document_type: pdfData.document_type,
            content: pdfData.base64PDF,
            metadata: pdfData.metadata,
          });
        }
        
        const babyCount = babies.length;
        const successMsg = babyCount > 1 
          ? `Birth details for ${babyCount} babies created and saved successfully!`
          : 'Birth details record created and saved to patient documents successfully!';
        
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: successMsg,
          onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
        });
        
        // Reset form
        setBirthInfo({
          patient_id: '',
          date_of_birth: new Date().toISOString().split('T')[0],
          time_of_birth: new Date().toTimeString().slice(0, 5),
          place_of_birth: '',
          delivery_type: 'normal',
          delivery_complications: '',
          presentation: 'vertex',
          plurality: 'single',
          attendant_name: '',
          attendant_title: 'doctor',
          attendant_license: '',
        });
        
        // Reset babies to single baby
        setBabies([{
          id: 1,
          baby_name: '',
          sex: 'male',
          weight: '',
          length: '',
          head_circumference: '',
          chest_circumference: '',
          alive_at_birth: true,
          condition_at_birth: 'good',
          resuscitation_required: false,
          resuscitation_details: '',
          birth_defects: '',
          special_conditions: '',
          notes: '',
          apgar_scores: {
            one_minute: { activity: 0, pulse: 0, grimace: 0, appearance: 0, respiration: 0 },
            five_minutes: { activity: 0, pulse: 0, grimace: 0, appearance: 0, respiration: 0 }
          }
        }]);
        
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

  // Handle preview PDF (preview first baby only)
  const handlePreviewPDF = () => {
    if (!birthInfo.patient_id) {
      setDialog({ isOpen: true, type: 'error', title: 'Missing Patient', message: 'Please select a patient first.', onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
      return;
    }
    
    if (!selectedPatient) {
      setDialog({ isOpen: true, type: 'error', title: 'Not Loaded', message: 'Patient information not loaded.', onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
      return;
    }
    
    try {
      // Preview first baby's data
      const firstBaby = babies[0];
      const completeData = {
        ...birthInfo,
        ...firstBaby,
        apgar_scores: {
          one_minute: {
            ...firstBaby.apgar_scores.one_minute,
            total: calculateTotal(firstBaby.apgar_scores.one_minute)
          },
          five_minutes: {
            ...firstBaby.apgar_scores.five_minutes,
            total: calculateTotal(firstBaby.apgar_scores.five_minutes)
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
                value={birthInfo.patient_id}
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
                  Complete the form below to create birth details records
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Set sample birth info
                  setBirthInfo({
                    ...birthInfo,
                    date_of_birth: '2024-01-15',
                    time_of_birth: '08:30',
                    place_of_birth: (birthCareInfo?.facility_name || birthCareInfo?.name || birthCareInfo?.clinic_name || birthInfo.place_of_birth),
                    delivery_type: 'normal',
                    delivery_complications: 'None',
                    presentation: 'vertex',
                    plurality: 'single',
                    attendant_name: midwives.length > 0 ? midwives[0].name : 'Sample Midwife',
                    attendant_title: 'midwife',
                    attendant_license: 'MW-2019-001234',
                  });
                  // Set sample baby data
                  setBabies([{
                    id: 1,
                    baby_name: 'Maria Isabella Santos',
                    sex: 'female',
                    weight: '3250',
                    length: '50.5',
                    head_circumference: '35.0',
                    chest_circumference: '33.0',
                    alive_at_birth: true,
                    condition_at_birth: 'good',
                    resuscitation_required: false,
                    resuscitation_details: '',
                    birth_defects: 'None observed',
                    special_conditions: 'None',
                    notes: 'Normal spontaneous vaginal delivery. Baby born in good condition with strong cry. APGAR scores 8/9. Mother and baby doing well.',
                    apgar_scores: {
                      one_minute: { activity: 2, pulse: 2, grimace: 1, appearance: 1, respiration: 2 },
                      five_minutes: { activity: 2, pulse: 2, grimace: 2, appearance: 2, respiration: 2 }
                    }
                  }]);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border border-transparent rounded-xl text-sm font-medium text-white hover:shadow-lg hover:shadow-[#BF3853]/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853] transition-all duration-300 hover:scale-105"
              >
                Fill Sample Data
              </button>
            </div>
            
            {/* Common Birth Information Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">
                Common Birth Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    value={birthInfo.date_of_birth}
                    onChange={(e) => handleBirthInfoChange('date_of_birth', e.target.value)}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time of Birth</label>
                  <input
                    type="time"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    value={birthInfo.time_of_birth}
                    onChange={(e) => handleBirthInfoChange('time_of_birth', e.target.value)}
                  />
                  {errors.time_of_birth && <p className="text-red-500 text-xs mt-1">{errors.time_of_birth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                  <input
                    type="text"
                    placeholder="Facility name or location"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 focus:outline-none"
                    value={birthInfo.place_of_birth}
                    readOnly
                  />
                  {errors.place_of_birth && <p className="text-red-500 text-xs mt-1">{errors.place_of_birth}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 focus:outline-none"
                    value={birthInfo.delivery_type}
                    disabled
                  >
                    <option value="normal">Normal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presentation</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    value={birthInfo.presentation}
                    onChange={(e) => handleBirthInfoChange('presentation', e.target.value)}
                  >
                    <option value="vertex">Vertex (Head Down)</option>
                    <option value="breech">Breech</option>
                    <option value="transverse">Transverse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plurality</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    value={birthInfo.plurality}
                    onChange={(e) => handleBirthInfoChange('plurality', e.target.value)}
                  >
                    <option value="single">Single</option>
                    <option value="twin">Twin</option>
                    <option value="triplet">Triplet</option>
                    <option value="multiple">Multiple (Custom)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Complications</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                  rows="3"
                  placeholder="Any complications during delivery..."
                  value={birthInfo.delivery_complications}
                  onChange={(e) => handleBirthInfoChange('delivery_complications', e.target.value)}
                />
              </div>
            </div>

            {/* Dynamic Baby Sections */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Baby Information {babies.length > 1 && `(${babies.length} Babies)`}
                </h3>
                {birthInfo.plurality === 'multiple' && (
                  <button
                    type="button"
                    onClick={addBaby}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    + Add Baby
                  </button>
                )}
              </div>

              {babies.map((baby, index) => (
                <div key={baby.id} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-semibold text-gray-800">
                      {babies.length > 1 ? `Baby #${index + 1}` : 'Baby Information'}
                    </h4>
                    {babies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBaby(baby.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Baby's Name</label>
                        <input
                          type="text"
                          placeholder="Enter baby's full name"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                          value={baby.baby_name}
                          onChange={(e) => handleBabyChange(baby.id, 'baby_name', e.target.value)}
                        />
                        {errors[`baby_${baby.id}_baby_name`] && <p className="text-red-500 text-xs mt-1">{errors[`baby_${baby.id}_baby_name`]}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                          <select
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                            value={baby.sex}
                            onChange={(e) => handleBabyChange(baby.id, 'sex', e.target.value)}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
                          <input
                            type="number"
                            placeholder="e.g. 3250"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                            value={baby.weight}
                            onChange={(e) => handleBabyChange(baby.id, 'weight', e.target.value)}
                          />
                          {errors[`baby_${baby.id}_weight`] && <p className="text-red-500 text-xs mt-1">{errors[`baby_${baby.id}_weight`]}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 50.5"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                            value={baby.length}
                            onChange={(e) => handleBabyChange(baby.id, 'length', e.target.value)}
                          />
                          {errors[`baby_${baby.id}_length`] && <p className="text-red-500 text-xs mt-1">{errors[`baby_${baby.id}_length`]}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Head Circumference (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 35.0"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                            value={baby.head_circumference}
                            onChange={(e) => handleBabyChange(baby.id, 'head_circumference', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chest Circumference (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 33.0"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                          value={baby.chest_circumference}
                          onChange={(e) => handleBabyChange(baby.id, 'chest_circumference', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Health Status at Birth</label>
                        <div className="flex items-center space-x-6">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`alive_at_birth_${baby.id}`}
                              value="true"
                              checked={baby.alive_at_birth === true}
                              onChange={() => handleBabyChange(baby.id, 'alive_at_birth', true)}
                              className="mr-2"
                            />
                            Alive at Birth
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`alive_at_birth_${baby.id}`}
                              value="false"
                              checked={baby.alive_at_birth === false}
                              onChange={() => handleBabyChange(baby.id, 'alive_at_birth', false)}
                              className="mr-2"
                            />
                            Not Alive at Birth
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Condition at Birth</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                          value={baby.condition_at_birth}
                          onChange={(e) => handleBabyChange(baby.id, 'condition_at_birth', e.target.value)}
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
                            checked={baby.resuscitation_required}
                            onChange={(e) => handleBabyChange(baby.id, 'resuscitation_required', e.target.checked)}
                            className="mr-2"
                          />
                          Resuscitation Required
                        </label>
                        {baby.resuscitation_required && (
                          <textarea
                            className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                            rows="2"
                            placeholder="Resuscitation details..."
                            value={baby.resuscitation_details}
                            onChange={(e) => handleBabyChange(baby.id, 'resuscitation_details', e.target.value)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Right: Additional Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Birth Defects/Abnormalities</label>
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                          rows="3"
                          placeholder="Any visible birth defects or abnormalities..."
                          value={baby.birth_defects}
                          onChange={(e) => handleBabyChange(baby.id, 'birth_defects', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Conditions</label>
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                          rows="3"
                          placeholder="Any special medical conditions..."
                          value={baby.special_conditions}
                          onChange={(e) => handleBabyChange(baby.id, 'special_conditions', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                          rows="4"
                          placeholder="Any additional observations..."
                          value={baby.notes}
                          onChange={(e) => handleBabyChange(baby.id, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Birth Attendant Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Birth Attendant Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendant Name</label>
                  <SearchableMidwifeSelect
                    midwives={midwives}
                    value={birthInfo.attendant_name}
                    onChange={(id, name) => {
                      handleBirthInfoChange('attendant_name', name);
                    }}
                    placeholder="Search and select midwife..."
                    onOpen={fetchMidwives}
                  />
                  {errors.attendant_name && <p className="text-red-500 text-xs mt-1">{errors.attendant_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title/Position</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 focus:outline-none"
                    value={birthInfo.attendant_title}
                    disabled
                  >
                    <option value="midwife">Midwife</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    placeholder="Professional license number"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    value={birthInfo.attendant_license}
                    onChange={(e) => handleBirthInfoChange('attendant_license', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* APGAR Score Section - One table per baby */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">APGAR Score Assessment</h3>
              <p className="text-gray-600 mb-6">Complete the APGAR score evaluation for both 1-minute and 5-minute intervals after birth.</p>
              
              {babies.map((baby, index) => (
                <div key={baby.id} className="mb-8">
                  {babies.length > 1 && (
                    <h4 className="text-md font-semibold text-gray-800 mb-4">APGAR Score for Baby #{index + 1} - {baby.baby_name || 'Unnamed'}</h4>
                  )}
                  
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
                          value={baby.apgar_scores.one_minute.activity}
                          onChange={(e) => handleApgarChange(baby.id, 'one_minute', 'activity', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={baby.apgar_scores.five_minutes.activity}
                          onChange={(e) => handleApgarChange(baby.id, 'five_minutes', 'activity', e.target.value)}
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
                          value={baby.apgar_scores.one_minute.pulse}
                          onChange={(e) => handleApgarChange(baby.id, 'one_minute', 'pulse', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={baby.apgar_scores.five_minutes.pulse}
                          onChange={(e) => handleApgarChange(baby.id, 'five_minutes', 'pulse', e.target.value)}
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
                          value={baby.apgar_scores.one_minute.grimace}
                          onChange={(e) => handleApgarChange(baby.id, 'one_minute', 'grimace', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={baby.apgar_scores.five_minutes.grimace}
                          onChange={(e) => handleApgarChange(baby.id, 'five_minutes', 'grimace', e.target.value)}
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
                          value={baby.apgar_scores.one_minute.appearance}
                          onChange={(e) => handleApgarChange(baby.id, 'one_minute', 'appearance', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={baby.apgar_scores.five_minutes.appearance}
                          onChange={(e) => handleApgarChange(baby.id, 'five_minutes', 'appearance', e.target.value)}
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
                          value={baby.apgar_scores.one_minute.respiration}
                          onChange={(e) => handleApgarChange(baby.id, 'one_minute', 'respiration', e.target.value)}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <select 
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#BF3853]"
                          value={baby.apgar_scores.five_minutes.respiration}
                          onChange={(e) => handleApgarChange(baby.id, 'five_minutes', 'respiration', e.target.value)}
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
                          {calculateTotal(baby.apgar_scores.one_minute)}
                        </div>
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {calculateTotal(baby.apgar_scores.five_minutes)}
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
                      {calculateTotal(baby.apgar_scores.one_minute)}
                    </div>
                    <div className={`font-medium ${getScoreInterpretation(calculateTotal(baby.apgar_scores.one_minute)).color}`}>
                      {getScoreInterpretation(calculateTotal(baby.apgar_scores.one_minute)).text}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border-1 border-black-500">
                    <h5 className="font-semibold text-gray-900 mb-2">5 Minutes Score</h5>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {calculateTotal(baby.apgar_scores.five_minutes)}
                    </div>
                    <div className={`font-medium ${getScoreInterpretation(calculateTotal(baby.apgar_scores.five_minutes)).color}`}>
                      {getScoreInterpretation(calculateTotal(baby.apgar_scores.five_minutes)).text}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
              <button
                type="button"
                onClick={handlePreviewPDF}
                disabled={!birthInfo.patient_id || saving}
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