"use client";
import React, { useState, useEffect } from 'react';
import { X, Search, Printer } from 'lucide-react';
import { useParams } from 'next/navigation';
import axios from '@/lib/axios';
import { savePatientChartAsPDF } from '@/utils/pdfGenerator';

const PatientChartModal = ({ isOpen, onClose, onSubmit, editData = null, isEditMode = false }) => {
  const { birthcare_Id } = useParams();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [nurses, setNurses] = useState([]);
  const [nurseSearchTerm, setNurseSearchTerm] = useState('');
  const [showNurseDropdown, setShowNurseDropdown] = useState(false);
  const [midwives, setMidwives] = useState([]);
  const [midwifeSearchTerm, setMidwifeSearchTerm] = useState('');
  const [showMidwifeDropdown, setShowMidwifeDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    // Admission Phase
    patient_id: '', name: '', age: '', address: '', contactNumber: '', gravida: '', para: '',
    edd: '', roomNumber: '', bedNumber: '', admissionDateTime: '', attendingMidwife: '',
    allergies: '', pastIllnesses: '', previousPregnancies: '', lmp: '',
    prenatalCheckups: '', supplements: '', bloodPressure: '', heartRate: '',
    respiratoryRate: '', temperature: '', fetalHeartRate: '', cervicalDilatation: '',
    membranes: '', presentingPart: '', admissionDiagnosis: '',
    // Postpartum Phase
    deliveryDateTime: '', deliveryType: '', perinealCondition: '', estimatedBloodLoss: '',
    fundus: '', lochia: '', postpartumBP: '', postpartumPulse: '', postpartumTemp: '',
    painLevel: '', breastfeedingInitiated: '', babySex: '', birthWeight: '',
    apgarScores: '', initialCry: '', cordCare: '', vitaminK: '', eyeOintment: '',
    babyBreastfeeding: '', complications: '',
    // Discharge Summary
    finalDiagnosis: '', motherCondition: '', babyCondition: '',
    dischargeInstructions: '', dischargeMidwife: '', dischargeDateTime: ''
  });

  // Load edit data when in edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editData) {
      console.log('🔍 Loading edit data:', editData);
      console.log('📋 Available editData keys:', Object.keys(editData));
      console.log('🤱 Raw postpartum_info:', editData.postpartum_info);
      console.log('👶 Raw baby_info:', editData.baby_info);
      console.log('🏠 Raw discharge_summary:', editData.discharge_summary);
      
      // Debug: Log all possible field variations that might exist
      console.log('🔍 Direct field check:');
      const possibleFields = [
        'allergies', 'past_illnesses', 'previous_pregnancies', 'lmp', 'prenatal_checkups', 'supplements',
        'blood_pressure', 'heart_rate', 'respiratory_rate', 'temperature', 'fetal_heart_rate',
        'cervical_dilatation', 'membranes', 'presenting_part', 'admission_diagnosis',
        'delivery_date_time', 'delivery_type', 'baby_sex', 'birth_weight', 'apgar_scores',
        'initial_cry', 'cord_care', 'vitamin_k', 'eye_ointment', 'baby_breastfeeding',
        'complications', 'fundus', 'lochia', 'postpartum_bp', 'postpartum_pulse',
        'postpartum_temp', 'pain_level', 'breastfeeding_initiated', 'final_diagnosis',
        'mother_condition', 'baby_condition', 'discharge_instructions', 'discharge_midwife',
        'discharge_date_time'
      ];
      
      possibleFields.forEach(field => {
        if (editData[field] !== undefined) {
          console.log(`  ✅ ${field}:`, editData[field]);
        }
      });
      
      // The API stores data in nested JSON objects OR directly in root
      // Try to parse JSON strings if they exist, otherwise use empty objects
      let patientInfo = {};
      let medicalHistory = {};
      let admissionAssessment = {};
      let postpartumInfo = {};
      let babyInfo = {};
      let dischargeSummary = {};
      
      // If data is stored as JSON strings, parse them
      if (typeof editData.patient_info === 'string') {
        try { patientInfo = JSON.parse(editData.patient_info); } catch(e) { console.error('Failed to parse patient_info:', e); }
      } else if (editData.patient_info && typeof editData.patient_info === 'object') {
        patientInfo = editData.patient_info;
      }
      
      if (typeof editData.medical_history === 'string') {
        try { medicalHistory = JSON.parse(editData.medical_history); } catch(e) { console.error('Failed to parse medical_history:', e); }
      } else if (editData.medical_history && typeof editData.medical_history === 'object') {
        medicalHistory = editData.medical_history;
      }
      
      if (typeof editData.admission_assessment === 'string') {
        try { admissionAssessment = JSON.parse(editData.admission_assessment); } catch(e) { console.error('Failed to parse admission_assessment:', e); }
      } else if (editData.admission_assessment && typeof editData.admission_assessment === 'object') {
        admissionAssessment = editData.admission_assessment;
      }
      
      if (typeof editData.postpartum_info === 'string') {
        try { postpartumInfo = JSON.parse(editData.postpartum_info); } catch(e) { console.error('Failed to parse postpartum_info:', e); }
      } else if (editData.postpartum_info && typeof editData.postpartum_info === 'object') {
        postpartumInfo = editData.postpartum_info;
      }
      
      if (typeof editData.baby_info === 'string') {
        try { babyInfo = JSON.parse(editData.baby_info); } catch(e) { console.error('Failed to parse baby_info:', e); }
      } else if (editData.baby_info && typeof editData.baby_info === 'object') {
        babyInfo = editData.baby_info;
      }
      
      if (typeof editData.discharge_summary === 'string') {
        try { dischargeSummary = JSON.parse(editData.discharge_summary); } catch(e) { console.error('Failed to parse discharge_summary:', e); }
      } else if (editData.discharge_summary && typeof editData.discharge_summary === 'object') {
        dischargeSummary = editData.discharge_summary;
      }
      
      console.log('📋 Patient Info:', patientInfo);
      console.log('🏥 Medical History:', medicalHistory);
      console.log('📊 Admission Assessment:', admissionAssessment);
      console.log('🤱 Postpartum Info:', postpartumInfo);
      console.log('👶 Baby Info:', babyInfo);
      console.log('🏠 Discharge Summary:', dischargeSummary);
      
      // Build patient name from available data
      let patientName = '';
      if (patientInfo.patientName) {
        patientName = patientInfo.patientName;
      } else if (editData.patient) {
        patientName = `${editData.patient.first_name || ''} ${editData.patient.middle_name || ''} ${editData.patient.last_name || ''}`.trim();
      }
      
      setSearchTerm(patientName);
      
      // Helper function to safely get nested values with multiple fallbacks
      const getValue = (paths, defaultValue = '') => {
        for (const path of paths) {
          if (path != null && path !== '' && path !== undefined) {
            return path;
          }
        }
        return defaultValue;
      };
      
      // Helper to check if object has actual data (not just prototype)
      const hasData = (obj) => {
        return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
      };
      
      // Load discharge midwife/nurse name
      const dischargeMidwifeName = getValue([dischargeSummary.dischargeMidwife]);
      setNurseSearchTerm(dischargeMidwifeName);
      
      // Load attending midwife name
      const attendingMidwifeName = getValue([patientInfo.attendingMidwife]);
      setMidwifeSearchTerm(attendingMidwifeName);

      const loadedFormData = {
        // Patient Information - using exact API field names from console
        patient_id: getValue([editData.patient_id, patientInfo.patientId]),
        name: patientName,
        age: getValue([patientInfo.age]),
        address: getValue([patientInfo.address]),
        contactNumber: getValue([patientInfo.contactNumber]),
        gravida: getValue([patientInfo.gravida]),
        para: getValue([patientInfo.para]),
        edd: getValue([patientInfo.edd]),
        roomNumber: getValue([patientInfo.roomNumber]),
        bedNumber: getValue([patientInfo.bedNumber]),
        admissionDateTime: getValue([patientInfo.admissionDateTime]),
        attendingMidwife: getValue([patientInfo.attendingMidwife]),
        
        // Medical History - using exact API field names from console
        allergies: getValue([medicalHistory.allergies]),
        pastIllnesses: getValue([medicalHistory.pastIllnesses]),
        previousPregnancies: getValue([medicalHistory.previousPregnancies]),
        lmp: getValue([medicalHistory.lmp]),
        prenatalCheckups: getValue([medicalHistory.prenatalCheckups]),
        supplements: getValue([medicalHistory.supplements]),
        
        // Admission Assessment - using exact API field names from console
        bloodPressure: getValue([admissionAssessment.bloodPressure]),
        heartRate: getValue([admissionAssessment.heartRate]),
        respiratoryRate: getValue([admissionAssessment.respiratoryRate]),
        temperature: getValue([admissionAssessment.temperature]),
        fetalHeartRate: getValue([admissionAssessment.fetalHeartRate]),
        cervicalDilatation: getValue([admissionAssessment.cervicalDilatation]),
        membranes: getValue([admissionAssessment.membranes]),
        presentingPart: getValue([admissionAssessment.presentingPart]),
        admissionDiagnosis: getValue([admissionAssessment.admissionDiagnosis]),
        
        // Postpartum fields - check if postpartumInfo has data, fallback to direct editData
        deliveryDateTime: hasData(postpartumInfo) ? getValue([postpartumInfo.deliveryDateTime]) : getValue([editData.deliveryDateTime]),
        deliveryType: hasData(postpartumInfo) ? getValue([postpartumInfo.deliveryType]) : getValue([editData.deliveryType]),
        perinealCondition: hasData(postpartumInfo) ? getValue([postpartumInfo.perinealCondition]) : getValue([editData.perinealCondition]),
        estimatedBloodLoss: hasData(postpartumInfo) ? getValue([postpartumInfo.estimatedBloodLoss]) : getValue([editData.estimatedBloodLoss]),
        fundus: hasData(postpartumInfo) ? getValue([postpartumInfo.fundus]) : getValue([editData.fundus]),
        lochia: hasData(postpartumInfo) ? getValue([postpartumInfo.lochia]) : getValue([editData.lochia]),
        postpartumBP: hasData(postpartumInfo) ? getValue([postpartumInfo.postpartumBP]) : getValue([editData.postpartumBP]),
        postpartumPulse: hasData(postpartumInfo) ? getValue([postpartumInfo.postpartumPulse]) : getValue([editData.postpartumPulse]),
        postpartumTemp: hasData(postpartumInfo) ? getValue([postpartumInfo.postpartumTemp]) : getValue([editData.postpartumTemp]),
        painLevel: hasData(postpartumInfo) ? getValue([postpartumInfo.painLevel]) : getValue([editData.painLevel]),
        breastfeedingInitiated: hasData(postpartumInfo) ? getValue([postpartumInfo.breastfeedingInitiated]) : getValue([editData.breastfeedingInitiated]),
        
        // Baby fields - check if babyInfo has data, fallback to direct editData
        babySex: hasData(babyInfo) ? getValue([babyInfo.babySex]) : getValue([editData.babySex]),
        birthWeight: hasData(babyInfo) ? getValue([babyInfo.birthWeight]) : getValue([editData.birthWeight]),
        apgarScores: hasData(babyInfo) ? getValue([babyInfo.apgarScores]) : getValue([editData.apgarScores]),
        initialCry: hasData(babyInfo) ? getValue([babyInfo.initialCry]) : getValue([editData.initialCry]),
        cordCare: hasData(babyInfo) ? getValue([babyInfo.cordCare]) : getValue([editData.cordCare]),
        vitaminK: hasData(babyInfo) ? getValue([babyInfo.vitaminK]) : getValue([editData.vitaminK]),
        eyeOintment: hasData(babyInfo) ? getValue([babyInfo.eyeOintment]) : getValue([editData.eyeOintment]),
        babyBreastfeeding: hasData(babyInfo) ? getValue([babyInfo.babyBreastfeeding]) : getValue([editData.babyBreastfeeding]),
        complications: hasData(babyInfo) ? getValue([babyInfo.complications]) : getValue([editData.complications]),
        
        // Discharge fields - using exact API field names from console
        finalDiagnosis: getValue([dischargeSummary.finalDiagnosis]),
        motherCondition: getValue([dischargeSummary.motherCondition]),
        babyCondition: getValue([dischargeSummary.babyCondition]),
        dischargeInstructions: getValue([dischargeSummary.dischargeInstructions]),
        dischargeMidwife: getValue([dischargeSummary.dischargeMidwife]),
        dischargeDateTime: getValue([dischargeSummary.dischargeDateTime])
      };
      
      // Debug: Log what we actually loaded
      console.log('🔧 Final loaded data:');
      Object.keys(loadedFormData).forEach(key => {
        if (loadedFormData[key]) {
          console.log(`  ✅ ${key}:`, loadedFormData[key]);
        }
      });
      
      console.log('✅ Loaded form data:', loadedFormData);
      setFormData(loadedFormData);
    } else if (isOpen && !isEditMode) {
      // Reset form for create mode
      setSearchTerm('');
      setNurseSearchTerm('');
      setMidwifeSearchTerm('');
      setFormData({
        patient_id: '', name: '', age: '', address: '', contactNumber: '', gravida: '', para: '',
        edd: '', roomNumber: '', bedNumber: '', admissionDateTime: '', attendingMidwife: '',
        allergies: '', pastIllnesses: '', previousPregnancies: '', lmp: '',
        prenatalCheckups: '', supplements: '', bloodPressure: '', heartRate: '',
        respiratoryRate: '', temperature: '', fetalHeartRate: '', cervicalDilatation: '',
        membranes: '', presentingPart: '', admissionDiagnosis: '',
        deliveryDateTime: '', deliveryType: '', perinealCondition: '', estimatedBloodLoss: '',
        fundus: '', lochia: '', postpartumBP: '', postpartumPulse: '', postpartumTemp: '',
        painLevel: '', breastfeedingInitiated: '', babySex: '', birthWeight: '',
        apgarScores: '', initialCry: '', cordCare: '', vitaminK: '', eyeOintment: '',
        babyBreastfeeding: '', complications: '',
        finalDiagnosis: '', motherCondition: '', babyCondition: '',
        dischargeInstructions: '', dischargeMidwife: '', dischargeDateTime: ''
      });
    }
  }, [isOpen, isEditMode, editData]);

  // Fetch patients
  useEffect(() => {
    if (isOpen && birthcare_Id && !isEditMode) {
      fetchPatients();
    }
  }, [isOpen, birthcare_Id, isEditMode]);

  // Fetch nurses
  useEffect(() => {
    if (isOpen && birthcare_Id) {
      fetchNurses();
      fetchMidwives();
    }
  }, [isOpen, birthcare_Id]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/patients`);
      setPatients(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchNurses = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/staff`);
      const allStaff = response.data || [];
      // Filter staff members whose role contains "nurse" (case-insensitive)
      const nurseStaff = allStaff.filter(staff => 
        staff.role_name && staff.role_name.toLowerCase().includes('nurse')
      );
      setNurses(nurseStaff);
    } catch (error) {
      console.error('Failed to fetch nurses:', error);
    }
  };

  const fetchMidwives = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/staff`);
      const allStaff = response.data || [];
      // Filter staff members whose role contains "midwife" (case-insensitive)
      const midwifeStaff = allStaff.filter(staff => 
        staff.role_name && staff.role_name.toLowerCase().includes('midwife')
      );
      setMidwives(midwifeStaff);
    } catch (error) {
      console.error('Failed to fetch midwives:', error);
    }
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setSearchTerm(`${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.trim());
    
    // Fetch admission details for this patient
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/patient-admissions`);
      const admissions = response.data.data || response.data || [];
      console.log('All admissions:', admissions);
      console.log('Selected patient ID:', patient.id);
      
      const patientAdmission = admissions.find(adm => {
        // Try both patient_id and patientId, and compare as strings
        const admPatientId = String(adm.patient_id || adm.patientId);
        const selectedPatientId = String(patient.id);
        const statusMatch = adm.status === 'delivered' || adm.status === 'in-labor';
        console.log(`Comparing: ${admPatientId} === ${selectedPatientId}, status: ${adm.status}, match: ${admPatientId === selectedPatientId && statusMatch}`);
        return admPatientId === selectedPatientId && statusMatch;
      });
      console.log('Found admission:', patientAdmission);
      
      if (patientAdmission) {
        console.log('Admission ID:', patientAdmission.id);
        console.log('Admission Date:', patientAdmission.admission_date);
        console.log('Admission Time:', patientAdmission.admission_time);
        console.log('Room data:', patientAdmission.room);
        console.log('Bed data:', patientAdmission.bed);
        console.log('Attending physician:', patientAdmission.attending_physician);
      }
      
      // Format admission date and time to datetime-local format
      let formattedAdmissionDate = '';
      if (patientAdmission?.admission_date && patientAdmission?.admission_time) {
        // Parse the UTC date and convert to local date
        const utcDate = new Date(patientAdmission.admission_date);
        // Get local date string in YYYY-MM-DD format
        const year = utcDate.getFullYear();
        const month = String(utcDate.getMonth() + 1).padStart(2, '0');
        const day = String(utcDate.getDate()).padStart(2, '0');
        const datePart = `${year}-${month}-${day}`;
        // Combine with admission_time (HH:MM)
        formattedAdmissionDate = `${datePart}T${patientAdmission.admission_time}`;
      }
      
      setFormData({
        ...formData,
        patient_id: patient.id,
        name: `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.trim(),
        age: patient.age || '',
        address: patient.address || '',
        contactNumber: patient.contact_number || '',
        roomNumber: patientAdmission?.room?.name || '',
        bedNumber: patientAdmission?.bed?.bed_no || '',
        admissionDateTime: formattedAdmissionDate,
        attendingMidwife: patientAdmission?.attending_physician || ''
      });
    } catch (error) {
      console.error('Failed to fetch admission details:', error);
      // Still fill in patient basic info even if admission fetch fails
      setFormData({
        ...formData,
        patient_id: patient.id,
        name: `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.trim(),
        age: patient.age || '',
        address: patient.address || '',
        contactNumber: patient.contact_number || ''
      });
    }
    
    setShowDropdown(false);
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const filteredNurses = nurses.filter(nurse => {
    const fullName = nurse.name.toLowerCase();
    return fullName.includes(nurseSearchTerm.toLowerCase());
  });

  const filteredMidwives = midwives.filter(midwife => {
    const fullName = midwife.name.toLowerCase();
    return fullName.includes(midwifeSearchTerm.toLowerCase());
  });

  const handleNurseSelect = (nurse) => {
    setNurseSearchTerm(nurse.name);
    setFormData({ ...formData, dischargeMidwife: nurse.name });
    setShowNurseDropdown(false);
  };

  const handleMidwifeSelect = (midwife) => {
    setMidwifeSearchTerm(midwife.name);
    setFormData({ ...formData, attendingMidwife: midwife.name });
    setShowMidwifeDropdown(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Transform form data to PDF format
  const transformFormDataForPDF = (formData, facilityInfo) => {
    return {
      patientInfo: {
        patientName: formData.name,
        age: formData.age,
        address: formData.address,
        contactNumber: formData.contactNumber,
        gravida: formData.gravida,
        para: formData.para,
        edd: formData.edd,
        roomNumber: formData.roomNumber,
        bedNumber: formData.bedNumber,
        admissionDateTime: formData.admissionDateTime,
        attendingMidwife: formData.attendingMidwife
      },
      medicalHistory: {
        allergies: formData.allergies || '',
        pastIllnesses: formData.pastIllnesses || '',
        previousPregnancies: formData.previousPregnancies || '',
        lmp: formData.lmp || '',
        prenatalCheckups: formData.prenatalCheckups || '',
        supplements: formData.supplements
      },
      admissionAssessment: {
        bloodPressure: formData.bloodPressure,
        heartRate: formData.heartRate,
        respiratoryRate: formData.respiratoryRate,
        temperature: formData.temperature,
        fetalHeartRate: formData.fetalHeartRate,
        cervicalDilatation: formData.cervicalDilatation,
        membranes: formData.membranes,
        presentingPart: formData.presentingPart,
        admissionDiagnosis: formData.admissionDiagnosis
      },
      deliveryRecord: {
        dateTimeDelivery: formData.deliveryDateTime,
        typeOfDelivery: formData.deliveryType,
        babySex: formData.babySex,
        birthWeight: formData.birthWeight,
        apgarScore1Min: formData.apgarScores ? formData.apgarScores.split('/')[0] : '',
        apgarScore5Min: formData.apgarScores ? formData.apgarScores.split('/')[1] : '',
        estimatedBloodLoss: formData.estimatedBloodLoss,
        placenta: formData.perinealCondition // Using perineal condition as placenta info
      },
      newbornCare: {
        initialCry: formData.initialCry,
        cordCare: formData.cordCare,
        vitaminKGiven: formData.vitaminK,
        eyeOintment: formData.eyeOintment,
        breastfeedingInitiated: formData.babyBreastfeeding,
        complications: formData.complications
      },
      postpartumNotes: {
        fundus: formData.fundus,
        lochia: formData.lochia,
        bloodPressure: formData.postpartumBP,
        pulse: formData.postpartumPulse,
        temperature: formData.postpartumTemp,
        pain: formData.painLevel
      },
      dischargeSummary: {
        motherCondition: formData.motherCondition,
        babyCondition: formData.babyCondition,
        followUpSchedule: formData.dischargeInstructions,
        midwifeInCharge: formData.dischargeMidwife
      }
    };
  };

  // Save current form as a Patient Document (PDF) after create/update
  const saveFormAsPatientDocument = async (patientId, isUpdate = false) => {
    if (!patientId || !formData.name) return;
    try {
      // Fetch facility info
      let facilityInfo = null;
      try {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}`);
        facilityInfo = response?.data?.data || response?.data || null;
      } catch (error) {
        console.error('Failed to fetch facility data for PDF:', error);
      }

      const chartDataForPDF = transformFormDataForPDF(formData, facilityInfo);
      const pdfData = await savePatientChartAsPDF(
        chartDataForPDF,
        birthcare_Id,
        patientId,
        facilityInfo
      );

      // Attach extra metadata (action and chart id if editing)
      const metadata = {
        ...pdfData.metadata,
        action: isUpdate ? 'update' : 'create',
        chart_id: editData?.id || null,
      };

      await axios.post(`/api/birthcare/${birthcare_Id}/patient-documents/from-data`, {
        patient_id: patientId,
        title: pdfData.title,
        document_type: pdfData.document_type,
        content: pdfData.base64PDF,
        metadata,
      });
      console.log('✅ Patient chart saved to Patient Documents');
    } catch (pdfError) {
      console.error('❌ Failed to save patient chart as PDF document:', pdfError);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // First, submit the form data
      await onSubmit(formData);

      // Determine patient id reliably for document saving
      const patientId = formData.patient_id || editData?.patient_id || selectedPatient?.id;
      await saveFormAsPatientDocument(patientId, !!isEditMode);
    } catch (error) {
      console.error('❌ Form submission failed:', error);
      throw error; // Re-throw to let parent component handle the error
    }
  };

  const handlePrint = async () => {
    try {
      // Fetch facility info if not already available
      let facilityInfo = null;
      try {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}`);
        facilityInfo = response?.data?.data || response?.data || null;
      } catch (error) {
        console.error('Failed to fetch facility data for PDF:', error);
      }
      
      // Transform form data for PDF
      const chartDataForPDF = transformFormDataForPDF(formData, facilityInfo);
      
      // Generate the same PDF that's saved to documents
      const doc = await import('@/utils/pdfGenerator').then(module => 
        module.generatePatientChartPDF(chartDataForPDF, facilityInfo)
      );
      
      // Convert PDF to blob and create URL
      const pdfBlob = doc.output('blob');
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      
      // Open PDF in new tab for printing
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        alert('Please allow popups to view and print the document');
        return;
      }
      
      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      
      console.log('Patient chart PDF opened for printing');
    } catch (error) {
      console.error('Print failed:', error);
      alert(`Failed to generate PDF for printing: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
            <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Patient Chart' : 'Create Patient Chart'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
            <form id="patient-chart-form" onSubmit={handleSubmit} className="space-y-8">
              {/* 🟢 Admission Phase */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{color: '#A41F39'}}>Admission Phase</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Patient Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setShowDropdown(true);
                            }}
                            onFocus={() => !isEditMode && setShowDropdown(true)}
                            placeholder="Search patient..."
                            className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853] ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            required
                            disabled={isEditMode}
                          />
                        </div>
                        {showDropdown && searchTerm && !isEditMode && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredPatients.length > 0 ? (
                              filteredPatients.map(patient => (
                                <div
                                  key={patient.id}
                                  onClick={() => handlePatientSelect(patient)}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">
                                    {patient.first_name} {patient.middle_name || ''} {patient.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Age: {patient.age || 'N/A'} | Contact: {patient.contact_number || 'N/A'}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500 text-sm">No patients found</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Age</label><input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label><input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Gravida/Para</label><div className="grid grid-cols-2 gap-2"><input type="text" name="gravida" value={formData.gravida} onChange={handleChange} placeholder="G" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /><input type="text" name="para" value={formData.para} onChange={handleChange} placeholder="P" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Expected Date of Delivery</label><input type="date" name="edd" value={formData.edd} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Room / Bed Number</label><div className="grid grid-cols-2 gap-2"><input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} placeholder="Room" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /><input type="text" name="bedNumber" value={formData.bedNumber} onChange={handleChange} placeholder="Bed" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Date & Time of Admission</label><input type="datetime-local" name="admissionDateTime" value={formData.admissionDateTime} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attending Midwife</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={midwifeSearchTerm}
                            onChange={(e) => {
                              setMidwifeSearchTerm(e.target.value);
                              setFormData({ ...formData, attendingMidwife: e.target.value });
                              setShowMidwifeDropdown(true);
                            }}
                            onFocus={() => setShowMidwifeDropdown(true)}
                            placeholder="Search midwife..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          />
                        </div>
                        {showMidwifeDropdown && midwifeSearchTerm && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredMidwives.length > 0 ? (
                              filteredMidwives.map(midwife => (
                                <div
                                  key={midwife.id}
                                  onClick={() => handleMidwifeSelect(midwife)}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{midwife.name}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500 text-sm">No midwives found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Medical and Obstetric History</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                        <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Past Illnesses</label>
                        <textarea name="pastIllnesses" value={formData.pastIllnesses} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Previous Pregnancies</label>
                        <textarea name="previousPregnancies" value={formData.previousPregnancies} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Menstrual Period (LMP)</label>
                        <input type="date" name="lmp" value={formData.lmp} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prenatal Check-ups</label>
                        <input type="text" name="prenatalCheckups" value={formData.prenatalCheckups} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplements Taken</label>
                        <textarea name="supplements" value={formData.supplements} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Admission Assessment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label><input type="text" name="bloodPressure" value={formData.bloodPressure} onChange={handleChange} placeholder="120/80" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate</label><input type="text" name="heartRate" value={formData.heartRate} onChange={handleChange} placeholder="bpm" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label><input type="text" name="respiratoryRate" value={formData.respiratoryRate} onChange={handleChange} placeholder="/min" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label><input type="text" name="temperature" value={formData.temperature} onChange={handleChange} placeholder="°C" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Fetal Heart Rate</label><input type="text" name="fetalHeartRate" value={formData.fetalHeartRate} onChange={handleChange} placeholder="bpm" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Cervical Dilatation</label><input type="text" name="cervicalDilatation" value={formData.cervicalDilatation} onChange={handleChange} placeholder="cm" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Membranes</label><select name="membranes" value={formData.membranes} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"><option value="">Select</option><option value="Intact">Intact</option><option value="Ruptured">Ruptured</option></select></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Presenting Part</label><input type="text" name="presentingPart" value={formData.presentingPart} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div></div> {/* Empty cell for 3-column layout */}
                      <div className="md:col-span-3"><label className="block text-sm font-medium text-gray-700 mb-1">Admission Diagnosis</label><textarea name="admissionDiagnosis" value={formData.admissionDiagnosis} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🔵 Postpartum Phase - Mother Only */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{color: '#A41F39'}}>Postpartum Phase - Mother's Condition</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Breastfeeding Initiated</label><select name="breastfeedingInitiated" value={formData.breastfeedingInitiated} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                  </div>
                </div>
              </div>

              {/* 🔵 Delivery Record Section - New Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{color: '#A41F39'}}>Delivery Record</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Date/Time of Delivery</label><input type="datetime-local" name="deliveryDateTime" value={formData.deliveryDateTime} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Type of Delivery</label><select name="deliveryType" value={formData.deliveryType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"><option value="">Select</option><option value="Normal">Normal</option><option value="Assisted">Assisted</option><option value="Cesarean">Cesarean</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Baby's Sex</label><select name="babySex" value={formData.babySex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Birth Weight</label><input type="text" name="birthWeight" value={formData.birthWeight} onChange={handleChange} placeholder="kg" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apgar Scores (1min/5min)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" min="0" max="10" placeholder="1 min" value={(formData.apgarScores || '').split('/')[0] || ''} onChange={(e) => {
                          const five = (formData.apgarScores || '').split('/')[1] || '';
                          setFormData({ ...formData, apgarScores: `${e.target.value || ''}/${five}` });
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" />
                        <input type="number" min="0" max="10" placeholder="5 min" value={(formData.apgarScores || '').split('/')[1] || ''} onChange={(e) => {
                          const one = (formData.apgarScores || '').split('/')[0] || '';
                          setFormData({ ...formData, apgarScores: `${one}/${e.target.value || ''}` });
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" />
                      </div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Estimated Blood Loss (EBL)</label><input type="text" name="estimatedBloodLoss" value={formData.estimatedBloodLoss} onChange={handleChange} placeholder="mL" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Placenta Condition</label><input type="text" name="perinealCondition" value={formData.perinealCondition} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                  </div>
                </div>
              </div>

              {/* 🟢 Newborn Care Section - New Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{color: '#A41F39'}}>Newborn Care</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Initial Cry</label><select name="initialCry" value={formData.initialCry} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"><option value="">Select</option><option value="Strong">Strong</option><option value="Weak">Weak</option><option value="Absent">Absent</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Cord Care</label><input type="text" name="cordCare" value={formData.cordCare} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Vitamin K Given</label><select name="vitaminK" value={formData.vitaminK} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"><option value="">Select</option><option value="Given">Given</option><option value="Not Given">Not Given</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Eye Ointment</label><select name="eyeOintment" value={formData.eyeOintment} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"><option value="">Select</option><option value="Given">Given</option><option value="Not Given">Not Given</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Breastfeeding Initiated</label><select name="babyBreastfeeding" value={formData.babyBreastfeeding} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                    <div></div> {/* Empty cell for layout */}
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Complications</label><textarea name="complications" value={formData.complications} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                  </div>
                </div>
              </div>

              {/* 🟡 Postpartum Notes Section - New Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{color: '#A41F39'}}>Postpartum Notes</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Fundus</label><input type="text" name="fundus" value={formData.fundus} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Lochia</label><input type="text" name="lochia" value={formData.lochia} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (Postpartum)</label><input type="text" name="postpartumBP" value={formData.postpartumBP} onChange={handleChange} placeholder="120/80 mmHg" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Pulse (Postpartum)</label><input type="text" name="postpartumPulse" value={formData.postpartumPulse} onChange={handleChange} placeholder="bpm" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Temperature (Postpartum)</label><input type="text" name="postpartumTemp" value={formData.postpartumTemp} onChange={handleChange} placeholder="°C" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Pain Level</label><input type="text" name="painLevel" value={formData.painLevel} onChange={handleChange} placeholder="0-10 scale" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                  </div>
                </div>
              </div>

              {/* 🟣 Discharge Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{color: '#A41F39'}}>Discharge Summary</h3>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Final Diagnosis</label><textarea name="finalDiagnosis" value={formData.finalDiagnosis} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Condition on Discharge</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Mother's Condition</label><input type="text" name="motherCondition" value={formData.motherCondition} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Baby's Condition</label><input type="text" name="babyCondition" value={formData.babyCondition} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Discharge Instructions and Follow-up</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Schedule / Instructions</label>
                        <textarea name="dischargeInstructions" value={formData.dischargeInstructions} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Attending Nurse</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              value={nurseSearchTerm}
                              onChange={(e) => {
                                setNurseSearchTerm(e.target.value);
                                setFormData({ ...formData, dischargeMidwife: e.target.value });
                                setShowNurseDropdown(true);
                              }}
                              onFocus={() => setShowNurseDropdown(true)}
                              placeholder="Search nurse..."
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                            />
                          </div>
                          {showNurseDropdown && nurseSearchTerm && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredNurses.length > 0 ? (
                                filteredNurses.map(nurse => (
                                  <div
                                    key={nurse.id}
                                    onClick={() => handleNurseSelect(nurse)}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900">{nurse.name}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-gray-500 text-sm">No nurses found</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Date & Time of Discharge</label><input type="datetime-local" name="dischargeDateTime" value={formData.dischargeDateTime} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]" /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button type="button" onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button type="submit" form="patient-chart-form" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-md hover:opacity-90">{isEditMode ? 'Update Patient Chart' : 'Save Patient Chart'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientChartModal;
