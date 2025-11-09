"use client";
import { useAuth } from "@/hooks/auth";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  Calendar,
  User,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
  Bed,
  UserCheck
} from "lucide-react";
import axios from '@/lib/axios';
import PatientAdmissionModal from './PatientAdmissionModal';

const AdmissionListPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedAdmissionForDischarge, setSelectedAdmissionForDischarge] = useState(null);
  const [dischargeClickCount, setDischargeClickCount] = useState({});
  const [dischargeProgress, setDischargeProgress] = useState({}); // Track which discharge slips have been created
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);

  // Fetch admissions from backend
  const fetchAdmissions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/patient-admissions`, {
        params: {
          search: searchTerm,
          status: statusFilter === 'all' ? '' : statusFilter,
          page: currentPage
        }
      });
      
      setAdmissions(response.data.data || []);
      setTotalPages(response.data.last_page || 0);
    } catch (err) {
      console.error('Error fetching admissions:', err);
      setError('Failed to load admissions. Please try again.');
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmissions();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, currentPage]);

  // Initial load
  useEffect(() => {
    if (user && birthcare_Id) {
      fetchAdmissions();
    }
  }, [user, birthcare_Id]);

  if (!user) {
    return null;
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_patient_admission"))
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600 font-semibold">Unauthorized Access</div>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in-labor':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'discharged':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'in-labor':
        return <Clock className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'discharged':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleViewDetails = (admissionId) => {
    // Navigate to admission details page
    window.location.href = `/${birthcare_Id}/patient-admission?admissionId=${admissionId}`;
  };

  const handleStatusUpdate = async (admissionId, newStatus) => {
    if (updatingStatus[admissionId]) return; // Prevent multiple requests
    
    // Check if patient is already discharged
    const admission = admissions.find(a => a.id === admissionId);
    if (admission?.status?.toLowerCase() === 'discharged' && newStatus === 'discharged') {
      alert('Patient is already discharged.');
      return;
    }
    
    // If changing to discharged, handle mother/newborn discharge workflow
    if (newStatus === 'discharged') {
      const currentClickCount = dischargeClickCount[admissionId] || 0;
      const newClickCount = currentClickCount + 1;
      const progress = dischargeProgress[admissionId] || { mother: false, newborn: false };
      
      // Update click count
      setDischargeClickCount(prev => ({
        ...prev,
        [admissionId]: newClickCount
      }));
      
      const admission = admissions.find(a => a.id === admissionId);
      
      if (newClickCount === 1) {
        // First click - Create mother discharge slip
        window.open(`/${birthcare_Id}/patient-discharge/mother?patientId=${admission.patient?.id}&admissionId=${admission.id}`, '_blank');
        
        // Update progress to show mother discharge slip was created
        setDischargeProgress(prev => ({
          ...prev,
          [admissionId]: { ...progress, mother: true }
        }));
        return;
        
      } else if (newClickCount === 2) {
        // Second click - Create newborn discharge slip
        window.open(`/${birthcare_Id}/patient-discharge/newborn?patientId=${admission.patient?.id}&admissionId=${admission.id}`, '_blank');
        
        // Update progress to show newborn discharge slip was created
        const updatedProgress = { mother: true, newborn: true };
        setDischargeProgress(prev => ({
          ...prev,
          [admissionId]: updatedProgress
        }));
        
        // Both discharge slips created - automatically discharge the patient
        setUpdatingStatus(prev => ({ ...prev, [admissionId]: true }));
        
        try {
          await axios.patch(`/api/birthcare/${birthcare_Id}/patient-admissions/${admissionId}/status`, {
            status: 'discharged'
          });
          
          // Update the admission in the local state
          setAdmissions(prev => prev.map(admission => 
            admission.id === admissionId 
              ? { ...admission, status: 'discharged' }
              : admission
          ));
          
          // Reset click count and progress after successful discharge
          setDischargeClickCount(prev => {
            const newCount = { ...prev };
            delete newCount[admissionId];
            return newCount;
          });
          
          setDischargeProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[admissionId];
            return newProgress;
          });
          
        } catch (error) {
          console.error('Error updating status:', error);
          alert('Failed to update status to discharged. Please try again.');
        } finally {
          setUpdatingStatus(prev => ({ ...prev, [admissionId]: false }));
        }
        return;
        
      } else {
        // Third click or more - patient is already discharged, just show message
        alert('Patient is already discharged or both discharge slips have been created.');
        return;
      }
    }
    
    setUpdatingStatus(prev => ({ ...prev, [admissionId]: true }));
    
    try {
      await axios.patch(`/api/birthcare/${birthcare_Id}/patient-admissions/${admissionId}/status`, {
        status: newStatus
      });
      
      // Update the admission in the local state
      setAdmissions(prev => prev.map(admission => 
        admission.id === admissionId 
          ? { ...admission, status: newStatus }
          : admission
      ));
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [admissionId]: false }));
    }
  };

  const handleDischargeComplete = (admissionId) => {
    // This function is no longer used since we handle discharge directly
    // but keeping it for compatibility
    setShowDischargeModal(false);
    setSelectedAdmissionForDischarge(null);
  };

  const handleDischargeCancel = () => {
    setShowDischargeModal(false);
    setSelectedAdmissionForDischarge(null);
    
    // Note: We don't reset the click count here so workflow continues
  };

  return (
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ADMISSION LIST</h1>
              <p className="text-sm text-gray-900 mt-1 font-medium">Manage and View All Admitted Patients</p>
            </div>
            <button
              onClick={() => setIsAdmissionModalOpen(true)}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
            >
              <UserCheck size={20} />
              <span>Admit Patient</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent transition-all duration-200 bg-white"
                />
            </div>
          </div>

        {/* Admissions List */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Results Info */}
          <div className="px-6 py-5 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDB3C2]/20 text-[#BF3853] font-semibold">
                    {admissions.length} admissions
                  </span>
                  {searchTerm && <span className="ml-2 text-gray-500"> matching "{searchTerm}"</span>}
                  {loading && <span className="ml-2 text-[#BF3853] animate-pulse">Loading...</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-6 border-b border-gray-200">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="ml-2 text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && admissions.length === 0 && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BF3853]"></div>
              <span className="ml-2 text-gray-600">Loading admissions...</span>
            </div>
          )}

          {/* Admissions Table */}
          {!loading && admissions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 w-20">
                      Admission No.
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 min-w-32">
                      Patient Name
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 w-16">
                      Age
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 min-w-32">
                      Date & Time of Admission
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 w-20">
                      Room No.
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 w-20">
                      Bed No.
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 min-w-32">
                      Attending Midwife
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider min-w-36">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {admissions.map((admission, index) => (
                    <tr key={admission.id} className="border-b border-white/30 hover:bg-[#FDB3C2]/10 transition-all duration-200">
                      {/* Admission No. */}
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-700 border-r border-white/30">
                        {admission.id}
                      </td>
                      
                      {/* Patient Name */}
                      <td className="px-4 py-4 text-center text-sm border-r border-white/30">
                        <div className="font-bold text-gray-900">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                      </td>
                      
                      {/* Age */}
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-700 border-r border-white/30">
                        {calculateAge(admission.patient?.date_of_birth)}
                      </td>
                      
                      {/* Date & Time of Admission */}
                      <td className="px-4 py-4 text-center text-sm text-gray-600 border-r border-white/30">
                        <div className="text-xs">
                          <div className="font-bold text-gray-900">{formatDate(admission.admission_date)}</div>
                          <div className="text-gray-500">{formatTime(admission.admission_time)}</div>
                        </div>
                      </td>
                      
                      {/* Room No. */}
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-white/30">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-medium text-xs">
                          {admission.room?.name || admission.room_number || '101'}
                        </span>
                      </td>
                      
                      {/* Bed No. */}
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-white/30">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 font-medium text-xs">
                          {admission.bed?.bed_no || admission.bed_number || '1'}
                        </span>
                      </td>
                      
                      {/* Attending Midwife */}
                      <td className="px-4 py-4 text-center text-sm text-gray-600 border-r border-white/30">
                        <div className="text-xs font-medium truncate">{admission.attending_physician || admission.primary_nurse || '-'}</div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-4 text-center text-sm">
                        <select
                          value={admission.status || 'in-labor'}
                          onChange={(e) => handleStatusUpdate(admission.id, e.target.value)}
                          disabled={updatingStatus[admission.id]}
                          className={`w-full text-xs font-bold rounded-full px-3 py-1.5 border focus:ring-2 focus:ring-[#BF3853] disabled:opacity-50 shadow-sm ${
                            admission.status?.toLowerCase() === 'in-labor' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            admission.status?.toLowerCase() === 'delivered' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            admission.status?.toLowerCase() === 'discharged' ? 'bg-green-100 text-green-800 border-green-300' :
                            'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                          title={
                            admission.status?.toLowerCase() === 'discharged'
                              ? 'Patient is already discharged'
                              : dischargeClickCount[admission.id] === 1 
                              ? 'Next: Click discharge again to create newborn slip and complete discharge' 
                              : dischargeClickCount[admission.id] === 0 || !dischargeClickCount[admission.id]
                              ? 'First click: Create mother discharge slip'
                              : ''
                          }
                        >
                          <option value="in-labor">In-Labor</option>
                          <option value="delivered">Delivered</option>
                          <option value="discharged">
                            Discharged
                            {admission.status?.toLowerCase() !== 'discharged' && (
                              dischargeClickCount[admission.id] === 1 
                                ? ' (Next: Newborn slip)' 
                                : dischargeClickCount[admission.id] === 0 || !dischargeClickCount[admission.id]
                                ? ' (Start: Mother slip)'
                                : ''
                            )}
                          </option>
                        </select>
                        {updatingStatus[admission.id] && (
                          <div className="text-xs text-gray-500 mt-1">
                            Updating...
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Results */}
          {!loading && admissions.length === 0 && !error && (
            <div className="p-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FDB3C2]/30 to-[#F891A5]/30 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-[#BF3853]" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No admissions found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'No patient admissions have been recorded yet'}
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-5 border-t border-white/20">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-[#FDB3C2]/20 hover:border-[#BF3853] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                
                <span className="text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-[#FDB3C2]/20 hover:border-[#BF3853] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Discharge Modal */}
        {showDischargeModal && selectedAdmissionForDischarge && (
          <DischargeModal 
            isOpen={showDischargeModal}
            admission={selectedAdmissionForDischarge}
            birthcare_Id={birthcare_Id}
            onComplete={handleDischargeComplete}
            onCancel={handleDischargeCancel}
          />
        )}
        
        {/* Patient Admission Modal */}
        <PatientAdmissionModal
          isOpen={isAdmissionModalOpen}
          onClose={() => setIsAdmissionModalOpen(false)}
          birthcare_Id={birthcare_Id}
          onAdmissionCreated={fetchAdmissions}
        />
      </div>
    </div>
  );
};

