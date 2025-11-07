"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import useSWR from "swr";
import axios from "../../../lib/axios";
import { useAuth } from "../../../hooks/auth";
import LocationPicker from "../../../components/LocationPicker";
import DocumentUpload from "../../../components/DocumentUpload";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import InputError from "../../../components/InputError";

export default function RegisterBirthcare() {
  const router = useRouter();
  const { user } = useAuth({ middleware: "auth" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form setup with react-hook-form
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      location: null,
      philhealth_cert: null,
      business_permit: null,
      doh_cert: null,
    },
  });

  // Check subscription status
  const {
    data: subscription,
    error: subscriptionError,
    isLoading: isCheckingSubscription,
  } = useSWR("/api/owner/subscription", () =>
    axios
      .get("/api/owner/subscription")
      .then((res) => res.data)
      .catch((error) => {
        console.error("Error fetching subscription:", error);
        throw error;
      })
  );

  // Check if user already has a birthcare registered
  const {
    data: existingBirthcare,
    error: birthcareError,
    isLoading: isCheckingBirthcare,
  } = useSWR("/api/owner/birthcare", () =>
    axios
      .get("/api/owner/birthcare")
      .then((res) => res.data)
      .catch((error) => {
        // 404 means no birthcare found, which is expected for new registrations
        if (error.response?.status !== 404) {
          console.error("Error fetching birthcare:", error);
          throw error;
        }
        return null; // Return null for no existing birthcare
      })
  );

  // Pre-populate form with existing data if rejected
  useEffect(() => {
    if (existingBirthcare && !birthcareError) {
      if (existingBirthcare.status && existingBirthcare.status.toLowerCase() === "rejected") {
        // Pre-populate form with existing data
        setValue("name", existingBirthcare.name || "");
        setValue("description", existingBirthcare.description || "");
        if (existingBirthcare.latitude && existingBirthcare.longitude) {
          setValue("location", [parseFloat(existingBirthcare.latitude), parseFloat(existingBirthcare.longitude)]);
        }
        return;
      }
      router.push("/facility-dashboard");
    }
  }, [existingBirthcare, birthcareError, router, setValue]);

  // Handle form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError("");
    setSuccessMessage("");

    try {
      // Validate location
      if (!data.location || !Array.isArray(data.location) || data.location.length < 2) {
        setIsSubmitting(false);
        setServerError('Please pick a location on the map.');
        return;
      }

      // Create FormData object for file uploads
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("latitude", data.location[0]);
      formData.append("longitude", data.location[1]);

      // Append documents
      if (data.philhealth_cert) {
        formData.append("philhealth_cert", data.philhealth_cert);
      }

      if (data.business_permit) {
        formData.append("business_permit", data.business_permit);
      }

      if (data.doh_cert) {
        formData.append("doh_cert", data.doh_cert);
      }

      // Ensure CSRF cookie is set for Sanctum
      await axios.get('/sanctum/csrf-cookie');

      // Submit the form
      const response = await axios.post(
        "/api/owner/register-birthcare",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccessMessage(
        "Your birthcare facility has been registered successfully and is pending approval."
      );

      // Redirect after a delay to allow the user to see the success message
      setTimeout(() => {
        router.push("/facility-dashboard");
      }, 3000);
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError(
          "An error occurred during registration. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has an active subscription
  const hasActiveSubscription = subscription?.status === "active";

  // Loading state
  if (isCheckingSubscription || isCheckingBirthcare) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Comment out subscription check temporarily for debugging
  // Allow registration regardless of subscription status for now
  // This will be handled by backend logic to assign free trial
  /*
  if (!hasActiveSubscription && !subscriptionError) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-center text-center">
                <svg
                  className="h-8 w-8 text-yellow-500 mr-2 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900">
                  Subscription Required
                </h2>
              </div>
            </div>
            <div className="px-6 py-8">
              <div className="text-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="text-yellow-800 mb-4">
                    You need an active subscription to register a birthcare facility.
                  </p>
                  <Button
                    onClick={() => router.push("/subscription")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Subscribe Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  */

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 py-6">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#BF3853] via-[#E56D85] to-[#F891A5] px-6 py-6">
            <div className="flex items-center justify-center text-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-lg rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">
                Register Your Birthcare Facility
              </h1>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-6 py-6 bg-gradient-to-b from-gray-50 to-white">
            <div className="mx-auto">

      {/* If previous registration was rejected, show guidance banner */}
      {existingBirthcare?.status?.toLowerCase() === "rejected" && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">
                Your previous facility registration was rejected. Please review your details and resubmit a new application below.
              </p>
              {existingBirthcare.rejection_reason && (
                <p className="text-sm text-red-600 mt-1 italic">
                  Reason: {existingBirthcare.rejection_reason}
                </p>
              )}
            </div>
          </div>
          
          {/* Show existing documents */}
          {existingBirthcare.documents && existingBirthcare.documents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-sm font-medium text-red-700 mb-2">Current Documents:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {existingBirthcare.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white rounded p-2 border border-red-200">
                    <span className="text-xs text-gray-700">{doc.document_type}</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-2">Note: Upload new documents below to replace these.</p>
            </div>
          )}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-400 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Server error message */}
      {serverError && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-red-700 font-medium">{serverError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Facility Information */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Facility Information
            </h2>
          </div>

          <div className="space-y-4">
            {/* Facility Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Facility Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                {...register("name", {
                  required: "Facility name is required",
                  maxLength: {
                    value: 100,
                    message: "Facility name must be less than 100 characters",
                  },
                })}
                className="mt-1 block w-full"
              />
              <InputError
                messages={errors.name ? [errors.name.message] : []}
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                {...register("description", {
                  maxLength: {
                    value: 500,
                    message: "Description must be less than 500 characters",
                  },
                })}
                className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-all duration-200 focus:border-[#BF3853] focus:ring-4 focus:ring-[#FDB3C2]/20 focus:outline-none hover:border-gray-300 resize-none"
              />
              <InputError
                messages={
                  errors.description ? [errors.description.message] : []
                }
                className="mt-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                Briefly describe your facility and the services offered.
              </p>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-500 rounded-lg">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Facility Location <span className="text-red-500">*</span>
            </h2>
          </div>

          <Controller
            name="location"
            control={control}
            rules={{ required: "Please select a location on the map" }}
            render={({ field }) => (
              <LocationPicker
                value={field.value}
                onChange={field.onChange}
                error={errors.location?.message}
              />
            )}
          />
        </div>

        {/* Documents Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Required Documents
            </h2>
          </div>

          <div className="space-y-6">
            {/* PhilHealth Accreditation (Optional) */}
            <Controller
              name="philhealth_cert"
              control={control}
              render={({ field }) => (
                <DocumentUpload
                  label="PhilHealth Accreditation Certificate"
                  name="philhealth_cert"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.philhealth_cert?.message}
                  required={false}
                  accept="application/pdf,image/jpeg,image/png"
                />
              )}
            />

            {/* Business Permit */}
            <Controller
              name="business_permit"
              control={control}
              rules={existingBirthcare?.status?.toLowerCase() === 'rejected' ? {} : { required: "Business Permit is required" }}
              render={({ field }) => (
                <DocumentUpload
                  label="Business Permit from Local Government Unit (LGU)"
                  name="business_permit"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.business_permit?.message}
                  required={existingBirthcare?.status?.toLowerCase() !== 'rejected'}
                  accept="application/pdf,image/jpeg,image/png"
                />
              )}
            />

            {/* DOH Certificate */}
            <Controller
              name="doh_cert"
              control={control}
              rules={existingBirthcare?.status?.toLowerCase() === 'rejected' ? {} : { required: "DOH Certificate is required" }}
              render={({ field }) => (
                <DocumentUpload
                  label="DOH Certificate of Compliance"
                  name="doh_cert"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.doh_cert?.message}
                  required={existingBirthcare?.status?.toLowerCase() !== 'rejected'}
                  accept="application/pdf,image/jpeg,image/png"
                />
              )}
            />
          </div>
        </div>

        {/* Submission Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700">* Required fields</p>
              <p className="mt-1 flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Your application will be reviewed by an administrator.
              </p>
            </div>

            <Button
              type="submit"
              className={`px-6 py-3 bg-gradient-to-r from-[#A41F39] to-[#BF3853] hover:from-[#923649] hover:to-[#A41F39] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {existingBirthcare?.status?.toLowerCase() === 'rejected' ? 'Resubmitting...' : 'Submitting...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {existingBirthcare?.status?.toLowerCase() === 'rejected' ? 'Resubmit Application' : 'Submit Registration'}
                </span>
              )}
            </Button>
          </div>
        </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
