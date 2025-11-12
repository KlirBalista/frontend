"use client";
import { useAuth } from "@/hooks/auth";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Filter, ChevronLeft, ChevronRight, UserPlus, Eye, X } from 'lucide-react';
import axios from '@/lib/axios';
import PatientRegistrationModal from '@/components/PatientRegistrationModal';

const PatientListPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [fromNumber, setFromNumber] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [facility, setFacility] = useState(null);
  const [facilityLoading, setFacilityLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch patients from backend
  const fetchPatients = async () => {
    if (!user) {
      console.log('No user found, skipping fetch');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== PATIENT FETCH DEBUG START ===');
      console.log('User:', user);
      console.log('Birth Care ID:', birthcare_Id);
      console.log('Search Term (debounced):', debouncedSearchTerm);
      console.log('Status Filter:', statusFilter);
      console.log('Current Page:', currentPage);
      
      const params = {
        page: currentPage
      };
      
      // Only add search if it has a value
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      
      // Only add status filter if it's not 'all'
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      console.log('Final API params:', params);
      
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/patients`, {
        params: params
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response data:', response.data);
      console.log('API Response headers:', response.headers);
      
      const responseData = response.data;
      const patientsData = responseData.data || responseData || [];
      const totalPages = responseData.last_page || responseData.meta?.last_page || 0;
      const perPageValue = responseData.per_page || responseData.meta?.per_page || 10;
      const fromValue = responseData.from || responseData.meta?.from || ((currentPage - 1) * perPageValue + 1);
      const totalCount = responseData.total || responseData.meta?.total || patientsData.length;
      
      console.log('Processed patients data:', patientsData);
      console.log('Total pages:', totalPages);
      console.log('Per page:', perPageValue);
      console.log('From:', fromValue);
      console.log('Total patients:', totalCount);
      
      setPatients(patientsData);
      setTotalPages(totalPages);
      setPerPage(perPageValue);
      setFromNumber(fromValue);
      setTotalPatients(totalCount);
    } catch (err) {
      console.error('Error fetching patients:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        user: user,
        birthcare_Id: birthcare_Id
      });
      
      let errorMessage = 'Failed to load patients. ';
      if (err.response?.status === 500) {
        errorMessage += 'Server error occurred. Please try again or contact support.';
        if (err.response?.data?.message) {
          errorMessage += ` Error: ${err.response.data.message}`;
        }
      } else if (err.response?.status === 404) {
        errorMessage += 'API endpoint not found.';
      } else if (err.response?.status === 403) {
        errorMessage += 'Access denied. Check your permissions.';
      } else if (err.response?.status === 422) {
        errorMessage += 'Invalid request data.';
        if (err.response?.data?.errors) {
          errorMessage += ` Validation errors: ${Object.values(err.response.data.errors).flat().join(', ')}`;
        }
      } else if (!err.response) {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += `Status: ${err.response?.status || 'Unknown'}. ${err.response?.data?.message || err.message}`;
      }
      
      setError(errorMessage);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch facility data
  useEffect(() => {
    const fetchFacility = async () => {
      try {
        setFacilityLoading(true);
        const response = await axios.get(`/api/birthcare/${birthcare_Id}`);
        console.log('Facility API Response:', response.data);
        const facilityData = response.data.data || response.data;
        console.log('Facility Data:', facilityData);
        setFacility(facilityData);
      } catch (error) {
        console.error('Error fetching facility:', error);
        setFacility(null);
      } finally {
        setFacilityLoading(false);
      }
    };

    if (birthcare_Id) {
      fetchFacility();
    }
  }, [birthcare_Id]);

  // Fetch patients when component mounts or dependencies change
  useEffect(() => {
    if (user && birthcare_Id) {
      fetchPatients();
    }
  }, [user, birthcare_Id, currentPage, debouncedSearchTerm, statusFilter]);

  if (!user) {
    return null;
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_patients"))
  ) {
    return <div>Unauthorized</div>;
  }

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

  // Reset to first page when debounced search term or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  // Handle patient registration
  const handlePatientRegistration = async (patientData) => {
    try {
      setRegistering(true);
      
      const response = await axios.post(`/api/birthcare/${birthcare_Id}/patients`, patientData);
      
      if (response.data.success) {
        // Refresh patient list
        await fetchPatients();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Error registering patient:', err);
      throw new Error(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setRegistering(false);
    }
  };

  // Handle loading and error states
  if (loading && patients.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading patients...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PATIENT LIST</h1>
                  <p className="text-sm text-gray-900 mt-1 font-medium">Manage and view all registered patients</p>
                </div>
                <button
                  onClick={() => !facilityLoading && setIsModalOpen(true)}
                  disabled={facilityLoading}
                  className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <UserPlus size={20} />
                  <span>{facilityLoading ? 'Loading...' : 'Register Patient'}</span>
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

            {/* Patients List - Uniform with Admissions */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              {/* Results Info */}
              <div className="px-6 py-5 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDB3C2]/20 text-[#BF3853] font-semibold">
                        {totalPatients} patients
                      </span>
                      {debouncedSearchTerm && <span className="ml-2 text-gray-500"> matching \"{debouncedSearchTerm}\"</span>}
                      {searchTerm !== debouncedSearchTerm && <span className="ml-2 text-[#BF3853] animate-pulse">Searching...</span>}
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
                      <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-red-600">{error}</p>
                        <button 
                          onClick={() => {
                            setError(null);
                            fetchPatients();
                          }}
                          className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && patients.length === 0 && (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BF3853]"></div>
                  <span className="ml-2">Loading patients...</span>
                </div>
              )}

            {/* Patient Table */}
            <div className="flex-1 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 w-16">
                        No.
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 min-w-40">
                        Patient Name
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 min-w-32">
                        Facility
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 w-16">
                        Age
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 min-w-24">
                        Civil Status
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 min-w-32">
                        Contact
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 min-w-24">
                        Status
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider min-w-24">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {patients.length > 0 ? (
                      patients
                        .filter((p) => statusFilter === 'all' ? true : p.status?.toLowerCase() === statusFilter.toLowerCase())
                        .map((patient, index) => (
                        <tr 
                          key={patient.id} 
                          className="border-b border-white/30 hover:bg-[#FDB3C2]/10 transition-all duration-200 cursor-pointer group"
                        >
                          {/* Row Number */}
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-700 border-r border-white/30">
                            {fromNumber + index}
                          </td>
                          {/* Patient Name */}
                          <td className="px-4 py-4 text-center text-sm border-r border-white/30">
                            <div className="font-bold text-gray-900 group-hover:text-[#BF3853] transition-colors">
                              {patient.first_name} {patient.middle_name} {patient.last_name}
                            </div>
                          </td>
                          {/* Facility */}
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600 border-r border-white/30">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/50 text-gray-900 font-bold">
                              {patient.facility_name || 'N/A'}
                            </span>
                          </td>
                          {/* Age */}
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900 border-r border-white/30">
                            {patient.age}
                          </td>
                          {/* Civil Status */}
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900 border-r border-white/30">
                            <span className="font-bold">{patient.civil_status}</span>
                          </td>
                          {/* Contact */}
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900 border-r border-white/30">
                            <span className="font-bold text-xs bg-white/50 px-2 py-1 rounded">
                              {patient.contact_number || 'N/A'}
                            </span>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-white/30">
                            <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${getStatusColor(patient.status)}`}>
                              {patient.status}
                            </span>
                          </td>
                          {/* Action */}
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setIsViewModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white text-xs font-medium rounded-lg hover:shadow-lg hover:shadow-[#BF3853]/25 transition-all duration-200 hover:scale-105"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#FDB3C2]/30 to-[#F891A5]/30 rounded-full flex items-center justify-center mb-4">
                              <UserPlus className="w-10 h-10 text-[#BF3853]" />
                            </div>
                            {debouncedSearchTerm ? (
                              <>
                                <p className="text-xl font-bold text-gray-700 mb-2">No patients found</p>
                                <p className="text-gray-500">Try adjusting your search terms or clear the search to see all patients.</p>
                              </>
                            ) : (
                              <>
                                <p className="text-xl font-bold text-gray-700 mb-2">No patients yet</p>
                                <p className="text-gray-500 mb-4">Get started by adding your first patient.</p>
                                <button
                                  onClick={() => !facilityLoading && setIsModalOpen(true)}
                                  disabled={facilityLoading}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                  <UserPlus size={18} />
                                  <span>{facilityLoading ? 'Loading...' : 'Register Patient'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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
      </div>

      {/* Patient Registration Modal */}
      <PatientRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPatientRegistered={handlePatientRegistration}
        facilityName={facility?.facility_name || facility?.name || 'Loading...'}
        facilityAddress={facility?.address || facility?.description || ''}
        birthcareId={birthcare_Id}
        loading={registering}
      />

      {/* Patient Details Modal */}
      {isViewModalOpen && selectedPatient && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="relative mx-auto w-11/12 max-w-4xl my-6">
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Patient Details</h2>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedPatient(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-[#BF3853]">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase">Full Name</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {selectedPatient.first_name} {selectedPatient.middle_name} {selectedPatient.last_name}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {selectedPatient.date_of_birth ? selectedPatient.date_of_birth.split('T')[0] : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase">Age</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.age}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase">Civil Status</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.civil_status}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">Address</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-[#BF3853]">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase">Contact Number</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.contact_number || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                      <p className="text-sm mt-1">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(selectedPatient.status)}`}>
                          {selectedPatient.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Facility Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-[#BF3853]">
                    Facility Information
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 uppercase">Facility Name</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.facility_name || 'N/A'}</p>
                  </div>
                </div>

                {/* PhilHealth Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-[#BF3853]">
                    PhilHealth Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase">PhilHealth Number</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.philhealth_number || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase">PhilHealth Category</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.philhealth_category || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Principal Member Information - Show only for Indirect members */}
                  {selectedPatient.philhealth_category === 'Indirect' && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Principal Member's Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Principal Member's PhilHealth No.</label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.philhealth_dependent_id || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Principal Member's Name</label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.philhealth_dependent_name || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-gray-500 uppercase">Relationship to Principal Member</label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.philhealth_dependent_relation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedPatient(null);
                  }}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientListPage;