// Discharge Modal Component
const DischargeModal = ({ isOpen, admission, birthcare_Id, onComplete, onCancel }) => {
  const [dischargeType, setDischargeType] = useState('mother');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDischargeTypeSubmit = () => {
    if (dischargeType === 'mother') {
      // Navigate to mother discharge form
      window.open(`/${birthcare_Id}/patient-discharge/mother?patientId=${admission.patient?.id}&admissionId=${admission.id}`, '_blank');
    } else if (dischargeType === 'newborn') {
      // Navigate to newborn discharge form
      window.open(`/${birthcare_Id}/patient-discharge/newborn?patientId=${admission.patient?.id}&admissionId=${admission.id}`, '_blank');
    }
    
    // Mark as discharged after opening the form
    onComplete(admission.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="relative mx-auto p-1 w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-[#ff6b6b]/10 to-pink-100 rounded-lg">
                <svg className="w-6 h-6 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Create Discharge Form</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Patient Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-[#ff6b6b]/5 to-pink-50/50 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-1.5 bg-[#ff6b6b]/10 rounded-lg">
                <svg className="w-4 h-4 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 text-base">Patient Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Name:</span>
                <span className="text-gray-900 font-semibold">{admission.patient?.first_name} {admission.patient?.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Admission ID:</span>
                <span className="text-[#ff6b6b] font-semibold">#{admission.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Room:</span>
                <span className="text-gray-900">{admission.room?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Bed:</span>
                <span className="text-gray-900">{admission.bed?.bed_no || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          {/* Discharge Type Selection */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-2 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Select Discharge Type:
            </label>
            <div className="space-y-3">
              <label className="relative flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-[#ff6b6b]/5 hover:border-gray-300 transition-all duration-200 group">
                <input
                  type="radio"
                  value="mother"
                  checked={dischargeType === 'mother'}
                  onChange={(e) => setDischargeType(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all duration-200 ${
                  dischargeType === 'mother' 
                    ? 'border-[#ff6b6b] bg-[#ff6b6b]' 
                    : 'border-gray-300 group-hover:border-[#ff6b6b]'
                }`}>
                  {dischargeType === 'mother' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div className="flex items-center space-x-3 flex-1">
                  <div className="p-2 bg-[#ff6b6b]/10 rounded-lg">
                    <svg className="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Mother Discharge Form</div>
                    <div className="text-sm text-gray-500">Discharge instructions for the mother</div>
                  </div>
                </div>
              </label>
              
              <label className="relative flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-[#ff6b6b]/5 hover:border-gray-300 transition-all duration-200 group">
                <input
                  type="radio"
                  value="newborn"
                  checked={dischargeType === 'newborn'}
                  onChange={(e) => setDischargeType(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all duration-200 ${
                  dischargeType === 'newborn' 
                    ? 'border-[#ff6b6b] bg-[#ff6b6b]' 
                    : 'border-gray-300 group-hover:border-[#ff6b6b]'
                }`}>
                  {dischargeType === 'newborn' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div className="flex items-center space-x-3 flex-1">
                  <div className="p-2 bg-[#ff6b6b]/10 rounded-lg">
                    <svg className="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Newborn Discharge Form</div>
                    <div className="text-sm text-gray-500">Discharge instructions for the newborn</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDischargeTypeSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] border border-transparent rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Discharge Form
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionListPage;
