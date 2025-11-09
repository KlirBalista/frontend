"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth";
import { useReactToPrint } from 'react-to-print';
import { saveLaborMonitoringAsPDF, downloadLaborMonitoringPDF } from '@/utils/pdfGenerator';
import SearchablePatientSelect from "@/components/SearchablePatientSelect";
import CustomDialog from "@/components/CustomDialog";

export default function LaborMonitoring() {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [monitoringEntries, setMonitoringEntries] = useState([]);
  const [birthCareInfo, setBirthCareInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle different date formats
      let date;
      if (dateString.includes('T')) {
        // ISO datetime string
        date = new Date(dateString);
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        date = new Date(dateString + 'T00:00:00');
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Date formatting error:', error, dateString);
      return dateString; // Return original string if error
    }
  };

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      // Handle both full datetime strings and time-only strings
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      // If it's just a time string (HH:MM or HH:MM:SS), extract HH:MM
      const timeParts = timeString.split(':');
      return timeParts.slice(0, 2).join(':');
    } catch (error) {
      console.warn('Time formatting error:', error, timeString);
      return timeString; // Return original string if error
    }
  };

  // Normalize various date formats to YYYY-MM-DD for <input type="date">
  const normalizeDateForInput = (dateString) => {
    if (!dateString) return '';
    const s = String(dateString);
    // Already in YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // Handle "YYYY-MM-DD HH:MM:SS"
    if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) return s.slice(0, 10);
    try {
      const d = new Date(s.includes(' ') ? s.replace(' ', 'T') : s);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (_) {}
    return '';
  };

  const [showPatientModal, setShowPatientModal] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    case_no: '',
    bed_no: '',
    admission_date: new Date().toISOString().split('T')[0],
    attending_physician: ''
  });
  const printRef = useRef();
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    temperature: '',
    pulse: '',
    respiration: '',
    blood_pressure: '',
    fht_location: ''
  });

  // Dialog state using CustomDialog component
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null,
  });

  const openDialog = (opts = {}) => setDialog(prev => ({
    ...prev,
    isOpen: true,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null,
    ...opts,
  }));

  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchBirthCareInfo();
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchMonitoringEntries();
    }
  }, [selectedPatient]);

  if (!user) {
    return null;
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_labor_monitoring"))
  ) {
    return <div>Unauthorized</div>;
  }

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

  const fetchMonitoringEntries = async () => {
    if (!selectedPatient) return;
    
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/labor-monitoring`, {
        params: { patient_id: selectedPatient.id }
      });
      setMonitoringEntries(response.data.data || []);
    } catch (error) {
      console.error('Error fetching monitoring entries:', error);
    }
  };

  // Fill sample data for testing
  const fillSampleData = () => {
    const currentTime = new Date();
    const timeString = currentTime.toTimeString().slice(0, 5);
    
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      time: timeString,
      temperature: '36.7',
      pulse: '82',
      respiration: '18',
      blood_pressure: '120/80',
      fht_location: 'Left lower quadrant'
    });
    
    // Also fill additional info if empty
    if (!additionalInfo.case_no) {
      setAdditionalInfo({
        ...additionalInfo,
        case_no: 'LC-2025-001',
        room_no: 'R-05',
        bed_no: 'B-12',
        attending_physician: 'Dr. Sarah Johnson, MD'
      });
    }
  };

  const addMonitoringEntry = async () => {
    if (!newEntry.date || !newEntry.time || !selectedPatient) {
      openDialog({
        type: 'warning',
        title: 'Incomplete Fields',
        message: 'Please fill in date, time, and ensure a patient is selected.'
      });
      return;
    }

    try {
      const entryData = {
        patient_id: selectedPatient.id,
        monitoring_date: newEntry.date,
        monitoring_time: newEntry.time,
        temperature: newEntry.temperature,
        pulse: newEntry.pulse,
        respiration: newEntry.respiration,
        blood_pressure: newEntry.blood_pressure,
        fht_location: newEntry.fht_location
      };

      const response = await axios.post(`/api/birthcare/${birthcare_Id}/labor-monitoring`, entryData);
      
      // Add to local state
      setMonitoringEntries([...monitoringEntries, response.data.data]);
      
      // Reset form
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        temperature: '',
        pulse: '',
        respiration: '',
        blood_pressure: '',
        fht_location: ''
      });

      // Entry saved successfully - no alert needed as the table will update
    } catch (error) {
      console.error('Error saving monitoring entry:', error);
      openDialog({ type: 'error', title: 'Error', message: 'Error saving monitoring entry. Please try again.' });
    }
  };

  const deleteMonitoringEntry = async (entryId) => {
    try {
      await axios.delete(`/api/birthcare/${birthcare_Id}/labor-monitoring/${entryId}`);
      setMonitoringEntries(monitoringEntries.filter(e => e.id !== entryId));
      // Entry deleted successfully - table will update automatically
    } catch (error) {
      console.error('Error deleting monitoring entry:', error);
      openDialog({ type: 'error', title: 'Error', message: 'Error deleting monitoring entry. Please try again.' });
    }
  };

  const confirmDeleteEntry = (entryId) => {
    openDialog({
      type: 'confirm',
      title: 'Delete Entry',
      message: 'Are you sure you want to delete this monitoring entry? This action cannot be undone.',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => deleteMonitoringEntry(entryId),
    });
  };

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Labor_Monitoring_${selectedPatient?.first_name}_${selectedPatient?.last_name}_${new Date().toISOString().split('T')[0]}`,
  });

  // PDF generation and save functionality
  const generatePDF = async () => {
    if (!selectedPatient) {
      openDialog({ type: 'info', title: 'Select Patient', message: 'Please select a patient first.' });
      return;
    }

    try {
      // Generate PDF and save to patient documents
      const pdfData = await saveLaborMonitoringAsPDF(
        selectedPatient,
        monitoringEntries,
        additionalInfo,
        birthcare_Id,
        birthCareInfo
      );
      
      await axios.post(`/api/birthcare/${birthcare_Id}/patient-documents/from-data`, {
        patient_id: selectedPatient.id,
        title: pdfData.title,
        document_type: pdfData.document_type,
        content: pdfData.base64PDF,
        metadata: pdfData.metadata,
      });
      
      openDialog({
        type: 'success',
        title: 'PDF Saved',
        message: 'Labor monitoring PDF generated and saved to patient documents successfully!',
        confirmText: 'OK'
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      openDialog({ type: 'error', title: 'Error', message: 'Error generating PDF. Please try again.' });
    }
  };
  
  // Preview PDF function
  const handlePreviewPDF = () => {
    if (!selectedPatient) {
      openDialog({ type: 'info', title: 'Select Patient', message: 'Please select a patient first.' });
      return;
    }
    
    try {
      downloadLaborMonitoringPDF(selectedPatient, monitoringEntries, additionalInfo, birthCareInfo);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      openDialog({ type: 'error', title: 'Error', message: 'Failed to generate PDF preview.' });
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
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8 text-gray-900 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">
        {/* Removed print/PDF buttons to follow prenatal forms format */}
        
        {/* Printable Content */}
        <div ref={printRef}>
        {/* Official Header */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 mb-6 print:shadow-none print:border-black print:rounded-none overflow-hidden">
          <div className="px-6 py-5 border-b border-white/20 bg-white print:bg-white print:border-b print:border-black text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">LABOR MONITORING</h1>
                <p className="text-sm text-gray-900 mt-1">Manage and view Patien Labor Monitoring Data</p>
              </div>
            </div>
          </div>

          {/* Patient Information Section */}
          <div className="p-6 print:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-32 text-sm font-semibold text-gray-900 print:text-black">Name:</label>
                  <div className="flex-1">
                    {selectedPatient ? (
                      <div className="p-2 bg-white border-2 border-gray-500 rounded-lg print:bg-white print:border-black font-medium text-gray-900">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </div>
                    ) : (
                      <SearchablePatientSelect
                        patients={patients}
                        value={selectedPatient?.id || ''}
                        onChange={async (patientId) => {
                          if (!patientId) {
                            setSelectedPatient(null);
                            setAdditionalInfo({
                              case_no: '',
                              room_no: '',
                              bed_no: '',
                              admission_date: new Date().toISOString().split('T')[0],
                              attending_physician: ''
                            });
                            return;
                          }
                          
                          const patient = patients.find(p => p.id === parseInt(patientId));
                          setSelectedPatient(patient);
                          
                          // Fetch and populate admission data
                          try {
                            const response = await axios.get(`/api/birthcare/${birthcare_Id}/patient-admissions`, {
                              params: { 
                                patient_id: patientId
                                // Remove status filter to get all admissions for this patient
                              }
                            });
                            
                            const admissions = response.data.data || [];
                            if (admissions.length > 0) {
                              // Get the most recent active admission (in-labor or delivered status)
                              const activeAdmission = admissions.find(admission => 
                                admission.status === 'in-labor' || admission.status === 'delivered'
                              ) || admissions[0]; // Fallback to first admission if no active one found
                              
                              // Use the actual admission ID as case number
                              const caseNumber = activeAdmission.id.toString();
                              
                              setAdditionalInfo({
                                case_no: caseNumber,
                                room_no: activeAdmission.room?.name || activeAdmission.room_number || '',
                                bed_no: activeAdmission.bed?.bed_no || activeAdmission.bed_number || '',
                                admission_date: normalizeDateForInput(activeAdmission.admission_date) || new Date().toISOString().split('T')[0],
                                attending_physician: activeAdmission.attending_physician || activeAdmission.primary_nurse || ''
                              });
                            } else {
                              // No admissions found - clear the fields
                              setAdditionalInfo({
                                case_no: '',
                                room_no: '',
                                bed_no: '',
                                admission_date: new Date().toISOString().split('T')[0],
                                attending_physician: ''
                              });
                            }
                          } catch (error) {
                            console.error('Error fetching patient admission:', error);
                            // Keep default values if API call fails
                            setAdditionalInfo({
                              case_no: '',
                              room_no: '',
                              bed_no: '',
                              admission_date: new Date().toISOString().split('T')[0],
                              attending_physician: ''
                            });
                          }
                        }}
                        placeholder="Search and select a patient..."
                        onOpen={fetchPatients}
                        className="focus:ring-gray-500 focus:border-gray-500 print:border-black print:rounded-none"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="w-32 text-sm font-semibold text-gray-900 print:text-black">Date of Admission:</label>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={additionalInfo.admission_date}
                      onChange={(e) => setAdditionalInfo({...additionalInfo, admission_date: e.target.value})}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                    />
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="w-20 text-sm font-semibold text-gray-900 print:text-black">Case No.:</label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={additionalInfo.case_no}
                      onChange={(e) => setAdditionalInfo({...additionalInfo, case_no: e.target.value})}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                      placeholder="Enter case number"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="w-20 text-sm font-semibold text-gray-900 print:text-black">Room No.:</label>
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={additionalInfo.room_no || ''}
                        onChange={(e) => setAdditionalInfo({...additionalInfo, room_no: e.target.value})}
                        className="w-full p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                        placeholder="Enter room number"
                      />
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-semibold text-gray-900 print:text-black whitespace-nowrap">Bed No.:</label>
                        <input
                          type="text"
                          value={additionalInfo.bed_no}
                          onChange={(e) => setAdditionalInfo({...additionalInfo, bed_no: e.target.value})}
                          className="w-full p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                          placeholder="Enter bed number"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Attending Physician Field - Full width below the grid */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <label className="w-32 text-sm font-semibold text-gray-900 print:text-black">Attending Physician:</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={additionalInfo.attending_physician}
                    onChange={(e) => setAdditionalInfo({...additionalInfo, attending_physician: e.target.value})}
                    className="w-full p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black print:rounded-none"
                    placeholder="Enter attending physician name"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring Data Entry */}
        {selectedPatient && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 mb-6 print:hidden overflow-hidden">
            <div className="bg-white px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 drop-shadow">Add New Monitoring Entry</h3>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={fillSampleData}
                    className="px-4 py-2 bg-white border-2 border-gray-500 rounded-xl text-sm font-semibold text-gray-900 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
                  >
                    Fill Sample Data
                  </button>
                  <button
                    onClick={addMonitoringEntry}
                    className="px-4 py-2 bg-white border-2 border-gray-500 rounded-xl text-sm font-semibold text-gray-900 hover:bg-gray-600 hover:shadow-lg hover:shadow-gray-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 hover:scale-105"
                  >
                    Add Entry
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">DATE</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">TIME</label>
                  <input
                    type="time"
                    value={newEntry.time}
                    onChange={(e) => setNewEntry({...newEntry, time: e.target.value})}
className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">TEMP</label>
                  <input
                    type="text"
                    placeholder="°C"
                    value={newEntry.temperature}
                    onChange={(e) => setNewEntry({...newEntry, temperature: e.target.value})}
className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">PULSE</label>
                  <input
                    type="text"
                    placeholder="bpm"
                    value={newEntry.pulse}
                    onChange={(e) => setNewEntry({...newEntry, pulse: e.target.value})}
className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">RESP</label>
                  <input
                    type="text"
                    placeholder="/min"
                    value={newEntry.respiration}
                    onChange={(e) => setNewEntry({...newEntry, respiration: e.target.value})}
className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">BP</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={newEntry.blood_pressure}
                    onChange={(e) => setNewEntry({...newEntry, blood_pressure: e.target.value})}
className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">FHT/LOCATION</label>
                  <input
                    type="text"
                    placeholder="Location"
                    value={newEntry.fht_location}
                    onChange={(e) => setNewEntry({...newEntry, fht_location: e.target.value})}
className="w-full p-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all print:border-black"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Table */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 print:shadow-none print:border-black print:rounded-none overflow-hidden">
          <div className="p-6 print:p-4">
            <div className="flex justify-between items-center mb-4 print:mb-2">
              <h3 className="text-lg font-bold text-gray-900 print:text-black">Labor Monitoring Records</h3>
              {!selectedPatient && (
                <p className="text-sm text-gray-900 print:hidden">Please select a patient to start monitoring</p>
              )}
            </div>
            
            {selectedPatient ? (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-500 print:bg-white border-b border-black">
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider print:text-black">
                        DATE
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider print:text-black">
                        TIME
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider print:text-black">
                        TEMP
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider print:text-black">
                        PULSE
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider print:text-black">
                        RESP
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider print:text-black">
                        BP
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider print:text-black">
                        FHT/LOCATION
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider print:hidden">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {monitoringEntries.length === 0 ? (
                      Array.from({ length: 15 }, (_, index) => (
                        <tr key={index} className="hover:bg-gray-100 transition-colors print:hover:bg-white border-b border-black">
                          <td className="px-4 py-4 text-sm text-center text-gray-900 print:text-black">&nbsp;</td>
                          <td className="px-4 py-4 text-sm text-center text-gray-900 print:text-black">&nbsp;</td>
                          <td className="px-4 py-4 text-sm text-center text-gray-900 print:text-black">&nbsp;</td>
                          <td className="px-4 py-4 text-sm text-center text-gray-900 print:text-black">&nbsp;</td>
                          <td className="px-4 py-4 text-sm text-center text-gray-900 print:text-black">&nbsp;</td>
                          <td className="px-4 py-4 text-sm text-center text-gray-900 print:text-black">&nbsp;</td>
                          <td className="px-4 py-4 text-sm text-center text-gray-900 print:text-black">&nbsp;</td>
                          <td className="px-4 py-4 text-sm text-center print:hidden">&nbsp;</td>
                        </tr>
                      ))
                    ) : (
                      <>
                        {monitoringEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-100 transition-colors print:hover:bg-white border-b border-black">
                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium print:text-black">
                              {formatDate(entry.monitoring_date || entry.date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium print:text-black">
                              {formatTime(entry.monitoring_time || entry.time)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium print:text-black">
                              {entry.temperature}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium print:text-black">
                              {entry.pulse}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium print:text-black">
                              {entry.respiration}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium print:text-black">
                              {entry.blood_pressure}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium print:text-black">
                              {entry.fht_location}
                            </td>
                            <td className="px-4 py-3 text-sm text-center print:hidden">
                              <button
                                onClick={() => confirmDeleteEntry(entry.id)}
                                className="px-3 py-1.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#BF3853] border border-transparent rounded-xl text-xs font-semibold text-white hover:shadow-lg hover:shadow-[#A41F39]/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853] transition-all duration-300 hover:scale-105"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 15 - monitoringEntries.length) }, (_, index) => (
                          <tr key={`empty-${index}`} className="hover:bg-gray-100 transition-colors print:hover:bg-white border-b border-black">
                            <td className="px-4 py-4 text-sm text-center text-gray-500 print:text-black">&nbsp;</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500 print:text-black">&nbsp;</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500 print:text-black">&nbsp;</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500 print:text-black">&nbsp;</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500 print:text-black">&nbsp;</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500 print:text-black">&nbsp;</td>
                            <td className="px-4 py-4 text-sm text-center text-gray-500 print:text-black">&nbsp;</td>
                          <td className="px-4 py-4 text-sm text-center print:hidden">&nbsp;</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="mt-4 text-sm font-bold text-gray-900">No patient selected</h3>
                <p className="mt-1 text-sm text-gray-900">Select a patient from the dropdown above to start labor monitoring.</p>
              </div>
            )}
            
            {/* Signature Section */}
            {selectedPatient && (
              <div className="mt-8 pt-6 border-t-2 border-gray-500 print:border-black">
                <div className="text-right">
                  <div className="inline-block">
                    <p className="text-xs font-bold text-gray-900 text-center print:text-black mb-1">
                      {additionalInfo.attending_physician ? additionalInfo.attending_physician.toUpperCase() : '_____________________________'}
                    </p>
                    <div className="border-b-2 border-gray-500 w-64 mb-2 print:border-black"></div>
                    <p className="text-xs text-gray-900 text-center print:text-black font-medium">Attending Physician</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Following prenatal forms format */}
            {selectedPatient && (
              <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-500 print:hidden">
                <button
                  type="button"
                  onClick={handlePreviewPDF}
                  disabled={!selectedPatient}
                  className="px-6 py-3 border-2 border-gray-500 rounded-xl text-sm font-semibold text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                >
                  Preview PDF
                </button>
                <button
                  type="button"
                  onClick={generatePDF}
                  disabled={!selectedPatient}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save to Patient Documents
                </button>
              </div>
            )}
          </div>
        </div>
        </div> {/* Close printable content div */}
      </div>
      {/* Global Dialog */}
      <CustomDialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        onConfirm={() => {
          const cb = dialog.onConfirm;
          closeDialog();
          if (cb) cb();
        }}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        showCancel={dialog.showCancel}
      />
    </div>
  );
}
