"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";

const EditReferralPage = () => {
  const { birthcare_Id, id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const [referral, setReferral] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: "",
    referring_facility: "",
    referring_physician: "",
    referring_physician_contact: "",
    receiving_facility: "",
    receiving_physician: "",
    receiving_physician_contact: "",
    referral_date: "",
    referral_time: "",
    urgency_level: "routine",
    reason_for_referral: "",
    clinical_summary: "",
    current_diagnosis: "",
    relevant_history: "",
    current_medications: "",
    allergies: "",
    vital_signs: "",
    laboratory_results: "",
    imaging_results: "",
    treatment_provided: "",
    patient_condition: "",
    transportation_mode: "ambulance",
    accompanies_patient: "",
    special_instructions: "",
    equipment_required: "",
    isolation_precautions: "",
    anticipated_care_level: "",
    expected_duration: "",
    insurance_information: "",
    family_contact_name: "",
    family_contact_phone: "",
    family_contact_relationship: "",
    status: "pending",
    notes: "",
  });

  // Fetch referral data
  const fetchReferral = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/referrals/${id}`
      );
      const referralData = response.data.data || response.data;
      setReferral(referralData);
      
      // Populate form data
      setFormData({
        patient_id: referralData.patient_id || "",
        referring_facility: referralData.referring_facility || "",
        referring_physician: referralData.referring_physician || "",
        referring_physician_contact: referralData.referring_physician_contact || "",
        receiving_facility: referralData.receiving_facility || "",
        receiving_physician: referralData.receiving_physician || "",
        receiving_physician_contact: referralData.receiving_physician_contact || "",
        referral_date: referralData.referral_date || "",
        referral_time: referralData.referral_time ? referralData.referral_time.slice(0, 5) : "",
        urgency_level: referralData.urgency_level || "routine",
        reason_for_referral: referralData.reason_for_referral || "",
        clinical_summary: referralData.clinical_summary || "",
        current_diagnosis: referralData.current_diagnosis || "",
        relevant_history: referralData.relevant_history || "",
        current_medications: referralData.current_medications || "",
        allergies: referralData.allergies || "",
        vital_signs: referralData.vital_signs || "",
        laboratory_results: referralData.laboratory_results || "",
        imaging_results: referralData.imaging_results || "",
        treatment_provided: referralData.treatment_provided || "",
        patient_condition: referralData.patient_condition || "",
        transportation_mode: referralData.transportation_mode || "ambulance",
        accompanies_patient: referralData.accompanies_patient || "",
        special_instructions: referralData.special_instructions || "",
        equipment_required: referralData.equipment_required || "",
        isolation_precautions: referralData.isolation_precautions || "",
        anticipated_care_level: referralData.anticipated_care_level || "",
        expected_duration: referralData.expected_duration || "",
        insurance_information: referralData.insurance_information || "",
        family_contact_name: referralData.family_contact_name || "",
        family_contact_phone: referralData.family_contact_phone || "",
        family_contact_relationship: referralData.family_contact_relationship || "",
        status: referralData.status || "pending",
        notes: referralData.notes || "",
      });
    } catch (err) {
      console.error("Failed to fetch referral:", err);
      alert("Failed to load referral data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients for dropdown
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

  useEffect(() => {
    if (user && birthcare_Id && id) {
      fetchReferral();
      fetchPatients();
    }
  }, [user, birthcare_Id, id]);

  // Handle form input changes
  const handleFormChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await axios.put(`/api/birthcare/${birthcare_Id}/referrals/${id}`, formData);
      
      alert('Referral updated successfully!');
      
      // Redirect to referrals list
      router.push(`/${birthcare_Id}/referrals`);
      
    } catch (error) {
      console.error('Error updating referral:', error);
      alert('Error updating referral. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick status update
  const handleQuickStatusUpdate = async (newStatus) => {
    try {
      setSubmitting(true);
      await axios.put(`/api/birthcare/${birthcare_Id}/referrals/${id}`, {
        ...formData,
        status: newStatus
      });
      
      setFormData(prev => ({ ...prev, status: newStatus }));
      alert(`Referral status updated to ${newStatus}!`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading referral...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Referral not found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  The referral you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/${birthcare_Id}/referrals`}
                    className="inline-flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 border border-transparent rounded-xl text-sm font-normal text-black hover:shadow-lg hover:shadow-gray-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-300 hover:scale-105"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Referrals
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-4rem)]">
          <div className="px-6 py-6 h-full flex flex-col">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href={`/${birthcare_Id}/referrals`}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Edit Referral</h1>
                  <p className="text-gray-600 mt-1">
                    Update referral information and status
                  </p>
                </div>
              </div>
              
              {/* Current Status Badge */}
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(formData.status)}`}>
                  Current: {formData.status?.charAt(0).toUpperCase() + formData.status?.slice(1)}
                </span>
              </div>
            </div>

            {/* Quick Status Update */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Status Update</h3>
              <div className="flex flex-wrap gap-2">
                {['pending', 'accepted', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleQuickStatusUpdate(status)}
                    disabled={submitting || formData.status === status}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      formData.status === status
                        ? `${getStatusColor(status)} cursor-default`
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="flex-1">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Patient Information (Read-only) */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {referral.patient ? `${referral.patient.first_name} ${referral.patient.middle_name || ''} ${referral.patient.last_name}`.trim() : 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-gray-500">Patient ID: {referral.patient_id}</p>
                  </div>
                </div>

                {/* Status Field (Prominent) */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Referral Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Urgency Level *
                      </label>
                      <select
                        name="urgency_level"
                        value={formData.urgency_level}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Referral Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Referral Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referral Date *
                      </label>
                      <input
                        type="date"
                        name="referral_date"
                        value={formData.referral_date}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referral Time *
                      </label>
                      <input
                        type="time"
                        name="referral_time"
                        value={formData.referral_time}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Referring Facility</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referring Facility Name *
                      </label>
                      <input
                        type="text"
                        name="referring_facility"
                        value={formData.referring_facility}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referring Physician *
                      </label>
                      <input
                        type="text"
                        name="referring_physician"
                        value={formData.referring_physician}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referring Physician Contact
                      </label>
                      <input
                        type="text"
                        name="referring_physician_contact"
                        value={formData.referring_physician_contact}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Receiving Facility */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Receiving Facility</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receiving Facility Name *
                      </label>
                      <input
                        type="text"
                        name="receiving_facility"
                        value={formData.receiving_facility}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receiving Physician
                      </label>
                      <input
                        type="text"
                        name="receiving_physician"
                        value={formData.receiving_physician}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receiving Physician Contact
                      </label>
                      <input
                        type="text"
                        name="receiving_physician_contact"
                        value={formData.receiving_physician_contact}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Clinical Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Information</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Referral *
                      </label>
                      <textarea
                        name="reason_for_referral"
                        value={formData.reason_for_referral}
                        onChange={handleFormChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinical Summary
                      </label>
                      <textarea
                        name="clinical_summary"
                        value={formData.clinical_summary}
                        onChange={handleFormChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Diagnosis
                        </label>
                        <textarea
                          name="current_diagnosis"
                          value={formData.current_diagnosis}
                          onChange={handleFormChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relevant Medical History
                        </label>
                        <textarea
                          name="relevant_history"
                          value={formData.relevant_history}
                          onChange={handleFormChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transfer Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Patient Condition
                      </label>
                      <select
                        name="patient_condition"
                        value={formData.patient_condition}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select condition</option>
                        <option value="stable">Stable</option>
                        <option value="stable_but_guarded">Stable but Guarded</option>
                        <option value="critical">Critical</option>
                        <option value="unstable">Unstable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transportation Mode
                      </label>
                      <select
                        name="transportation_mode"
                        value={formData.transportation_mode}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ambulance">Ambulance</option>
                        <option value="private_transport">Private Transport</option>
                        <option value="helicopter">Helicopter</option>
                        <option value="wheelchair">Wheelchair</option>
                        <option value="stretcher">Stretcher</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      name="special_instructions"
                      value={formData.special_instructions}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ></textarea>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <Link
                    href={`/${birthcare_Id}/referrals`}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 border border-transparent rounded-xl text-sm font-normal text-black hover:shadow-lg hover:shadow-gray-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-pink-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Update Referral
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditReferralPage;
