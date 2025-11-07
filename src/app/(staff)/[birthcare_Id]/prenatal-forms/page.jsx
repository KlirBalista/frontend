"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";
import { savePrenatalFormAsPDF, downloadPrenatalFormPDF } from "@/utils/pdfGenerator";
import SearchablePatientSelect from "@/components/SearchablePatientSelect";
import { 
  Search,
  Plus,
  FileText,
  Download
} from "lucide-react";
import CustomDialog from '@/components/CustomDialog';
// Removed unused useReactToPrint import

const PrenatalFormsPage = () => {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: "",
    form_date: new Date().toISOString().split('T')[0],
    gestational_age: "",
    weight: "",
    blood_pressure: "",
    notes: "",
    examined_by: user ? `${user.firstname} ${user.lastname}` : "",
    fetal_heart_rate: "",
    fundal_height: "",
    urine_test: "",
    fetal_position: "",
    edema: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const printRef = useRef();
  const [birthCareInfo, setBirthCareInfo] = useState(null);
  const [scheduledVisits, setScheduledVisits] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [prenatalForms, setPrenatalForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingForms, setLoadingForms] = useState(true);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
  
  // WHO 8 Visit Schedule Reference
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

  // Fetch patients for dropdown
  const fetchPatients = async () => {
    try {
      let allPatients = [];
      let currentPage = 1;
      let hasMorePages = true;
      
      // Keep fetching pages until we have all patients
      while (hasMorePages) {
        const response = await axios.get(
          `/api/birthcare/${birthcare_Id}/patients`,
          {
            params: {
              page: currentPage,
              per_page: 50 // Reasonable page size
            },
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            }
          }
        );
        
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
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing prenatal forms
  const fetchPrenatalForms = async () => {
    try {
      setLoadingForms(true);
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/prenatal-forms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        }
      });
      const forms = response.data.data || response.data || [];
      setPrenatalForms(forms);
    } catch (error) {
      console.error('Error fetching prenatal forms:', error);
    } finally {
      setLoadingForms(false);
    }
  };

  // Fetch staff members
  const fetchStaff = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/staff`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        }
      });
      const staffData = response.data.data || response.data || [];
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  useEffect(() => {
    if (user && birthcare_Id) {
      fetchBirthCareInfo();
      fetchPatients();
      fetchPrenatalForms();
      fetchStaff();
    }
  }, [user, birthcare_Id]);

  // Close staff dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStaffDropdown && !event.target.closest('.staff-dropdown-container')) {
        setShowStaffDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStaffDropdown]);

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
      !user.permissions?.includes("manage_prenatal_forms"))
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

  // Auto-generate future visits based on Visit 1 selection
  const autoScheduleFutureVisits = async (patientId, visit1Date) => {
    if (!patientId || !visit1Date) return;
    
    try {
      const baseDate = new Date(visit1Date);
      const visits = [];
      
      // Calculate dates for visits 2-8 based on WHO schedule
      const visitSchedule = {
        2: 20 * 7, // 20 weeks from conception (140 days)
        3: 26 * 7, // 26 weeks (182 days)
        4: 30 * 7, // 30 weeks (210 days)
        5: 34 * 7, // 34 weeks (238 days)
        6: 36 * 7, // 36 weeks (252 days)
        7: 38 * 7, // 38 weeks (266 days)
        8: 40 * 7, // 40 weeks (280 days)
      };
      
      // Assuming Visit 1 is at around 8-12 weeks (use 10 weeks as baseline)
      const conceptionDate = new Date(baseDate.getTime() - (10 * 7 * 24 * 60 * 60 * 1000));
      
      for (let visitNum = 2; visitNum <= 8; visitNum++) {
        const daysFromConception = visitSchedule[visitNum];
        const scheduledDate = new Date(conceptionDate.getTime() + (daysFromConception * 24 * 60 * 60 * 1000));
        
        visits.push({
          patient_id: patientId,
          visit_number: visitNum,
          visit_name: whoSchedule[visitNum - 1].name,
          recommended_week: whoSchedule[visitNum - 1].week,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          status: 'Scheduled',
          notes: `Auto-scheduled based on Visit 1. ${whoSchedule[visitNum - 1].description}`
        });
      }
      
      // Save all future visits to database
      await axios.post(`/api/birthcare/${birthcare_Id}/prenatal-visits/batch`, {
        visits: visits
      });
      
      setScheduledVisits(visits);
      console.log('Auto-scheduled visits 2-8:', visits);
      
    } catch (error) {
      console.error('Error auto-scheduling future visits:', error);
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-schedule future visits when Visit 1 is selected
    if (name === 'visit_number' && value === '1' && formData.patient_id && formData.form_date) {
      autoScheduleFutureVisits(formData.patient_id, formData.form_date);
    }
    
    // Also trigger when date changes and visit is 1
    if (name === 'form_date' && formData.visit_number === '1' && formData.patient_id) {
      autoScheduleFutureVisits(formData.patient_id, value);
    }
    
    // Also trigger when patient changes and visit is 1
    if (name === 'patient_id' && formData.visit_number === '1' && formData.form_date) {
      autoScheduleFutureVisits(value, formData.form_date);
    }
  };

  // Handle patient selection from searchable dropdown
  const handlePatientSelect = (patientId) => {
    setFormData(prev => ({
      ...prev,
      patient_id: patientId
    }));
    
    // If visit 1 already selected and date present, trigger auto-schedule
    if (patientId && formData.visit_number === '1' && formData.form_date) {
      autoScheduleFutureVisits(patientId, formData.form_date);
    }
  };

  // Handle form submission with PDF generation
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.patient_id) {
        setDialog({
          isOpen: true,
          type: 'warning',
          title: 'Required Field Missing',
          message: 'Please select a patient before submitting the form.',
          onConfirm: () => setDialog({ ...dialog, isOpen: false })
        });
        return;
      }
      if (!formData.form_date) {
        setDialog({
          isOpen: true,
          type: 'warning',
          title: 'Required Field Missing',
          message: 'Please enter an examination date before submitting the form.',
          onConfirm: () => setDialog({ ...dialog, isOpen: false })
        });
        return;
      }
      
      // Prepare form data for submission
      const formDataForSubmission = { ...formData };
      
      // Ensure form_date is in correct format
      if (formDataForSubmission.form_date) {
        formDataForSubmission.form_date = new Date(formDataForSubmission.form_date).toISOString().split('T')[0];
      }
      
      console.log('Form data being submitted:', formDataForSubmission);
      console.log('Birth care ID:', birthcare_Id);
      
      // First save the prenatal form
      const response = await axios.post(`/api/birthcare/${birthcare_Id}/prenatal-forms`, formDataForSubmission, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      console.log('Form submitted successfully:', response.data);
      
      // Get patient data for PDF generation
      const selectedPatient = patients.find(p => p.id == formData.patient_id);
      
      if (selectedPatient) {
        // Generate PDF and save to patient documents
        const pdfData = await savePrenatalFormAsPDF(formData, selectedPatient, birthcare_Id, birthCareInfo);
        
        await axios.post(`/api/birthcare/${birthcare_Id}/patient-documents/from-data`, {
          patient_id: formData.patient_id,
          title: pdfData.title,
          document_type: pdfData.document_type,
          content: pdfData.base64PDF,
          metadata: pdfData.metadata,
        });
      }
      
      // Show success dialog
      setDialog({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Prenatal form created and saved to patient documents successfully!',
        onConfirm: () => {
          setDialog({ ...dialog, isOpen: false });
        }
      });
      
      // Reset form and close modal
      setFormData({
        patient_id: "",
        form_date: new Date().toISOString().split('T')[0],
        gestational_age: "",
        weight: "",
        blood_pressure: "",
        notes: "",
        examined_by: user ? `${user.firstname} ${user.lastname}` : "",
        fetal_heart_rate: "",
        fundal_height: "",
        urine_test: "",
        fetal_position: "",
        edema: "",
      });
      setScheduledVisits([]);
      setShowFormModal(false);
      fetchPrenatalForms(); // Refresh the forms list
      
    } catch (error) {
      console.error('Error creating form:', error);
      console.error('Error response:', error.response);
      console.error('Form data being sent:', formDataForSubmission);
      
      let errorMessage = 'Error creating form. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: errorMessage,
        onConfirm: () => setDialog({ ...dialog, isOpen: false })
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle preview PDF
  const handlePreviewPDF = () => {
    if (!formData.patient_id) {
      setDialog({
        isOpen: true,
        type: 'warning',
        title: 'Patient Required',
        message: 'Please select a patient first before generating PDF preview.',
        onConfirm: () => setDialog({ ...dialog, isOpen: false })
      });
      return;
    }
    
    const selectedPatient = patients.find(p => p.id == formData.patient_id);
    if (selectedPatient) {
      try {
        downloadPrenatalFormPDF(formData, selectedPatient, birthCareInfo);
      } catch (error) {
        setDialog({
          isOpen: true,
          type: 'error',
          title: 'PDF Generation Failed',
          message: 'Failed to generate PDF preview. Please try again.',
          onConfirm: () => setDialog({ ...dialog, isOpen: false })
        });
      }
    }
  };

  // Filter forms based on search
  const filteredForms = prenatalForms.filter(form => {
    const patientName = form.patient_name || `${form.patient?.first_name || ''} ${form.patient?.last_name || ''}`.trim();
    return patientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && patients.length === 0) {
    return (
      <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#FDB3C2]/30 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E56D85]"></div>
              <span className="ml-3 text-[#A41F39] font-medium">Loading patients...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PRENATAL FORMS</h1>
            <p className="text-sm text-gray-900 mt-1 font-medium">Manage and create prenatal examination forms</p>
          </div>
          <button
            onClick={() => setShowFormModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Plus size={20} />
            <span>Create Form</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#FDB3C2]/30 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#F891A5]" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#FDB3C2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent bg-white/50 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[#BF3853] font-medium">
            {filteredForms.length} {filteredForms.length === 1 ? 'form' : 'forms'}
          </p>
          <p className="text-sm text-[#E56D85]">
            Page 1 of 1
          </p>
        </div>

        {/* Loading State */}
        {loadingForms && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#FDB3C2]/30 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E56D85] mx-auto"></div>
            <p className="mt-4 text-[#A41F39] font-medium">Loading prenatal forms...</p>
          </div>
        )}

        {/* Table */}
        {!loadingForms && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#FDB3C2]/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">NO.</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">PATIENT NAME</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">FORM DATE</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">EXAMINED BY</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-[#FDB3C2]/30">
                  {filteredForms.length > 0 ? (
                    filteredForms.map((form, index) => {
                      const patientName = form.patient_name || `${form.patient?.first_name || ''} ${form.patient?.last_name || ''}`.trim() || 'Unknown Patient';
                      return (
                        <tr key={form.id} className="hover:bg-gradient-to-r hover:from-[#FDB3C2]/10 hover:to-[#F891A5]/5 transition-all duration-200">
                          <td className="px-6 py-4 text-center text-sm text-gray-900 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                            {patientName}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">
                            {form.form_date ? new Date(form.form_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">
                            {form.examined_by || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <button
                                onClick={() => {
                                  const selectedPatient = patients.find(p => p.id == form.patient_id);
                                  if (selectedPatient) {
                                    downloadPrenatalFormPDF(form, selectedPatient, birthCareInfo);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-lg hover:shadow-lg hover:shadow-[#BF3853]/25 transition-all duration-200"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#FDB3C2]/20 to-[#F891A5]/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-[#E56D85]" />
                          </div>
                          <p className="text-lg font-semibold text-[#A41F39]">No Prenatal Forms</p>
                          <p className="text-sm text-[#BF3853] mt-1">
                            {searchTerm ? 'No forms match your search.' : 'No prenatal forms have been created yet.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Form Creation Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#FDB3C2]/30 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Create Prenatal Examination Form</h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Select Patient *
                    </label>
                    <SearchablePatientSelect
                      patients={patients}
                      value={formData.patient_id}
                      onChange={handlePatientSelect}
                      placeholder="Search and select a patient..."
                      required={true}
                      onOpen={fetchPatients}
                      className="focus:ring-gray-300 focus:border-gray-300"
                    />
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Examination Date *
                    </label>
                    <input
                      type="date"
                      name="form_date"
                      value={formData.form_date}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Gestational Age
                    </label>
                    <input
                      type="text"
                      name="gestational_age"
                      value={formData.gestational_age}
                      onChange={handleFormChange}
                      placeholder="e.g., 20 weeks, 3 days"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Vital Signs */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Vital Signs & Measurements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Weight
                      </label>
                      <input
                        type="text"
                        name="weight"
                        value={formData.weight}
                        onChange={handleFormChange}
                        placeholder="e.g., 65.5 kg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Blood Pressure
                      </label>
                      <input
                        type="text"
                        name="blood_pressure"
                        value={formData.blood_pressure}
                        onChange={handleFormChange}
                        placeholder="e.g., 120/80 mmHg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Clinical Notes & Observations
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={4}
                    placeholder="Enter detailed clinical observations, findings, and notes..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                  ></textarea>
                </div>


                {/* Additional Important Fields */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Medical Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Fetal Heart Rate (bpm)
                      </label>
                      <input
                        type="text"
                        name="fetal_heart_rate"
                        value={formData.fetal_heart_rate || ''}
                        onChange={handleFormChange}
                        placeholder="e.g., 140 bpm"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Fundal Height (cm)
                      </label>
                      <input
                        type="text"
                        name="fundal_height"
                        value={formData.fundal_height || ''}
                        onChange={handleFormChange}
                        placeholder="e.g., 24 cm"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Urine Test Results
                      </label>
                      <select
                        name="urine_test"
                        value={formData.urine_test || ''}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      >
                        <option value="">-- Select result --</option>
                        <option value="normal">Normal</option>
                        <option value="protein_present">Protein Present</option>
                        <option value="glucose_present">Glucose Present</option>
                        <option value="bacteria_present">Bacteria Present</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Fetal Position
                      </label>
                      <select
                        name="fetal_position"
                        value={formData.fetal_position || ''}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      >
                        <option value="">-- Select position --</option>
                        <option value="vertex">Vertex (Head Down)</option>
                        <option value="breech">Breech (Bottom Down)</option>
                        <option value="transverse">Transverse (Side)</option>
                        <option value="oblique">Oblique</option>
                        <option value="not_determined">Not Determined</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Edema Assessment
                      </label>
                      <select
                        name="edema"
                        value={formData.edema || ''}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                      >
                        <option value="">-- Select assessment --</option>
                        <option value="none">None</option>
                        <option value="mild">Mild (feet/ankles)</option>
                        <option value="moderate">Moderate (legs/hands)</option>
                        <option value="severe">Severe (generalized)</option>
                      </select>
                    </div>

                    <div className="relative staff-dropdown-container">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Examined By
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={staffSearchTerm || formData.examined_by}
                          onChange={(e) => {
                            setStaffSearchTerm(e.target.value);
                            setShowStaffDropdown(true);
                          }}
                          onFocus={() => setShowStaffDropdown(true)}
                          placeholder="Search midwife/staff..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                        />
                        {showStaffDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {staff
                              .filter(s => {
                                const fullName = `${s.user?.firstname || ''} ${s.user?.middlename || ''} ${s.user?.lastname || ''}`.toLowerCase();
                                const roleName = s.role?.name?.toLowerCase() || '';
                                const search = staffSearchTerm.toLowerCase();
                                return fullName.includes(search) || roleName.includes(search);
                              })
                              .map((staffMember) => (
                                <div
                                  key={staffMember.id}
                                  onClick={() => {
                                    const fullName = `${staffMember.user?.firstname || ''} ${staffMember.user?.middlename || ''} ${staffMember.user?.lastname || ''}`.trim();
                                    setFormData({ ...formData, examined_by: fullName });
                                    setStaffSearchTerm('');
                                    setShowStaffDropdown(false);
                                  }}
                                  className="px-4 py-3 hover:bg-[#FDB3C2]/10 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">
                                    {staffMember.user?.firstname} {staffMember.user?.middlename} {staffMember.user?.lastname}
                                  </div>
                                  <div className="text-sm text-gray-500">{staffMember.role?.name}</div>
                                </div>
                              ))}
                            {staff.filter(s => {
                              const fullName = `${s.user?.firstname || ''} ${s.user?.middlename || ''} ${s.user?.lastname || ''}`.toLowerCase();
                              return fullName.includes(staffSearchTerm.toLowerCase());
                            }).length === 0 && (
                              <div className="px-4 py-3 text-gray-500 text-center">
                                No staff members found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-6 border-t border-[#FDB3C2]/30">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-6 py-3 border border-[#FDB3C2] text-[#BF3853] rounded-xl font-medium hover:bg-[#FDB3C2]/10 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#BF3853]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Form...
                      </>
                    ) : (
                      'Create Form'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Dialog */}
      <CustomDialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText || 'OK'}
        cancelText={dialog.cancelText}
        showCancel={dialog.showCancel || false}
      />
    </div>
  );
};

export default PrenatalFormsPage;
