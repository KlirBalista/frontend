"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Label from "@/components/Label";
import InputError from "@/components/InputError";
import { XMarkIcon, UserPlusIcon } from "@heroicons/react/24/outline";

/**
 * Modal component for creating and editing staff members
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onSubmit - Function to handle form submission
 * @param {Object} props.staff - Staff data for editing (null for create)
 * @param {Array} props.roles - List of available roles
 * @param {boolean} props.isEdit - Whether this is an edit operation
 */
const StaffModal = ({ isOpen, onClose, onSubmit, staff, roles, isEdit }) => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with staff data if editing
  useEffect(() => {
    if (staff) {
      setFirstname(staff.firstname || "");
      setLastname(staff.lastname || "");
      setMiddlename(staff.middlename || "");
      setEmail(staff.email || "");
      setContactNumber(staff.contact_number || "");
      setAddress(staff.address || "");
      setPassword(""); // Don't populate password for security
      setRoleId(staff.role?.id || "");
    } else {
      // Reset form for creation
      setFirstname("");
      setLastname("");
      setMiddlename("");
      setEmail("");
      setContactNumber("");
      setAddress("");
      setPassword("");
      setRoleId("");
    }
  }, [staff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    let hasErrors = false;
    const newErrors = {};
    
    if (!firstname.trim()) {
      newErrors.firstname = "First name is required";
      hasErrors = true;
    }
    
    if (!lastname.trim()) {
      newErrors.lastname = "Last name is required";
      hasErrors = true;
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
      hasErrors = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      hasErrors = true;
    }
    
    if (!contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
      hasErrors = true;
    }
    
    if (!roleId) {
      newErrors.roleId = "Role is required";
      hasErrors = true;
    }
    
    if (!isEdit && !password.trim()) {
      newErrors.password = "Password is required for new staff";
      hasErrors = true;
    } else if (password.trim() && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      hasErrors = true;
    }
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    const staffData = {
      firstname,
      lastname,
      middlename: middlename || null,
      email,
      contact_number: contactNumber,
      address: address || null,
      role_id: roleId,
    };
    
    // Only include password if it's provided
    if (password.trim()) {
      staffData.password = password;
    }
    
    const result = await onSubmit(staffData);
    
    if (result?.error) {
      setErrors({ submit: result.error });
      setIsSubmitting(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlusIcon className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-semibold">
              {isEdit ? "Edit Staff" : "Add Staff"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
            <div className="space-y-3">
              {/* Name Fields - Compact 2-column */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    placeholder="First name"
                    disabled={isSubmitting}
                  />
                  {errors.firstname && <div className="text-xs text-red-600 mt-1">{errors.firstname}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    placeholder="Last name"
                    disabled={isSubmitting}
                  />
                  {errors.lastname && <div className="text-xs text-red-600 mt-1">{errors.lastname}</div>}
                </div>
              </div>
              
              {/* Middle Name - Half width */}
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={middlename}
                  onChange={(e) => setMiddlename(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                  placeholder="Middle name"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${isEdit ? 'bg-gray-100' : ''}`}
                  placeholder="Email address"
                  disabled={isSubmitting || isEdit}
                />
                {errors.email && <div className="text-xs text-red-600 mt-1">{errors.email}</div>}
                {isEdit && <div className="text-xs text-gray-500 mt-1">Email cannot be changed</div>}
              </div>
              
              {/* Contact & Address - 2 column */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    placeholder="Phone number"
                    disabled={isSubmitting}
                  />
                  {errors.contactNumber && <div className="text-xs text-red-600 mt-1">{errors.contactNumber}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    placeholder="Address"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              {/* Password & Role - 2 column */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {!isEdit && '*'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    placeholder={isEdit ? "Leave blank to keep" : "Password"}
                    disabled={isSubmitting}
                  />
                  {errors.password && <div className="text-xs text-red-600 mt-1">{errors.password}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    <option value="">Select role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {errors.roleId && <div className="text-xs text-red-600 mt-1">{errors.roleId}</div>}
                </div>
              </div>
              
              {/* Error Message */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                    {errors.submit}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-lg hover:shadow-lg hover:shadow-[#BF3853]/30 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                isEdit ? "Update Staff" : "Add Staff"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default StaffModal;

