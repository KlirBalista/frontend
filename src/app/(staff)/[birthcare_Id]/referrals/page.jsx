"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";
import { Trash2, Edit3, Search, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import PatientReferralModal from "@/components/PatientReferralModal";
import CustomDialog from "@/components/CustomDialog";

const ReferralsPage = () => {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: '', title: '', message: '' });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Fetch referrals
  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage };
      
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/referrals`,
        { params }
      );
      const referralsData = response.data.data || response.data;
      const pagesTotal = response.data.last_page || response.data.meta?.last_page || 1;
      
      setReferrals(referralsData);
      setTotalPages(pagesTotal);
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && birthcare_Id) {
      fetchReferrals();
    }
  }, [user, birthcare_Id, currentPage, debouncedSearchTerm]);


  const handleDelete = async (referralId) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Referral',
      message: 'Are you sure you want to delete this referral? This action cannot be undone.',
      showCancel: true,
      onConfirm: async () => {
        try {
          await axios.delete(
            `/api/birthcare/${birthcare_Id}/referrals/${referralId}`
          );
          setDialog({
            isOpen: true,
            type: 'success',
            title: 'Success!',
            message: 'Referral deleted successfully.',
            showCancel: false
          });
          fetchReferrals(); // Refresh list
        } catch (error) {
          console.error('Delete failed:', error);
          setDialog({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to delete referral. Please try again.',
            showCancel: false
          });
        }
      }
    });
  };

  const handleReferralSubmit = async (formData) => {
    try {
      if (editingReferral) {
        await axios.put(
          `/api/birthcare/${birthcare_Id}/referrals/${editingReferral.id}`,
          formData
        );
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Referral updated successfully.',
          showCancel: false
        });
      } else {
        await axios.post(
          `/api/birthcare/${birthcare_Id}/referrals`,
          formData
        );
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Referral created successfully.',
          showCancel: false
        });
      }
      setIsModalOpen(false);
      setEditingReferral(null);
      fetchReferrals();
    } catch (error) {
      console.error('Failed to save referral:', error);
      throw new Error(error.response?.data?.message || 'Failed to save referral');
    }
  };

  const handleEdit = (referral) => {
    setEditingReferral(referral);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReferral(null);
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
      !user.permissions?.includes("manage_referrals"))
  ) {
    return <div>Unauthorized</div>;
  }

  if (loading && referrals.length === 0) {
    return (
      <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#F891A5] min-h-[calc(100vh-4rem)]">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BF3853]"></div>
              <span className="ml-2 text-[#A41F39] font-semibold">Loading referrals...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PATIENT REFERRALS</h1>
              <p className="text-sm text-gray-500 mt-1">Manage patient referrals and download referral documents</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
            >
              <UserPlus size={20} />
              <span>Create Referral</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-6 overflow-hidden">
          <div className="p-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search referrals by patient name or facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent transition-all duration-200 bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Results Info */}
          <div className="px-6 py-5 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDB3C2]/20 text-[#BF3853] font-semibold">
                    {referrals.length} referrals
                  </span>
                  {debouncedSearchTerm && <span className="ml-2 text-gray-500"> matching "{debouncedSearchTerm}"</span>}
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

          {/* Table */}
          <div className="flex-1 overflow-hidden">
            {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-full flex items-center justify-center shadow-lg">
                    <svg className="h-12 w-12 text-[#A41F39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-[#A41F39]">No referrals found</h3>
                  <p className="mt-1 text-sm text-[#BF3853]">
                    {searchTerm ? "Try adjusting your search criteria." : "Get started by creating a new referral."}
                  </p>
                </div>
            ) : (
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
                        From
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 min-w-32">
                        To
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30 w-32">
                        Date
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 divide-y divide-gray-200">
                    {referrals.map((referral, index) => (
                      <tr key={referral.id} className="hover:bg-[#FDB3C2]/10 transition-colors duration-150">
                        <td className="px-4 py-4 text-center text-sm text-gray-900 font-medium">
                          {(currentPage - 1) * 10 + index + 1}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-bold text-[#A41F39]">
                            {referral.patient ? `${referral.patient.first_name} ${referral.patient.middle_name || ''} ${referral.patient.last_name}`.trim() : 'Unknown Patient'}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm text-gray-900">{referral.referring_facility}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm text-gray-900">{referral.receiving_facility}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#FDB3C2] to-[#F891A5] text-[#A41F39]">
                            {new Date(referral.referral_date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(referral)}
                              className="p-2 bg-gradient-to-r from-[#E56D85] to-[#BF3853] hover:from-[#BF3853] hover:to-[#A41F39] text-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-lg"
                              title="Edit Referral"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(referral.id)}
                              className="p-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#BF3853] text-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-lg"
                              title="Delete Referral"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/20">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        <PatientReferralModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleReferralSubmit}
          birthcare_Id={birthcare_Id}
          editData={editingReferral}
        />

        {/* Custom Dialog */}
        <CustomDialog
          isOpen={dialog.isOpen}
          onClose={() => setDialog({ ...dialog, isOpen: false })}
          onConfirm={dialog.onConfirm}
          type={dialog.type}
          title={dialog.title}
          message={dialog.message}
          showCancel={dialog.showCancel}
        />
      </div>
    </div>
  );
};

export default ReferralsPage;
