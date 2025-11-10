"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "@/lib/axios";
import { 
  TrashIcon, 
  XMarkIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const UserManagement = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirm_password: "",
    system_role_id: 2, // Default to Owner role
    is_active: true,
    contact_number: "",
    address: "",
    date_of_birth: "",
    gender: "",
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // System roles
  const systemRoles = [
    { id: 1, name: "Administrator", description: "Full system access" },
    { id: 2, name: "Owner", description: "Facility owner" },
    { id: 3, name: "Staff", description: "Facility staff member" },
  ];


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to load users. Please try again.",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      const response = await axios.post('/api/admin/users', userData);
      const newUser = response.data.user || response.data;
      setUsers([...users, newUser]);
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await axios.put(`/api/admin/users/${userId}`, userData);
      const updatedUser = response.data.user || response.data;
      
      const updatedUsers = users.map(user => 
        user.id === userId ? updatedUser : user
      );
      setUsers(updatedUsers);
      
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };


  const toggleUserStatus = async (userId, newStatus) => {
    try {
      const response = await axios.patch(`/api/admin/users/${userId}/toggle-status`);
      const updatedUser = response.data.user;
      
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, is_active: updatedUser.is_active } : user
      );
      setUsers(updatedUsers);
      
      setMessage({
        type: "success",
        text: response.data.message,
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error updating user status:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update user status. Please try again.",
      });
    }
  };

  // Filter and search users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "" || user.system_role_id.toString() === roleFilter;
    const matchesStatus = statusFilter === "" || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFormData({
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      confirm_password: "",
      system_role_id: 2,
      is_active: true,
      contact_number: "",
      address: "",
      date_of_birth: "",
      gender: "",
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      password: "",
      confirm_password: "",
      system_role_id: user.system_role_id,
      is_active: user.is_active,
      contact_number: user.contact_number || "",
      address: user.address || "",
      date_of_birth: user.date_of_birth || "",
      gender: user.gender || "",
    });
    setFormErrors({});
    setShowEditModal(true);
    document.body.style.overflow = 'hidden';
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
    document.body.style.overflow = 'hidden';
  };


  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedUser(null);
    resetForm();
    document.body.style.overflow = 'unset';
  };

  const validateForm = (isEdit = false) => {
    const errors = {};
    
    if (!formData.firstname.trim()) errors.firstname = "First name is required";
    if (!formData.lastname.trim()) errors.lastname = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!isEdit && !formData.password) errors.password = "Password is required";
    else if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (formData.password && formData.password !== formData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    
    if (formData.contact_number && !/^[+]?[\d\s\-()]+$/.test(formData.contact_number)) {
      errors.contact_number = "Please enter a valid contact number";
    }
    
    if (formData.email && users.length > 0) {
      const emailExists = users.some(user => 
        user.email === formData.email && 
        (!selectedUser || user.id !== selectedUser.id)
      );
      if (emailExists) errors.email = "Email already exists";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm(!!selectedUser)) return;
    
    setIsSubmitting(true);
    
    try {
      const userData = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.trim(),
        system_role_id: parseInt(formData.system_role_id),
        is_active: formData.is_active,
        contact_number: formData.contact_number?.trim() || null,
        address: formData.address.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
      };
      
      if (formData.password) {
        userData.password = formData.password;
      }
      
      if (selectedUser) {
        // Edit existing user
        await updateUser(selectedUser.id, userData);
        setMessage({
          type: "success",
          text: "User updated successfully!",
        });
      } else {
        // Create new user
        await createUser(userData);
        setMessage({
          type: "success",
          text: "User created successfully!",
        });
      }
      
      closeAllModals();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error saving user:", error);
      setFormErrors({
        submit: error.response?.data?.message || "Failed to save user. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const getRoleName = (roleId) => {
    const role = systemRoles.find(r => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case 1: return "bg-purple-100 text-purple-800";
      case 2: return "bg-blue-100 text-blue-800";
      case 3: return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading users...</p>
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
                  USER MANAGEMENT
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage system users, roles, and permissions
                </p>
              </div>
          
            {/* Alert Messages */}
            {message.text && (
              <div className={`mb-6 p-6 rounded-xl border-0 shadow-lg ${
                message.type === "success" 
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200"
                  : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border border-red-200"
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    message.type === "success" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    <svg className={`h-5 w-5 ${message.type === "success" ? "text-green-600" : "text-red-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={message.type === "success" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                    </svg>
                  </div>
                  <span className="font-semibold">{message.text}</span>
                </div>
              </div>
          )}

          {/* Filters and Actions */}
          <div className="bg-white rounded-xl shadow-lg border-0 p-6 mb-8 transform hover:shadow-xl transition-all duration-300">
            <div className="px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39] -mx-6 -mt-6 mb-6 rounded-t-xl">
              <h2 className="text-xl font-bold text-white">
                Search & Filter Users
              </h2>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] w-full md:w-80 shadow-sm"
                  />
                </div>
                
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] shadow-sm"
                >
                  <option value="">All Roles</option>
                  {systemRoles.map(role => (
                    <option key={role.id} value={role.id.toString()}>{role.name}</option>
                  ))}
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] shadow-sm"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

            </div>
          </div>

          {/* Users Cards */}
          <div className="space-y-6">
            {paginatedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedUsers.map((user) => (
                  <div key={user.id} className="bg-white rounded-xl shadow-lg border-0 p-6 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl">
                    {/* User Header */}
                    <div className="flex items-center mb-4">
                      <div className="h-14 w-14 flex-shrink-0">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {user.firstname.charAt(0)}{user.lastname.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="text-lg font-bold text-gray-900">
                          {user.firstname} {user.lastname}
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.email}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getRoleColor(user.system_role_id)}`}>
                          {getRoleName(user.system_role_id)}
                        </span>
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg p-4 mb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Status:</span>
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          user.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {user.system_role_id !== 1 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-600">Facility:</span>
                          <span className="text-sm text-gray-900 font-medium">
                            {user.birth_care?.name || user.birthCareStaff?.birthCare?.name || "-"}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-between items-center space-x-2">
                      <button
                        onClick={() => openViewModal(user)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:from-gray-200 hover:to-gray-300 transform hover:scale-105 transition-all duration-200"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id, !user.is_active)}
                        className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-lg transform hover:scale-105 transition-all duration-200 ${
                          user.is_active 
                            ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 hover:from-yellow-200 hover:to-orange-200" 
                            : "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200"
                        }`}
                        title={user.is_active ? "Deactivate User" : "Activate User"}
                      >
                        <ShieldCheckIcon className="h-4 w-4 mr-2" />
                        {user.is_active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                ))}
  

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white rounded-xl shadow-lg border-0 px-6 py-4 flex items-center justify-between mt-8">
                  <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg px-4 py-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Showing{" "}
                      <span className="font-bold text-[#BF3853]">
                        {startIndex + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold text-[#BF3853]">
                        {Math.min(startIndex + itemsPerPage, filteredUsers.length)}
                      </span>{" "}
                      of <span className="font-bold text-[#BF3853]">{filteredUsers.length}</span> users
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gradient-to-r from-[#FDB3C2] to-[#F891A5] text-white font-semibold rounded-lg shadow-lg hover:from-[#BF3853] hover:to-[#A41F39] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Previous
                    </button>
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transform transition-all duration-200 ${
                            page === currentPage
                              ? "bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white shadow-lg scale-110"
                              : "bg-white text-[#BF3853] border border-[#FDB3C2] hover:bg-gradient-to-r hover:from-[#FDB3C2] hover:to-[#F891A5] hover:text-white hover:scale-105"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gradient-to-r from-[#FDB3C2] to-[#F891A5] text-white font-semibold rounded-lg shadow-lg hover:from-[#BF3853] hover:to-[#A41F39] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border-0 p-12">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserIcon className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Users Found</h3>
                  <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                    {searchTerm || roleFilter || statusFilter 
                      ? "No users match your current search criteria. Try adjusting your filters." 
                      : "Get started by adding your first user to the system."}
                  </p>
                  {!searchTerm && !roleFilter && !statusFilter && (
                    <button
                      onClick={openCreateModal}
                      className="px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white rounded-lg hover:from-[#A41F39] hover:to-[#923649] focus:ring-2 focus:ring-[#BF3853]/50 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                    >
                      Add First User
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>
      {/* Create/Edit User Modal */}

      {/* View User Modal */}
      {showViewModal && selectedUser && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={closeAllModals}
        >
          <div 
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                User Details
              </h3>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* User Profile */}
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                  {selectedUser.firstname.charAt(0)}{selectedUser.lastname.charAt(0)}
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedUser.firstname} {selectedUser.lastname}
                  </h2>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.system_role_id)}`}>
                      {getRoleName(selectedUser.system_role_id)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.is_active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                      <dd className="text-sm text-gray-900">{selectedUser.contact_number || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="text-sm text-gray-900">{selectedUser.address || "-"}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <dl className="space-y-3">
                    {selectedUser.system_role_id !== 1 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Facility</dt>
                        <dd className="text-sm text-gray-900">
                          {selectedUser.birth_care?.name || selectedUser.birthCareStaff?.birthCare?.name || "-"}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  </div>
  );
};

export default UserManagement;