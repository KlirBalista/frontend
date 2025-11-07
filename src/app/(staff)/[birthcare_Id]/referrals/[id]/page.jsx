"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";
import { ArrowLeft, Edit3, Download, Eye, AlertCircle, Calendar, Clock, User, Building, Stethoscope } from "lucide-react";
import Link from "next/link";

const ViewReferralPage = () => {
  const { birthcare_Id, id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch referral data
  const fetchReferral = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/referrals/${id}`
      );
      const referralData = response.data.data || response.data;
      setReferral(referralData);
    } catch (err) {
      console.error("Failed to fetch referral:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && birthcare_Id && id) {
      fetchReferral();
    }
  }, [user, birthcare_Id, id]);

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/referrals/${id}/pdf`,
        { responseType: 'blob' }
      );
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `referral-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleViewPDF = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/referrals/${id}/pdf`,
        { responseType: 'blob' }
      );
      
      // Open PDF in new tab
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      alert('Failed to view PDF. Please try again.');
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

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'routine': return 'bg-gray-100 text-gray-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return 'N/A';
    const formattedDate = new Date(date).toLocaleDateString();
    return time ? `${formattedDate} at ${time}` : formattedDate;
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-6">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href={`/${birthcare_Id}/referrals`}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Referral Details</h1>
                  <p className="text-gray-600 mt-1">
                    View complete referral information
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleViewPDF}
                  className="inline-flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 border border-transparent rounded-xl text-sm font-normal text-black hover:shadow-lg hover:shadow-gray-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-300 hover:scale-105"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View PDF
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all duration-300 hover:scale-105"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </button>
                <Link
                  href={`/${birthcare_Id}/referrals/${id}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-pink-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] transition-all duration-300 hover:scale-105"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </div>
            </div>

            {/* Status and Priority Banner */}
            <div className="mb-8 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(referral.status)}`}>
                    {referral.status?.charAt(0).toUpperCase() + referral.status?.slice(1)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Priority:</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUrgencyColor(referral.urgency_level)}`}>
                    {referral.urgency_level?.charAt(0).toUpperCase() + referral.urgency_level?.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="mr-2 h-4 w-4" />
                {formatDateTime(referral.referral_date, referral.referral_time)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Patient Information */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <User className="mr-2 h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900">
                        {referral.patient ? `${referral.patient.first_name} ${referral.patient.middle_name || ''} ${referral.patient.last_name}`.trim() : 'Unknown Patient'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Patient ID</label>
                      <p className="text-gray-900">{referral.patient_id}</p>
                    </div>
                    {referral.patient?.date_of_birth && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-gray-900">{new Date(referral.patient.date_of_birth).toLocaleDateString()}</p>
                      </div>
                    )}
                    {referral.patient?.phone_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone Number</label>
                        <p className="text-gray-900">{referral.patient.phone_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Referring Facility */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Building className="mr-2 h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Referring Facility</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Facility Name</label>
                      <p className="text-gray-900">{referral.referring_facility}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Physician</label>
                      <p className="text-gray-900">{referral.referring_physician}</p>
                    </div>
                    {referral.referring_physician_contact && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contact Information</label>
                        <p className="text-gray-900">{referral.referring_physician_contact}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Receiving Facility */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Building className="mr-2 h-5 w-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Receiving Facility</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Facility Name</label>
                      <p className="text-gray-900">{referral.receiving_facility}</p>
                    </div>
                    {referral.receiving_physician && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Physician</label>
                        <p className="text-gray-900">{referral.receiving_physician}</p>
                      </div>
                    )}
                    {referral.receiving_physician_contact && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contact Information</label>
                        <p className="text-gray-900">{referral.receiving_physician_contact}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Clinical Information */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Stethoscope className="mr-2 h-5 w-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Clinical Information</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Reason for Referral</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{referral.reason_for_referral}</p>
                    </div>
                    {referral.clinical_summary && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Clinical Summary</label>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">{referral.clinical_summary}</p>
                      </div>
                    )}
                    {referral.current_diagnosis && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Diagnosis</label>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">{referral.current_diagnosis}</p>
                      </div>
                    )}
                    {referral.relevant_history && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Relevant Medical History</label>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">{referral.relevant_history}</p>
                      </div>
                    )}
                    {referral.vital_signs && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Vital Signs</label>
                        <p className="text-gray-900 mt-1">{referral.vital_signs}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transfer Details */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Clock className="mr-2 h-5 w-5 text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Transfer Details</h2>
                  </div>
                  <div className="space-y-3">
                    {referral.patient_condition && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Patient Condition</label>
                        <p className="text-gray-900">{referral.patient_condition.replace('_', ' ')}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Transportation Mode</label>
                      <p className="text-gray-900">{referral.transportation_mode?.replace('_', ' ')}</p>
                    </div>
                    {referral.accompanies_patient && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Accompanies Patient</label>
                        <p className="text-gray-900">{referral.accompanies_patient}</p>
                      </div>
                    )}
                    {referral.equipment_required && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Equipment Required</label>
                        <p className="text-gray-900">{referral.equipment_required}</p>
                      </div>
                    )}
                    {referral.special_instructions && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Special Instructions</label>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">{referral.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                {(referral.family_contact_name || referral.insurance_information) && (
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Insurance</h2>
                    <div className="space-y-3">
                      {referral.family_contact_name && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                          <p className="text-gray-900">
                            {referral.family_contact_name}
                            {referral.family_contact_relationship && ` (${referral.family_contact_relationship})`}
                          </p>
                          {referral.family_contact_phone && (
                            <p className="text-gray-600">{referral.family_contact_phone}</p>
                          )}
                        </div>
                      )}
                      {referral.insurance_information && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Insurance Information</label>
                          <p className="text-gray-900 mt-1 whitespace-pre-wrap">{referral.insurance_information}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            {referral.notes && (
              <div className="mt-8 bg-white border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
                <p className="text-gray-900 whitespace-pre-wrap">{referral.notes}</p>
              </div>
            )}

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between text-sm text-gray-500">
              <div>
                Created: {new Date(referral.created_at).toLocaleString()}
                {referral.createdBy && ` by ${referral.createdBy.first_name} ${referral.createdBy.last_name}`}
              </div>
              {referral.updated_at !== referral.created_at && (
                <div>
                  Last updated: {new Date(referral.updated_at).toLocaleString()}
                  {referral.updatedBy && ` by ${referral.updatedBy.first_name} ${referral.updatedBy.last_name}`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReferralPage;
