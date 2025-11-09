"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";
import { Eye, FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import CustomDialog from '@/components/CustomDialog';
import Loading from '@/components/Loading';

const PatientDocumentsPage = () => {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [documents, setDocuments] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]); // Store all documents for client-side pagination
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [useClientSidePagination, setUseClientSidePagination] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const documentsPerPage = 5;
  
  // Dialog state
  const [notifyDialog, setNotifyDialog] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  // Fetch patients for filter dropdown
  const fetchPatients = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/patients?all=true`
      );
      const patientsData = response.data.data || response.data;
      setPatients(patientsData);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  // Fetch documents with pagination
  const fetchDocuments = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/patient-documents`,
        {
          params: {
            search: searchTerm,
            patient_id: selectedPatient,
            document_type: selectedType,
            page: page,
            per_page: documentsPerPage,
          }
        }
      );
      
      const data = response.data;
      console.log('API Response:', data);
      console.log('Raw documents received:', data.data?.length || 0);
      
      let documentsData = data.data || [];
      const actualDocumentCount = documentsData.length;
      
      // Determine if backend actually paginated the results
      // True pagination if per_page provided OR data length < total
      const backendPaginated = (typeof data.per_page === 'number' && data.per_page > 0)
        || (typeof data.total === 'number' && data.total > 0 && Array.isArray(documentsData) && documentsData.length < data.total);
      
      if (!backendPaginated) {
        console.log('Backend pagination not detected, using client-side pagination');
        setUseClientSidePagination(true);
        
        // Store all documents when on first page or filter changes
        if (page === 1) {
          console.log('Storing all documents for client-side pagination:', actualDocumentCount);
          setAllDocuments(documentsData);
          setTotalDocuments(actualDocumentCount);
          setTotalPages(Math.max(1, Math.ceil(actualDocumentCount / documentsPerPage)));
        }
        
        // Paginate client-side
        const startIndex = (page - 1) * documentsPerPage;
        const endIndex = startIndex + documentsPerPage;
        const docsToUse = page === 1 ? documentsData : allDocuments;
        
        documentsData = docsToUse.slice(startIndex, endIndex);
        setCurrentPage(page);
        
        console.log(`Client-side pagination: showing docs ${startIndex + 1} to ${startIndex + documentsData.length} of ${docsToUse.length}`);
      } else {
        // Backend pagination is available
        console.log('Using backend pagination');
        setUseClientSidePagination(false);
        
        // Prefer totals and per_page from backend when present
        const totalDocs = (typeof data.total === 'number' ? data.total : actualDocumentCount);
        const perPage = (typeof data.per_page === 'number' && data.per_page > 0) ? data.per_page : documentsPerPage;
        const currentPg = data.current_page || page;
        const totalPgs = Math.max(1, Math.ceil(totalDocs / perPage));
        
        setTotalDocuments(totalDocs);
        setTotalPages(totalPgs);
        setCurrentPage(currentPg);
        
        // Safety: limit to per-page
        documentsData = documentsData.slice(0, perPage);
        
        console.log(`Backend pagination: page ${currentPg} of ${totalPgs}, showing ${documentsData.length} docs of ${totalDocs} total`);
      }
      
      setDocuments(documentsData);
      console.log(`Final result: ${documentsData.length} documents displayed`);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && birthcare_Id) {
      fetchPatients();
      fetchDocuments();
    }
  }, [user, birthcare_Id]);

  useEffect(() => {
    if (user && birthcare_Id) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchDocuments(1);
    }
  }, [searchTerm, selectedPatient, selectedType]);
  
  // Handle page changes
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    
    if (useClientSidePagination) {
      // For client-side pagination, just update the display without API call
      const startIndex = (newPage - 1) * documentsPerPage;
      const endIndex = startIndex + documentsPerPage;
      const paginatedDocs = allDocuments.slice(startIndex, endIndex);
      setDocuments(paginatedDocs);
      console.log(`Client-side pagination: Displaying ${paginatedDocs.length} documents on page ${newPage}`);
    } else {
      // For server-side pagination, make API call
      fetchDocuments(newPage);
    }
  };


  const handleView = async (documentId) => {
    try {
      console.log('Viewing document:', documentId);
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/patient-documents/${documentId}/view`,
        { responseType: 'blob' }
      );
      
      if (response.data.size === 0) {
        throw new Error('Document appears to be empty');
      }
      
      // Open PDF in new tab
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        alert('Please allow popups to view the document');
      }
      
      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      
      console.log('Document opened successfully');
    } catch (error) {
      console.error('View failed:', error);
      if (error.response?.status === 404) {
        alert('Document file not found. It may have been moved or deleted.');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to view this document.');
      } else {
        alert(`Failed to view document: ${error.message}`);
      }
    }
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'prenatal_form':
        return <FileText className="w-5 h-5 text-gray-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
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
      !user.permissions?.includes("manage_patient_documents"))
  ) {
    return <div>Unauthorized</div>;
  }

  if (loading && documents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b6b] mx-auto"></div>
          <span className="mt-2 block">Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PATIENT DOCUMENTS</h1>
          <p className="text-sm text-gray-900 mt-1 font-medium">
            View and manage patient documents and reports
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-6 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent transition-all duration-200 bg-white"
                />
              </div>

              {/* Patient Filter */}
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent transition-all duration-200 bg-white font-medium text-gray-700"
              >
                <option value="">All Patients</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {`${patient.first_name} ${patient.middle_name || ""} ${patient.last_name}`.trim()}
                  </option>
                ))}
              </select>

              {/* Document Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent transition-all duration-200 bg-white font-medium text-gray-700"
              >
                <option value="">All Types</option>
                <option value="prenatal_form">Prenatal Form</option>
                <option value="labor_monitoring">Labor Monitoring</option>
                <option value="referral">Referral</option>
                <option value="patient_chart">Patient Chart</option>
                <option value="newborn_screening">Newborn Screening</option>
                <option value="certificate_live_birth">Certificate of Live Birth</option>
                <option value="mother_discharge">Mother Discharge</option>
                <option value="newborn_discharge">Newborn Discharge</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Results Info */}
          <div className="px-6 py-5 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDB3C2]/20 text-[#BF3853] font-semibold">
                    {totalDocuments} documents
                  </span>
                  {searchTerm && <span className="ml-2 text-gray-500"> matching \"{searchTerm}\"</span>}
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

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">
                    Document
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                    {documents.length > 0 ? (
                      documents.map((document) => (
                        <tr key={document.id} className="border-b border-white/30 hover:bg-[#FDB3C2]/10 transition-all duration-200 group">
                          <td className="px-6 py-4 border-r border-white/30">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-3">
                                {getDocumentIcon(document.document_type)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-[#BF3853] transition-colors">
                                  {document.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {document.file_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-r border-white/30">
                            <div className="text-sm font-semibold text-gray-900">
                              {document.patient?.first_name} {document.patient?.middle_name || ""} {document.patient?.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-r border-white/30">
                            <span className="inline-flex px-3 py-1.5 text-xs font-bold rounded-full shadow-sm bg-[#FDB3C2]/20 text-[#BF3853]">
                              {document.document_type?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 border-r border-white/30">
                            {formatDate(document.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView(document.id)}
                                className="p-2 text-[#BF3853] hover:bg-[#FDB3C2]/20 rounded-lg transition-all duration-200"
                                title="View Document"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#FDB3C2]/30 to-[#F891A5]/30 rounded-full flex items-center justify-center mb-4">
                              <FileText className="w-10 h-10 text-[#BF3853]" />
                            </div>
                            {searchTerm || selectedPatient || selectedType ? (
                              <>
                                <p className="text-xl font-bold text-gray-700 mb-2">No documents found</p>
                                <p className="text-gray-500">Try adjusting your search terms or clear the filters to see all documents.</p>
                              </>
                            ) : (
                              <>
                                <p className="text-xl font-bold text-gray-700 mb-2">No documents yet</p>
                                <p className="text-gray-500">Documents will appear here when they are generated from forms and reports.</p>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
        
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-5 border-t border-white/20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-[#FDB3C2]/20 hover:border-[#BF3853] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                
                <span className="text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
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
      
      {/* Notification Dialog */}
      <CustomDialog
        isOpen={notifyDialog.isOpen}
        onClose={() => setNotifyDialog({ isOpen: false, type: 'info', title: '', message: '' })}
        type={notifyDialog.type}
        title={notifyDialog.title}
        message={notifyDialog.message}
        confirmText="OK"
        showCancel={false}
      />
    </div>
  );
};

export default PatientDocumentsPage;
