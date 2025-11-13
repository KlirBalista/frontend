"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function BirthcareApplications() {
  const router = useRouter();
  const { user } = useAuth({ middleware: "auth" });

  // State for pagination, sorting, filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(6);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filters, setFilters] = useState({
    status: "", // Will be set from URL or default to empty
    search: "",
  });

  // Check URL parameters for status filter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilters(prev => ({ ...prev, status: statusParam }));
    } else {
      // Default to pending if no status param
      setFilters(prev => ({ ...prev, status: 'pending' }));
    }
  }, []);

  // State for application actions
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(""); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  // State for document viewer
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // State for review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewApplication, setReviewApplication] = useState(null);

  // Fetch applications data
  const { data, error, mutate, isLoading } = useSWR(
    `/api/admin/birthcare-applications?page=${currentPage}&perPage=${perPage}&sortField=${sortField}&sortDirection=${sortDirection}&status=${filters.status}&search=${filters.search}`,
    () =>
      axios
        .get(`/api/admin/birthcare-applications`, {
          params: {
            page: currentPage,
            perPage,
            sortField,
            sortDirection,
            status: filters.status,
            search: filters.search,
          },
        })
        .then((res) => res.data)
        .catch((error) => {
          console.error("Error fetching applications:", error);
          throw error;
        })
  );

  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Open action modal
  const openActionModal = (application, action) => {
    setSelectedApplication(application);
    setActionType(action);
    setRejectionReason("");
    setShowModal(true);
  };

  // Close action modal
  const closeActionModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
    setActionType("");
    setRejectionReason("");
  };

  // Handle application action (approve/reject)
  const handleApplicationAction = async () => {
    if (!selectedApplication || !actionType) return;

    setIsSubmitting(true);
    setActionMessage({ type: "", text: "" });

    try {
      const endpoint = `/api/admin/birthcare-applications/${selectedApplication.id}/${actionType}`;
      const payload =
        actionType === "reject" ? { reason: rejectionReason } : {};

      await axios.post(endpoint, payload);

      // Show success message and close modal
      setActionMessage({
        type: "success",
        text: `Application ${
          actionType === "approve" ? "approved" : "rejected"
        } successfully.`,
      });

      // Refresh data
      mutate();

      // Close modal after short delay
      setTimeout(() => {
        closeActionModal();
        setActionMessage({ type: "", text: "" });
      }, 2000);
    } catch (error) {
      console.error(`Error ${actionType}ing application:`, error);
      setActionMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          `An error occurred while ${actionType}ing the application.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open document viewer
  const openDocumentViewer = (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  // Close document viewer
  const closeDocumentViewer = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  // Download document
  const downloadDocument = (document) => {
    window.open(document.url, "_blank");
  };
  
  // Open review modal
  const openReviewModal = (application) => {
    setReviewApplication(application);
    setShowReviewModal(true);
  };
  
  // Close review modal
  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewApplication(null);
    setActionType("");
    setRejectionReason("");
    setActionMessage({ type: "", text: "" });
  };
  
  // Handle decision from review modal
  const handleReviewDecision = (action) => {
    setActionType(action);
    if (action === "reject") {
      setRejectionReason("");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Sort indicator
  const SortIndicator = ({ field }) => {
    if (sortField !== field) return null;

    return <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading applications...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border-0 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Error Loading Applications
              </h3>
              <p className="text-gray-600 font-medium">
                There was an error loading the applications. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.applications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              BIRTHCARE APPLICATIONS
            </h1>
            <p className="text-gray-600 text-lg">
              Review and manage facility registration applications
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border-0 p-12">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="h-12 w-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No Applications Found
              </h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                There are no birthcare facility applications to review at this time. 
                New applications will appear here as they are submitted.
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 border border-[#FDB3C2] text-[#BF3853] rounded-lg text-sm font-semibold">
                <svg
                  className="h-5 w-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Waiting for Applications
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            BIRTHCARE APPLICATIONS
          </h1>
          <p className="text-gray-600 text-lg">
            Review and manage facility registration applications
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border-0 p-6 mb-8 transform hover:shadow-xl transition-all duration-300">
          <div className="px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39] -mx-6 -mt-6 mb-6 rounded-t-xl">
            <h2 className="text-xl font-bold text-white">
              Search & Filter Applications
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="search"
                className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider"
              >
                Search Applications
              </label>
              <div className="mt-1">
                <Input
                  type="text"
                  name="search"
                  id="search"
                  placeholder="Search by facility name or owner"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="block w-full rounded-lg border-gray-300 focus:ring-[#BF3853] focus:border-[#BF3853] shadow-sm"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider"
              >
                Filter by Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-[#BF3853] focus:border-[#BF3853] sm:text-sm rounded-lg shadow-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="sm:col-span-1 flex items-end">
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-[#FDB3C2] to-[#F891A5] hover:from-[#BF3853] hover:to-[#A41F39] text-white font-semibold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                onClick={() => {
                  setFilters({ status: "pending", search: "" });
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Applications Cards */}
        <div className="space-y-6">
          {data.applications.map((application) => (
            <div key={application.id} className="bg-white rounded-xl shadow-lg border-0 p-6 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Main Application Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-lg mr-3">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 
                            className="text-xl font-bold text-gray-900 cursor-pointer hover:text-[#BF3853] transition-colors"
                            onClick={() => handleSort("name")}
                          >
                            {application.name}
                            <SortIndicator field="name" />
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">
                            Submitted {formatDate(application.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full ${getStatusBadgeClass(
                        application.status
                      )}`}
                    >
                      {application.status.charAt(0).toUpperCase() +
                        application.status.slice(1)}
                    </span>
                  </div>
                  
                  {/* Owner Info */}
                  <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-br from-[#BF3853] to-[#A41F39] rounded-lg mr-3">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {application.user.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {application.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Documents */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm font-semibold text-gray-700 mr-2">Documents:</span>
                    {application.documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => openDocumentViewer(doc)}
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 border border-[#FDB3C2] text-xs font-semibold rounded-lg text-[#BF3853] hover:from-[#BF3853] hover:to-[#A41F39] hover:text-white hover:scale-105 transform transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {doc.document_type}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="lg:ml-6 flex-shrink-0">
                  {application.status === "pending" ? (
                    <button
                      onClick={() => openReviewModal(application)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white font-semibold rounded-lg shadow-lg hover:from-[#A41F39] hover:to-[#923649] transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    >
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Review Application
                    </button>
                  ) : (
                    <button
                      onClick={() => openReviewModal(application)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    >
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-lg border-0 px-6 py-4 flex items-center justify-between mt-8">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`bg-gradient-to-r from-[#FDB3C2] to-[#F891A5] hover:from-[#BF3853] hover:to-[#A41F39] text-white font-semibold py-2 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Previous
              </Button>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === data.totalPages}
                className={`ml-3 bg-gradient-to-r from-[#FDB3C2] to-[#F891A5] hover:from-[#BF3853] hover:to-[#A41F39] text-white font-semibold py-2 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  currentPage === data.totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg px-4 py-2">
                <p className="text-sm font-semibold text-gray-700">
                  Showing{" "}
                  <span className="font-bold text-[#BF3853]">
                    {(currentPage - 1) * perPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#BF3853]">
                    {Math.min(currentPage * perPage, data.total)}
                  </span>{" "}
                  of <span className="font-bold text-[#BF3853]">{data.total}</span> applications
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-lg shadow-lg overflow-hidden"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-3 py-2 bg-gradient-to-r from-[#FDB3C2] to-[#F891A5] text-white font-medium hover:from-[#BF3853] hover:to-[#A41F39] transform transition-all duration-200 ${
                      currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Page numbers */}
                  {[...Array(data.totalPages).keys()].map((page) => (
                    <button
                      key={page + 1}
                      onClick={() => handlePageChange(page + 1)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold transform transition-all duration-200 ${
                        currentPage === page + 1
                          ? "bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white shadow-lg scale-110"
                          : "bg-white text-[#BF3853] hover:bg-gradient-to-r hover:from-[#FDB3C2] hover:to-[#F891A5] hover:text-white hover:scale-105"
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === data.totalPages}
                    className={`relative inline-flex items-center px-3 py-2 bg-gradient-to-r from-[#FDB3C2] to-[#F891A5] text-white font-medium hover:from-[#BF3853] hover:to-[#A41F39] transform transition-all duration-200 ${
                      currentPage === data.totalPages ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
            
        {/* Action Modal */}
        {showModal && (
          <div
            className="fixed z-50 inset-0 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
              <div
                className="fixed inset-0 backdrop-blur-md bg-gray-900/50 transition-opacity"
                aria-hidden="true"
                onClick={closeActionModal}
              ></div>
              <div className="relative bg-white rounded-2xl shadow-2xl transform transition-all max-w-lg w-full p-8">
                <div className="text-center">
                  <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${
                    actionType === "approve" 
                      ? "bg-gradient-to-br from-green-100 to-emerald-100" 
                      : "bg-gradient-to-br from-red-100 to-rose-100"
                  }`}>
                    {actionType === "approve" ? (
                      <svg
                        className="h-8 w-8 text-green-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-8 w-8 text-red-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <h3
                    className="text-2xl font-bold text-gray-900 mb-4"
                    id="modal-title"
                  >
                    {actionType === "approve"
                      ? "Approve Application"
                      : "Reject Application"}
                  </h3>
                  <p className="text-gray-600 text-base mb-6">
                    {actionType === "approve"
                      ? "Are you sure you want to approve this birthcare application? This will allow the owner to access all birthcare management features."
                      : "Are you sure you want to reject this birthcare application? Please provide a reason for the rejection."}
                  </p>

                  {actionType === "reject" && (
                    <div className="mb-6 text-left">
                      <label
                        htmlFor="reason"
                        className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider"
                      >
                        Rejection Reason{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="reason"
                        name="reason"
                        rows={4}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-[#BF3853] focus:border-[#BF3853] sm:text-sm p-3"
                        placeholder="Please explain why this application is being rejected"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Action message */}
                  {actionMessage.text && (
                    <div
                      className={`mb-6 p-4 rounded-lg ${
                        actionMessage.type === "success"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {actionMessage.text}
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      onClick={handleApplicationAction}
                      className={`flex-1 py-3 px-6 font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#923649] text-white ${isSubmitting || (actionType === "reject" && !rejectionReason.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={
                        isSubmitting ||
                        (actionType === "reject" && !rejectionReason.trim())
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : actionType === "approve" ? (
                        "Confirm Approval"
                      ) : (
                        "Confirm Rejection"
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={closeActionModal}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#923649] text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {showDocumentModal && selectedDocument && (
          <div
            className="fixed z-50 inset-0 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
              <div
                className="fixed inset-0 backdrop-blur-md bg-gray-900/50 transition-opacity"
                aria-hidden="true"
                onClick={closeDocumentViewer}
              ></div>
              <div className="relative bg-white rounded-2xl shadow-2xl transform transition-all max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39] flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    {selectedDocument.document_type}
                  </h3>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-white hover:bg-white/20 focus:outline-none transition-colors"
                    onClick={closeDocumentViewer}
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <div className="h-[70vh] overflow-hidden border border-gray-200 rounded-xl bg-gray-50">
                    {/* Image preview */}
                    {/\.(jpeg|jpg|gif|png|webp)$/i.test(selectedDocument.document_path || selectedDocument.url) ? (
                      <img
                        src={selectedDocument.url}
                        alt={selectedDocument.document_type}
                        className="w-full h-full object-contain"
                      />
                    ) : /\.pdf$/i.test(selectedDocument.document_path || selectedDocument.url) ? (
                      // PDF preview
                      <iframe
                        src={`${selectedDocument.url}#toolbar=1&navpanes=0&scrollbar=1`}
                        title={selectedDocument.document_type}
                        className="w-full h-full"
                      />
                    ) : (
                      // Fallback for unsupported types
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-full flex items-center justify-center mb-4">
                          <svg
                            className="h-10 w-10 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-2">Preview Unavailable</p>
                        <p className="text-sm text-gray-500">Please download the document to view its contents.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    <Button
                      type="button"
                      onClick={() => downloadDocument(selectedDocument)}
                      className="w-full bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#923649] text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      <svg className="h-5 w-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Document
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

      )}

      {/* Review Modal */}
      {showReviewModal && reviewApplication && (
        <div
          className="fixed z-50 inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            <div
              className="fixed inset-0 backdrop-blur-md transition-opacity"
              aria-hidden="true"
              onClick={closeReviewModal}
            ></div>
            <div className="relative bg-white rounded-xl shadow-2xl transform transition-all max-w-6xl w-full max-h-[95vh] overflow-hidden">
              <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {reviewApplication.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v6h6v-6M8 11V8a2 2 0 012-2h4a2 2 0 012 2v3M8 19h8" />
                        </svg>
                        Submitted {formatDate(reviewApplication.created_at)}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(reviewApplication.status)}`}>
                        {reviewApplication.status.charAt(0).toUpperCase() + reviewApplication.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                    onClick={closeReviewModal}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
                  {/* Application Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Owner Information Card */}
                    <div className="lg:col-span-1">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Owner Details</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
                            <p className="text-sm font-medium text-gray-900 mt-1">{reviewApplication.user.name}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                            <p className="text-sm font-medium text-gray-900 mt-1">{reviewApplication.user.email}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</label>
                            <p className="text-sm font-medium text-gray-900 mt-1">#{reviewApplication.user.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Documents Section */}
                    <div className="lg:col-span-2">
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center mb-6">
                          <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Submitted Documents</h4>
                          <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            {reviewApplication.documents.length} files
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {reviewApplication.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="group border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200"
                              onClick={() => openDocumentViewer(doc)}
                            >
                              <div className="flex items-start">
                                <div className="p-2 bg-gray-50 rounded-lg mr-3 group-hover:bg-blue-50">
                                  <svg className="h-5 w-5 text-gray-500 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                    {doc.document_type}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-500">
                                    Click to view document
                                  </p>
                                </div>
                                <svg className="h-4 w-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decision Section */}
                  {!actionType && reviewApplication.status === "pending" && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="text-center mb-6">
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">Review Complete?</h4>
                        <p className="text-gray-600">Make your decision on this birthcare facility application</p>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => handleReviewDecision("approve")}
                          className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Approve Application
                        </button>
                        <button
                          onClick={() => handleReviewDecision("reject")}
                          className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject Application
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Info for Approved/Rejected Applications */}
                  {!actionType && reviewApplication.status !== "pending" && (
                    <div className={`rounded-xl p-6 ${
                      reviewApplication.status === "approved" 
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200" 
                        : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"
                    }`}>
                      <div className="flex items-center justify-center">
                        <div className={`p-3 rounded-full mr-4 ${
                          reviewApplication.status === "approved" 
                            ? "bg-green-100" 
                            : "bg-red-100"
                        }`}>
                          <svg 
                            className={`h-8 w-8 ${
                              reviewApplication.status === "approved" ? "text-green-600" : "text-red-600"
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              d={reviewApplication.status === "approved" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} 
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`text-xl font-bold ${
                            reviewApplication.status === "approved" ? "text-green-900" : "text-red-900"
                          }`}>
                            Application {reviewApplication.status === "approved" ? "Approved" : "Rejected"}
                          </h4>
                          <p className={`text-sm ${
                            reviewApplication.status === "approved" ? "text-green-700" : "text-red-700"
                          }`}>
                            This application has already been {reviewApplication.status}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Confirmation */}
                  {actionType && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {actionType === "approve" ? "Approve Application" : "Reject Application"}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {actionType === "approve"
                          ? "Are you sure you want to approve this birthcare application? This will allow the owner to access all birthcare management features."
                          : "Please provide a reason for rejecting this application."}
                      </p>
                      
                      {actionType === "reject" && (
                        <div className="mb-4">
                          <label
                            htmlFor="rejectionReason"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Rejection Reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="rejectionReason"
                            rows={3}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Please explain why this application is being rejected"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Action message */}
                      {actionMessage.text && (
                        <div
                          className={`mb-4 p-3 rounded ${
                            actionMessage.type === "success"
                              ? "bg-green-50 text-green-800"
                              : "bg-red-50 text-red-800"
                          }`}
                        >
                          {actionMessage.text}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={async () => {
                            setSelectedApplication(reviewApplication);
                            await handleApplicationAction();
                          }}
                          className={`flex-1 py-3 px-6 font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#923649] text-white ${isSubmitting || (actionType === "reject" && !rejectionReason.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={
                            isSubmitting ||
                            (actionType === "reject" && !rejectionReason.trim())
                          }
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing...
                            </>
                          ) : actionType === "approve" ? (
                            "Confirm Approval"
                          ) : (
                            "Confirm Rejection"
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setActionType("");
                            setRejectionReason("");
                            setActionMessage({ type: "", text: "" });
                          }}
                          className="flex-1 py-3 px-6 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#923649] text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
