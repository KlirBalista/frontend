"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import Button from "@/components/Button";
import Input from "@/components/Input";
import RoleModal from "./components/RoleModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import { useAuth } from "@/hooks/auth";
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const RolePage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
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

  // Fetch roles and permissions on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [rolesResponse, permissionsResponse] = await Promise.all([
          axios.get(`/api/birthcare/${birthcare_Id}/roles`),
          axios.get("/api/permissions"),
        ]);

        // Transform backend role_name to name for frontend consistency
        const formattedRoles = rolesResponse.data.map((role) => ({
          ...role,
          name: role.name || role.role_name,
        }));

        setRoles(formattedRoles);
        setPermissions(permissionsResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load roles and permissions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [birthcare_Id]);

  // Create a new role
  const handleCreateRole = async (roleData) => {
    try {
      const requestData = {
        ...roleData,
        role_name: roleData.name,
      };

      const response = await axios.post(
        `/api/birthcare/${birthcare_Id}/roles`,
        requestData
      );
      const formattedRole = {
        ...response.data,
        name: response.data.name || response.data.role_name,
      };

      setRoles([...roles, formattedRole]);
      setShowRoleModal(false);
    } catch (err) {
      console.error("Error creating role:", err);
      return { error: err.response?.data?.message || "Failed to create role" };
    }
  };

  // Update an existing role
  const handleUpdateRole = async (roleData) => {
    try {
      const requestData = {
        ...roleData,
        role_name: roleData.name,
      };

      const response = await axios.put(
        `/api/birthcare/${birthcare_Id}/roles/${currentRole.id}`,
        requestData
      );

      const formattedRole = {
        ...response.data,
        name: response.data.name || response.data.role_name,
      };

      setRoles(
        roles.map((role) => (role.id === currentRole.id ? formattedRole : role))
      );

      setShowRoleModal(false);
    } catch (err) {
      console.error("Error updating role:", err);
      return { error: err.response?.data?.message || "Failed to update role" };
    }
  };

  // Delete a role
  const handleDeleteRole = async () => {
    try {
      await axios.delete(
        `/api/birthcare/${birthcare_Id}/roles/${currentRole.id}`
      );
      setRoles(roles.filter((role) => role.id !== currentRole.id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error deleting role:", err);
      setError("Failed to delete role. Please try again.");
    }
  };

  // Open modal for creating a new role
  const openCreateModal = () => {
    setCurrentRole(null);
    setShowRoleModal(true);
  };

  // Open modal for editing an existing role
  const openEditModal = (role) => {
    setCurrentRole(role);
    setShowRoleModal(true);
  };

  // Open confirmation modal for deleting a role
  const openDeleteModal = (role) => {
    setCurrentRole(role);
    setShowDeleteModal(true);
  };

  // Handle blur effect when modals are open
  useEffect(() => {
    const appLayout = document.getElementById('app-layout');
    if (!appLayout) return;

    if (showRoleModal || showDeleteModal) {
      appLayout.style.filter = 'blur(4px)';
      appLayout.style.pointerEvents = 'none';
      document.body.style.overflow = 'hidden';
    } else {
      appLayout.style.filter = 'none';
      appLayout.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }

    return () => {
      appLayout.style.filter = 'none';
      appLayout.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, [showRoleModal, showDeleteModal]);

  // Filter roles based on search term
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return null;
  }

  // Unauthorized: not role 2 and not role 3 with manage_role
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 || !user.permissions?.includes("manage_role"))
  ) {
    return <div>Unauthorized</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">ROLE MANAGEMENT</h1>
              <p className="text-sm text-gray-600 mt-1">Manage staff roles and permissions</p>
            </div>
            <button
              onClick={openCreateModal}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add New Role</span>
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
                placeholder="Search roles by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[#BF3853] font-medium">
              {filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'}
            </p>
          </div>

          {/* Role Table */}
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BF3853] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading roles...</p>
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
          ) : filteredRoles.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Role Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Permissions</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map((permission) => (
                              <span
                                key={permission.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDB3C2] text-[#A41F39]"
                              >
                                {permission.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(role)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Edit Role"
                            >
                              <PencilIcon className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(role)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-lg hover:opacity-90 transition-opacity"
                              title="Delete Role"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
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
                <UserGroupIcon className="h-8 w-8 text-[#BF3853]" />
              </div>
              <p className="text-lg font-semibold text-gray-700">No Roles Found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm ? 'No roles match your search criteria.' : 'Add a new role to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showRoleModal && (
        <RoleModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          onSubmit={currentRole ? handleUpdateRole : handleCreateRole}
          role={currentRole}
          permissions={permissions}
          isEdit={!!currentRole}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteRole}
          roleName={currentRole?.name}
        />
      )}
    </>
  );
};

export default RolePage;
