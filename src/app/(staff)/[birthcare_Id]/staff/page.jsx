"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import Button from "@/components/Button";
import Input from "@/components/Input";
import StaffModal from "./components/StaffModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import { useAuth } from "@/hooks/auth";
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from "@heroicons/react/24/outline";

const StaffPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Debug logs
  if (user) {
    console.log("User data:", {
      system_role_id: user.system_role_id,
      permissions: user.permissions,
    });

    // Debug logs for staff
    if (user.system_role_id === 3) {
      console.log("TEST");
      console.log(user.permissions);
    }
  }

  // Fetch staff and roles on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [staffResponse, rolesResponse] = await Promise.all([
          axios.get(`/api/birthcare/${birthcare_Id}/staff`),
          axios.get(`/api/birthcare/${birthcare_Id}/roles`),
        ]);

        setStaff(staffResponse.data);
        setRoles(rolesResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load staff and roles. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [birthcare_Id]);

  // Effect to add/remove blur effect to entire app layout
  useEffect(() => {
    const appLayout = document.getElementById('app-layout');
    const anyModalOpen = showStaffModal || showDeleteModal;
    
    if (anyModalOpen && appLayout) {
      appLayout.style.filter = 'blur(4px)';
      appLayout.style.pointerEvents = 'none';
      document.body.style.overflow = 'hidden';
    } else if (appLayout) {
      appLayout.style.filter = 'none';
      appLayout.style.pointerEvents = 'auto';
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      if (appLayout) {
        appLayout.style.filter = 'none';
        appLayout.style.pointerEvents = 'auto';
        document.body.style.overflow = 'unset';
      }
    };
  }, [showStaffModal, showDeleteModal]);

  // Create a new staff member
  const handleCreateStaff = async (staffData) => {
    try {
      const response = await axios.post(
        `/api/birthcare/${birthcare_Id}/staff`,
        staffData
      );

      setStaff([...staff, response.data]);
      setShowStaffModal(false);
      return { success: true };
    } catch (err) {
      console.error("Error creating staff:", err);
      return {
        error:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to create staff member",
      };
    }
  };

  // Update an existing staff member
  const handleUpdateStaff = async (staffData) => {
    try {
      const response = await axios.put(
        `/api/birthcare/${birthcare_Id}/staff/${currentStaff.id}`,
        staffData
      );

      setStaff(
        staff.map((s) => (s.id === currentStaff.id ? response.data : s))
      );

      setShowStaffModal(false);
      return { success: true };
    } catch (err) {
      console.error("Error updating staff:", err);
      return {
        error:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to update staff member",
      };
    }
  };

  // Delete a staff member
  const handleDeleteStaff = async () => {
    try {
      await axios.delete(
        `/api/birthcare/${birthcare_Id}/staff/${currentStaff.id}`
      );
      setStaff(staff.filter((s) => s.id !== currentStaff.id));
      setShowDeleteModal(false);
      return { success: true };
    } catch (err) {
      console.error("Error deleting staff:", err);
      setError("Failed to delete staff member. Please try again.");
      return { error: "Failed to delete staff member" };
    }
  };

  // Open modal for creating a new staff member
  const openCreateModal = () => {
    setCurrentStaff(null);
    setShowStaffModal(true);
  };

  // Open modal for editing an existing staff member
  const openEditModal = (staffMember) => {
    setCurrentStaff(staffMember);
    setShowStaffModal(true);
  };

  // Open confirmation modal for deleting a staff member
  const openDeleteModal = (staffMember) => {
    setCurrentStaff(staffMember);
    setShowDeleteModal(true);
  };

  // Filter staff based on search term
  const filteredStaff = staff.filter(
    (staffMember) =>
      staffMember.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.contact_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return null;
  }

  // Unauthorized: not role 2 and not role 3 with manage_staff
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 || !user.permissions?.includes("manage_staff"))
  ) {
    return <div>Unauthorized</div>;
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading facility staff...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 my-4">
        <p>{error}</p>
        <Button
          className="mt-2 bg-red-600 hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">STAFF MANAGEMENT</h1>
              <p className="text-sm text-gray-600 mt-1">Manage staff members and their assignments</p>
            </div>
            <button
              onClick={openCreateModal}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add New Staff</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search staff by name, email or contact number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[#BF3853] font-medium">
              {filteredStaff.length} {filteredStaff.length === 1 ? 'staff member' : 'staff members'}
            </p>
          </div>

          {/* Staff Table */}
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BF3853] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading staff...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm text-red-600 mb-3">Error: {error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-xl text-sm font-medium text-white hover:shadow-lg hover:shadow-[#BF3853]/30 transition-all duration-200 hover:scale-105"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : filteredStaff.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStaff.map((staffMember) => (
                      <tr key={staffMember.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{staffMember.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{staffMember.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{staffMember.contact_number || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {staffMember.role ? (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FDB3C2] text-[#A41F39]">
                              {staffMember.role.name}
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                              No Role
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(staffMember)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Edit Staff"
                            >
                              <PencilIcon className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(staffMember)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-lg hover:opacity-90 transition-opacity"
                              title="Remove Staff"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-[#FDB3C2] rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-8 w-8 text-[#BF3853]" />
              </div>
              <p className="text-lg font-semibold text-gray-700">No Staff Members Found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm ? 'No staff members match your search criteria.' : 'Add a new staff member to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showStaffModal && (
        <StaffModal
          isOpen={showStaffModal}
          onClose={() => setShowStaffModal(false)}
          onSubmit={currentStaff ? handleUpdateStaff : handleCreateStaff}
          staff={currentStaff}
          roles={roles}
          isEdit={!!currentStaff}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteStaff}
          staffName={currentStaff?.name}
        />
      )}
    </>
  );
};

export default StaffPage;
