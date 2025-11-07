"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Label from "@/components/Label";
import InputError from "@/components/InputError";
import { XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

/**
 * Modal component for creating and editing roles
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onSubmit - Function to handle form submission
 * @param {Object} props.role - Role data for editing (null for create)
 * @param {Array} props.permissions - List of all available permissions
 * @param {boolean} props.isEdit - Whether this is an edit operation
 */
const RoleModal = ({
  isOpen,
  onClose,
  onSubmit,
  role,
  permissions,
  isEdit,
}) => {
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with role data if editing
  useEffect(() => {
    if (role) {
      setName(role.name || "");
      setSelectedPermissions(
        role.permissions?.map((permission) => permission.id) || []
      );
    } else {
      // Reset form for creation
      setName("");
      setSelectedPermissions([]);
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    let hasErrors = false;
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Role name is required";
      hasErrors = true;
    }

    if (selectedPermissions.length === 0) {
      newErrors.permissions = "At least one permission must be selected";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const result = await onSubmit({
      name,
      permissions: selectedPermissions,
    });

    if (result?.error) {
      setErrors({ submit: result.error });
      setIsSubmitting(false);
    }
  };

  // Toggle permission selection
  const togglePermission = (permissionId) => {
    setSelectedPermissions((prevSelected) => {
      if (prevSelected.includes(permissionId)) {
        return prevSelected.filter((id) => id !== permissionId);
      } else {
        return [...prevSelected, permissionId];
      }
    });
  };

  // Group permissions by category for better organization
  const groupPermissionsByCategory = () => {
    const groups = {};

    permissions.forEach((permission) => {
      // Extract category from permission name (e.g., "user.create" -> "user")
      const category = permission.name.split(".")[0];

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(permission);
    });

    return groups;
  };

  const permissionGroups = groupPermissionsByCategory();

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold">
              {isEdit ? "Edit Role" : "Create New Role"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Role name input */}
            <div className="mb-6">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">Role Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                placeholder="Enter role name..."
                disabled={isSubmitting}
              />
              {errors.name && <InputError message={errors.name} className="mt-1" />}
            </div>

            {/* Permissions section */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">Permissions *</Label>
              {errors.permissions && (
                <InputError message={errors.permissions} className="mb-3" />
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-80 overflow-y-auto">
                {Object.entries(permissionGroups).map(([category, perms]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-[#BF3853] rounded-full"></div>
                      <h4 className="font-semibold text-[#A41F39] capitalize text-sm">
                        {category.replace('_', ' ')}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2 ml-4">
                      {perms.map((permission) => (
                        <label 
                          key={permission.id} 
                          className="flex items-center p-2 rounded-lg hover:bg-white transition-colors cursor-pointer group"
                          htmlFor={`permission-${permission.id}`}
                        >
                          <input
                            type="checkbox"
                            id={`permission-${permission.id}`}
                            checked={selectedPermissions.includes(
                              permission.id
                            )}
                            onChange={() => togglePermission(permission.id)}
                            className="h-4 w-4 text-[#BF3853] focus:ring-[#BF3853] border-gray-300 rounded transition-colors"
                            disabled={isSubmitting}
                          />
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                            {permission.name.replace(/_/g, ' ')}
                          </span>
                          {selectedPermissions.includes(permission.id) && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 bg-[#BF3853] rounded-full"></div>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Selected permissions count */}
              <div className="mt-3 text-sm text-[#BF3853] font-medium">
                {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
              </div>
            </div>

            {errors.submit && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                  {errors.submit}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-xl hover:shadow-lg hover:shadow-[#BF3853]/30 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                isEdit ? "Update Role" : "Create Role"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RoleModal;
