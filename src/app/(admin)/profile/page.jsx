"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth.jsx";
import axios from "@/lib/axios";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const ProfilePage = () => {
  const { user, mutate } = useAuth({ middleware: "auth" });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contact_number: "",
    address: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        email: user.email || "",
        contact_number: user.contact_number || "",
        address: user.address || "",
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setLoading(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstname.trim()) {
      errors.firstname = "First name is required";
    }

    if (!formData.lastname.trim()) {
      errors.lastname = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.contact_number && !/^[+]?[\d\s\-()]+$/.test(formData.contact_number)) {
      errors.contact_number = "Please enter a valid contact number";
    }

    // Password validation (only if trying to change password)
    if (formData.new_password || formData.current_password || formData.confirm_password) {
      if (!formData.current_password) {
        errors.current_password = "Current password is required to change password";
      }
      
      if (!formData.new_password) {
        errors.new_password = "New password is required";
      } else if (formData.new_password.length < 8) {
        errors.new_password = "Password must be at least 8 characters";
      }

      if (formData.new_password !== formData.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const updateData = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.trim(),
        contact_number: formData.contact_number?.trim() || null,
        address: formData.address.trim(),
      };

      // Only include password fields if they're filled
      if (formData.new_password) {
        updateData.current_password = formData.current_password;
        updateData.password = formData.new_password;
        updateData.password_confirmation = formData.confirm_password;
      }

      await axios.put("/api/user/profile", updateData);

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }));

      setIsEditing(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        email: user.email || "",
        contact_number: user.contact_number || "",
        address: user.address || "",
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    }
    setFormErrors({});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-600 text-lg">
            Manage your personal information and account settings
          </p>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div
            className={`mb-6 p-6 rounded-xl border-0 shadow-lg ${
              message.type === "success"
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg mr-3 ${
                  message.type === "success" ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                )}
              </div>
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
          {/* Profile Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39]">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-full bg-white/30 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user?.firstname?.charAt(0) || "U"}
                  {user?.lastname?.charAt(0) || ""}
                </div>
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-white">
                    {user?.firstname} {user?.lastname}
                  </h2>
                  <p className="text-white/90 font-medium">{user?.email}</p>
                  <span className="inline-flex mt-2 px-3 py-1 text-xs font-bold rounded-full bg-white/20 text-white">
                    {user?.system_role_id === 1 ? "Administrator" : user?.system_role_id === 2 ? "Owner" : "Staff"}
                  </span>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-white text-[#BF3853] rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-[#BF3853]" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] ${
                        !isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                      } ${formErrors.firstname ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.firstname && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.firstname}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] ${
                        !isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                      } ${formErrors.lastname ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.lastname && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.lastname}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-[#BF3853]" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] ${
                        !isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                      } ${formErrors.email ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <PhoneIcon className="h-4 w-4 inline mr-1" />
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="e.g., +1234567890"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] ${
                        !isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                      } ${formErrors.contact_number ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.contact_number && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.contact_number}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPinIcon className="h-4 w-4 inline mr-1" />
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] ${
                        !isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                      } ${formErrors.address ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.address && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Section - Only show when editing */}
              {isEditing && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <KeyIcon className="h-5 w-5 mr-2 text-[#BF3853]" />
                    Change Password (Optional)
                  </h3>
                  <div className="grid grid-cols-1 gap-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="current_password"
                        value={formData.current_password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] ${
                          formErrors.current_password ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {formErrors.current_password && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.current_password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="new_password"
                        value={formData.new_password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] ${
                          formErrors.new_password ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {formErrors.new_password && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.new_password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BF3853] focus:border-[#BF3853] ${
                          formErrors.confirm_password ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {formErrors.confirm_password && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.confirm_password}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 shadow-sm hover:shadow transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white rounded-lg hover:from-[#A41F39] hover:to-[#923649] focus:ring-2 focus:ring-[#BF3853]/50 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Account Information Card */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border-0 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.birth_care && user?.system_role_id !== 1 && (
              <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg p-4">
                <dt className="text-sm font-semibold text-gray-600 flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  Facility
                </dt>
                <dd className="text-sm text-gray-900 font-medium mt-1">
                  {user.birth_care.name}
                </dd>
              </div>
            )}
            <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg p-4">
              <dt className="text-sm font-semibold text-gray-600">Member Since</dt>
              <dd className="text-sm text-gray-900 font-medium mt-1">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "-"}
              </dd>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg p-4">
              <dt className="text-sm font-semibold text-gray-600">Account Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                  user?.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {user?.is_active ? "Active" : "Inactive"}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
