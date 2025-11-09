"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import Button from "@/components/Button";
import LocationPicker from "@/components/LocationPicker";
import Link from "next/link";
import {
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MapPinIcon,
  CreditCardIcon,
  BuildingOffice2Icon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  StarIcon,
  SparklesIcon,
  BellIcon,
  Cog6ToothIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function FacilityDashboard() {
  const [staffCount, setStaffCount] = useState(0);
  const [birthcare, setBirthcare] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'metrics', label: 'Metrics' },
    { key: 'activity', label: 'Activity' },
    { key: 'manage', label: 'Manage' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🚀 Fetching dashboard data...");
        
        const [birthcareRes, subscriptionRes, approvalRes] = await Promise.all([
          axios.get("/api/owner/birthcare"),
          axios.get("/api/owner/subscription"),
          axios.get("/api/owner/birthcare/approval-status")
        ]);

        console.log("✅ Basic data fetched:", { birthcare: birthcareRes.data, subscription: subscriptionRes.data, approval: approvalRes.data });

        setBirthcare(birthcareRes.data);
        setSubscription(subscriptionRes.data);
        setApprovalStatus(approvalRes.data);
        
        // Fetch dashboard statistics separately with better error handling
        try {
          console.log("🔍 Fetching dashboard statistics...");
          const dashboardRes = await axios.get("/api/owner/dashboard/statistics");
          console.log("📊 Dashboard statistics FULL response:", dashboardRes);
          console.log("📊 Dashboard statistics data:", dashboardRes.data);
          console.log("📊 Overview data:", dashboardRes.data?.data?.overview);
          
          if (dashboardRes.data && dashboardRes.data.success) {
            setDashboardStats(dashboardRes.data.data);
            setStaffCount(dashboardRes.data.data.overview?.total_staff || 0);
            console.log("✅ Dashboard stats set successfully", dashboardRes.data.data);
          } else {
            console.log("⚠️ Dashboard API returned unsuccessful response", dashboardRes.data);
            // Set fallback empty dashboard stats
            setDashboardStats({
              overview: { total_staff: 0, total_patients: 0, active_admissions: 0, total_beds: 0 },
              birth_statistics: { total_births: 0, this_month_births: 0, avg_births_per_month: 0, monthly_data: [] },
              capacity: { available_beds: 0, occupancy_rate: 0 },
              performance: { total_prenatal_visits: 0, average_stay_duration: 0 },
              monthly_stats: { prenatal_visits: 0 },
              recent_activity: []
            });
            setStaffCount(birthcareRes.data.staff?.length || 0);
          }
        } catch (dashboardError) {
          console.error("❌ Dashboard API failed:", {
            status: dashboardError?.response?.status || 'unknown',
            statusText: dashboardError?.response?.statusText || 'unknown',
            data: dashboardError?.response?.data || null,
            message: dashboardError?.message || 'Unknown error',
            url: dashboardError?.config?.url || 'unknown'
          });
          
          // Show user-friendly error message based on status
          if (dashboardError?.response?.status === 401) {
            console.log("🔐 Authentication required - redirecting to login");
            window.location.href = '/login';
            return;
          } else if (dashboardError?.response?.status === 404) {
            console.log("🏥 No birthcare facility found for user");
          }
          
          // Set fallback dashboard stats when API fails
          setDashboardStats({
            overview: { total_staff: 0, total_patients: 0, active_admissions: 0, total_beds: 0 },
            birth_statistics: { total_births: 0, this_month_births: 0, avg_births_per_month: 0, monthly_data: [] },
            capacity: { available_beds: 0, occupancy_rate: 0 },
            performance: { total_prenatal_visits: 0, average_stay_duration: 0 },
            monthly_stats: { prenatal_visits: 0 },
            recent_activity: []
          });
          setStaffCount(birthcareRes?.data?.staff?.length || 0);
        }
      } catch (error) {
        console.error("❌ Error fetching basic data:", error.response?.data || error.message);
        if (error.response?.status !== 404) {
          console.error("Full error object:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditName = () => {
    setEditName(birthcare.name);
    setIsEditingName(true);
  };

  const handleEditDescription = () => {
    setEditDescription(birthcare.description);
    setIsEditingDescription(true);
  };

  const handleResubmit = async () => {
    if (!birthcare) return;
    const confirmed = window.confirm('Resubmit your facility application for admin review?');
    if (!confirmed) return;

    setIsResubmitting(true);
    try {
      await axios.post(`/api/owner/birthcare/${birthcare.id}/resubmit`);
      const birthcareRes = await axios.get('/api/owner/birthcare');
      setBirthcare(birthcareRes.data);
      alert('Resubmitted! Status set to pending.');
    } catch (e) {
      console.error('Resubmit failed', e);
      alert(e?.response?.data?.message || 'Failed to resubmit.');
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleSaveName = async () => {
    if (editName.trim() === "") return;

    setIsSaving(true);
    try {
      await axios.put(`/api/owner/birthcare/${birthcare.id}`, {
        name: editName.trim(),
        description: birthcare.description,
      });

      setBirthcare((prev) => ({ ...prev, name: editName.trim() }));
      setIsEditingName(false);
    } catch (error) {
      console.error("Error saving name:", error);
      alert("Failed to save name. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    setIsSaving(true);
    try {
      await axios.put(`/api/owner/birthcare/${birthcare.id}`, {
        name: birthcare.name,
        description: editDescription.trim(),
      });

      setBirthcare((prev) => ({
        ...prev,
        description: editDescription.trim(),
      }));
      setIsEditingDescription(false);
    } catch (error) {
      console.error("Error saving description:", error);
      alert("Failed to save description. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLocation = () => {
    setEditLocation([parseFloat(birthcare.latitude), parseFloat(birthcare.longitude)]);
    setIsEditingLocation(true);
  };

  const handleSaveLocation = async () => {
    if (!editLocation || editLocation.length !== 2) return;

    setIsSaving(true);
    try {
      await axios.put(`/api/owner/birthcare/${birthcare.id}`, {
        name: birthcare.name,
        description: birthcare.description,
        latitude: editLocation[0],
        longitude: editLocation[1],
      });

      setBirthcare((prev) => ({
        ...prev,
        latitude: editLocation[0],
        longitude: editLocation[1],
      }));
      setIsEditingLocation(false);
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Failed to save location. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setIsEditingDescription(false);
    setIsEditingLocation(false);
    setEditName("");
    setEditDescription("");
    setEditLocation(null);
  };

  const handleToggleVisibility = async () => {
    setIsTogglingVisibility(true);
    try {
      const newVisibility = !birthcare.is_public;
      await axios.put(`/api/owner/birthcare/${birthcare.id}`, {
        name: birthcare.name,
        description: birthcare.description,
        is_public: newVisibility,
      });

      setBirthcare((prev) => ({ ...prev, is_public: newVisibility }));
    } catch (error) {
      console.error("Error updating visibility:", error);
      alert("Failed to update visibility. Please try again.");
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  const handleDocumentUpload = async (documentType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingDocuments(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append(documentType, file);

      await axios.post(
        `/api/owner/birthcare/${birthcare.id}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Refresh birthcare data
      const birthcareRes = await axios.get("/api/owner/birthcare");
      setBirthcare(birthcareRes.data);
      alert('Document updated successfully!');
    } catch (error) {
      console.error("Error uploading document:", error);
      setUploadError(error.response?.data?.message || "Failed to upload document. Please try again.");
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!birthcare) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Warning Banner */}
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg p-4 shadow-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
              <div>
                <h2 className="text-base font-bold text-amber-900">No Birthcare Facility Found</h2>
                <p className="text-xs text-amber-700 mt-0.5">You need to register your facility to access the dashboard</p>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-[#BF3853] via-[#E56D85] to-[#F891A5] px-6 py-8 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg">
                <BuildingOffice2Icon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Get started with your facility</h1>
            </div>

            {/* CTA Section */}
            <div className="px-6 py-8 bg-gradient-to-b from-gray-50 to-white">
              <div className="text-center mb-8">
                <Link href="/register-birthcare" passHref>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="px-6 py-3 bg-gradient-to-r from-[#A41F39] to-[#BF3853] hover:from-[#923649] hover:to-[#A41F39] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    <span>Register Birthcare Facility</span>
                  </Button>
                </Link>
                <p className="mt-3 text-xs text-gray-500 flex items-center justify-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  Takes less than 2 minutes
                </p>
              </div>

              {/* Features Grid */}
              <div className="max-w-5xl mx-auto">
                <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl border border-emerald-200 p-5 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-emerald-500 rounded-lg">
                      <SparklesIcon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-900">What you'll get</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <UserGroupIcon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">Manage your facility staff and roles</h4>
                          <p className="text-xs text-gray-600">Add staff members, assign roles, and manage permissions easily</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <CalendarIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">Handle client appointments efficiently</h4>
                          <p className="text-xs text-gray-600">Schedule, track, and manage patient appointments with ease</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <ChartBarIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">Access analytics and detailed reports</h4>
                          <p className="text-xs text-gray-600">Get insights into your facility's performance with comprehensive analytics</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-rose-100 rounded-lg">
                          <StarIcon className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">Showcase your services to potential clients</h4>
                          <p className="text-xs text-gray-600">Make your facility visible to patients looking for care</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = approvalStatus?.status === "approved";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-[#BF3853] p-2 rounded-lg">
                <BuildingOffice2Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {birthcare.name?.toUpperCase() || "BIRTHING HOME"}
                </h1>
                <p className="text-sm text-gray-600">BirthCare System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {approvalStatus?.status === "pending" && (
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-1">
                  <span className="text-sm text-yellow-800">
                    Awaiting Approval
                  </span>
                </div>
              )}
              {approvalStatus?.status === "rejected" && (
                <Link href="/register-birthcare">
                  <Button
                    variant="primary"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700"
                  >
                    Update & Resubmit
                  </Button>
                </Link>
              )}
              <Button
                variant="primary"
                onClick={handleToggleVisibility}
                disabled={isTogglingVisibility || birthcare.status === "pending"}
                className="px-4 py-2 bg-[#A41F39] hover:bg-[#BF3853]"
              >
                {isTogglingVisibility ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="h-4 w-4" />
                    <span className="text-sm">{birthcare.is_public ? "Private" : "Public"}</span>
                  </div>
                )}
              </Button>
              <Link href={`/${birthcare.id}/dashboard`}>
                <Button
                  variant="primary"
                  disabled={!isApproved}
                  className="px-4 py-2 bg-[#BF3853] hover:bg-[#A41F39] disabled:opacity-60"
                >
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* In-card Tabs */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-2 mb-6 sticky top-3 z-10 shadow-sm">
          <div className="flex gap-2">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === t.key
                    ? 'bg-[#BF3853] text-white shadow'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'summary' && (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <div className="rounded-full bg-[#FDB3C2] p-2">
                <UserGroupIcon className="h-5 w-5 text-[#BF3853]" />
              </div>
            </div>
            <p className="text-4xl font-bold text-[#BF3853]">{dashboardStats?.overview?.total_staff || staffCount}</p>
            <p className="text-xs text-gray-500 mt-1">Total Staff</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Active Patients</p>
              <div className="rounded-full bg-[#FDB3C2] p-2">
                <UserIcon className="h-5 w-5 text-[#BF3853]" />
              </div>
            </div>
            <p className="text-4xl font-bold text-[#BF3853]">{dashboardStats?.overview?.total_patients || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Active Patients</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Active Admissions</p>
              <div className="rounded-full bg-[#FDB3C2] p-2">
                <CalendarIcon className="h-5 w-5 text-[#BF3853]" />
              </div>
            </div>
            <p className="text-4xl font-bold text-[#BF3853]">{dashboardStats?.overview?.active_admissions || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Active Admissions</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Births Report */}
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Monthly Births Report
                </h2>
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {/* Chart Container */}
                <div className="relative h-32 bg-white rounded-lg p-3">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
                    <span>20</span>
                    <span>10</span>
                    <span>0</span>
                  </div>
                  
                  {/* Chart bars */}
                  <div className="ml-6 h-full flex items-end justify-between space-x-1">
                    {(dashboardStats?.birth_statistics?.monthly_data || [
                      { month: 'Jan', value: 0 },
                      { month: 'Feb', value: 0 },
                      { month: 'Mar', value: 0 },
                      { month: 'Apr', value: 0 },
                      { month: 'May', value: 0 },
                      { month: 'Jun', value: 0 }
                    ]).map((data, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-300 relative group ${
                            data.value === 0 
                              ? 'bg-gray-200 h-1' 
                              : 'bg-[#F891A5] hover:bg-[#E56D85]'
                          }`}
                          style={data.value > 0 ? { height: `${(data.value / 20) * 100}%` } : {}}
                        >
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 transition-opacity z-10">
                            {data.value} births
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 mt-1">{data.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Chart Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-lg font-bold text-[#A41F39]">{dashboardStats?.birth_statistics?.total_births || 0}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-lg font-bold text-[#BF3853]">{dashboardStats?.birth_statistics?.this_month_births || 0}</div>
                    <div className="text-xs text-gray-600">This Month</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-lg font-bold text-[#E56D85]">{dashboardStats?.birth_statistics?.avg_births_per_month || '0.0'}</div>
                    <div className="text-xs text-gray-600">Avg/Month</div>
                  </div>
                </div>
              </div>
            </div>
        
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Quick Stats
                </h2>
                <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-[#A41F39] mr-3" />
                    <div>
                      <div className="text-xl font-bold text-[#A41F39]">{dashboardStats?.overview?.total_staff || staffCount}</div>
                      <div className="text-xs text-gray-600">Total Staff</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-[#BF3853] mr-3" />
                    <div>
                      <div className="text-xl font-bold text-[#BF3853]">{dashboardStats?.overview?.total_patients || 0}</div>
                      <div className="text-xs text-gray-600">Active Patients</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-[#E56D85] mr-3" />
                    <div>
                      <div className="text-xl font-bold text-[#E56D85]">{dashboardStats?.overview?.active_admissions || 0}</div>
                      <div className="text-xs text-gray-600">Active Admissions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </div>
         {/* Additional Metrics Grid */}
        {activeTab === 'metrics' && dashboardStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Capacity Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Facility Capacity</h2>
                <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-2xl font-bold text-[#A41F39]">{dashboardStats?.overview?.total_beds || 0}</div>
                    <div className="text-sm text-gray-600">Total Beds</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-2xl font-bold text-[#BF3853]">{dashboardStats?.capacity?.available_beds || 0}</div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Occupancy Rate</span>
                    <span className="text-lg font-bold">{dashboardStats?.capacity?.occupancy_rate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#A41F39] h-2 rounded-full transition-all" 
                      style={{ width: `${dashboardStats?.capacity?.occupancy_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
                <StarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-[#A41F39]">{dashboardStats?.performance?.total_prenatal_visits || 0}</div>
                  <div className="text-sm text-gray-600">Total Prenatal Visits</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-[#E56D85]">{dashboardStats?.performance?.average_stay_duration || 0} days</div>
                  <div className="text-sm text-gray-600">Avg Stay Duration</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-[#BF3853]">{dashboardStats?.monthly_stats?.prenatal_visits || 0}</div>
                  <div className="text-sm text-gray-600">Monthly Prenatal Visits</div>
                </div>
              </div>
            </div>
          </div>
          )}
        
        {/* Recent Activity */}
        {activeTab === 'activity' && dashboardStats && dashboardStats.recent_activity && dashboardStats.recent_activity.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Admissions</h2>
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Patient</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Room/Bed</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardStats.recent_activity.map((admission, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 font-medium text-gray-900">{admission.patient_name}</td>
                        <td className="py-3 text-gray-600">{admission.admission_date}</td>
                        <td className="py-3 text-gray-600">{admission.room_bed}</td>
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            admission.status === 'in-labor' ? 'bg-[#FDB3C2] text-[#A41F39]' :
                            admission.status === 'delivered' ? 'bg-[#F891A5]/20 text-[#BF3853]' :
                            admission.status === 'discharged' ? 'bg-[#E56D85]/20 text-[#A41F39]' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {admission.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          )}

        {/* Facility Management Grid */}
        {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Facility Details */}
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Facility Details
                </h2>
                <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {/* Facility Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facility Name
                  </label>
                  {isEditingName ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xl font-semibold text-gray-900 bg-transparent border-2 border-slate-300 focus:border-slate-500 focus:outline-none rounded-lg p-2 flex-1"
                        autoFocus
                      />
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleSaveName}
                        disabled={isSaving || editName.trim() === ""}
                        className="p-2 bg-[#A41F39] hover:bg-[#BF3853]"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="p-2 border-[#E56D85] text-[#A41F39] hover:bg-[#FDB3C2]/20"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {birthcare.name}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditName}
                        className="p-2 text-[#E56D85] hover:text-[#A41F39] border-[#FDB3C2]"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Facility Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {isEditingDescription ? (
                    <div className="flex items-start space-x-2">
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="text-gray-700 bg-transparent border-2 border-slate-300 focus:border-slate-500 focus:outline-none rounded-lg p-2 flex-1 resize-none"
                        rows="3"
                        autoFocus
                      />
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={handleSaveDescription}
                          disabled={isSaving}
                          className="p-2 bg-[#A41F39] hover:bg-[#BF3853]"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="p-2 border-[#E56D85] text-[#A41F39] hover:bg-[#FDB3C2]/20"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-700 flex-1">
                        {birthcare.description || "No description provided"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditDescription}
                        className="p-2 ml-2 text-[#E56D85] hover:text-[#A41F39] border-[#FDB3C2]"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
        
          {/* Facility Information */}
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Facility Information
                </h2>
                <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {/* Location */}
                <div>
                  <div className="flex items-center mb-2">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Location</span>
                  </div>
                  {isEditingLocation ? (
                    <div className="space-y-4">
                      <LocationPicker
                        value={editLocation}
                        onChange={setEditLocation}
                      />
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={handleSaveLocation}
                          disabled={isSaving || !editLocation}
                          className="p-2 bg-[#A41F39] hover:bg-[#BF3853]"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="p-2 border-[#E56D85] text-[#A41F39] hover:bg-[#FDB3C2]/20"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600">
                          Latitude: {parseFloat(birthcare.latitude).toFixed(6)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Longitude: {parseFloat(birthcare.longitude).toFixed(6)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditLocation}
                        className="p-2 text-[#E56D85] hover:text-[#A41F39] border-[#FDB3C2]"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <SparklesIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    Status:
                    <span
                      className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                        birthcare.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : birthcare.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {birthcare.status?.toUpperCase()}
                    </span>
                  </span>
                </div>
                <div className="flex items-center">
                  <EyeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    Visibility: {birthcare.is_public ? "Public" : "Private"}
                  </span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    Registered:{" "}
                    {new Date(birthcare.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
        </div>

        {/* Additional Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Subscription Details */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">
                Subscription
              </h2>
              <CreditCardIcon className="h-4 w-4 text-gray-400" />
            </div>
            {subscription?.status === "active" ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-600 font-medium text-sm">
                    Active Subscription
                  </span>
                </div>
                {subscription.subscription?.end_date && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-xs text-gray-600">
                      Expires: {new Date(subscription.subscription.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {subscription.subscription?.start_date && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-xs text-gray-600">
                      Started: {new Date(subscription.subscription.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <CreditCardIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-xs text-gray-600">
                    Plan: {subscription.subscription?.plan?.plan_name || "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-600 font-medium text-sm">
                  No active subscription
                </span>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Documents</h2>
              <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            </div>
            
            {birthcare.status === "rejected" && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-800 mb-2">
                  Your facility was rejected. Please upload updated documents to resubmit.
                </p>
                {birthcare.rejection_reason && (
                  <p className="text-xs text-red-700 italic">
                    Reason: {birthcare.rejection_reason}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              {birthcare.documents && birthcare.documents.length > 0 ? (
                birthcare.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-700 text-sm">
                      {doc.document_type}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open(doc.url, "_blank")}
                      className="text-xs px-3 py-1 bg-[#A41F39] hover:bg-[#BF3853]"
                    >
                      View
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No documents uploaded yet.</p>
              )}
            </div>

            {uploadError && (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            )}
            {isUploadingDocuments && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#BF3853]"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
