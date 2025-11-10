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
    { key: 'facility', label: 'Facility' },
    { key: 'documents', label: 'Documents' },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Clean Header with Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-6 mt-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-sm font-medium pb-1 transition-colors ${
                    activeTab === tab.key
                      ? 'text-[#BF3853] border-b-2 border-[#BF3853]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {approvalStatus?.status === "pending" && (
              <div className="bg-yellow-100 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-yellow-800">⏳ Awaiting Approval</span>
              </div>
            )}
            {approvalStatus?.status === "rejected" && (
              <Link href="/register-birthcare">
                <Button className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                  Update & Resubmit
                </Button>
              </Link>
            )}
            <Button
              onClick={handleToggleVisibility}
              disabled={isTogglingVisibility || birthcare.status === "pending"}
              className="px-4 py-2.5 bg-[#A41F39] hover:bg-[#8B1830] text-white rounded-lg font-medium flex items-center gap-2"
            >
              {isTogglingVisibility ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4" />
                  {birthcare.is_public ? "Public" : "Private"}
                </>
              )}
            </Button>
            <Link href={`/${birthcare.id}/dashboard`}>
              <Button
                disabled={!isApproved}
                className="px-4 py-2.5 bg-[#BF3853] hover:bg-[#A41F39] text-white rounded-lg font-medium disabled:opacity-50"
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'summary' && (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.overview?.total_staff || staffCount}</p>
                <p className="text-sm text-gray-500">Total Staff</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.overview?.total_patients || 0}</p>
                <p className="text-sm text-gray-500">Active Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.overview?.active_admissions || 0}</p>
                <p className="text-sm text-gray-500">Active Admissions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                <BuildingOffice2Icon className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.overview?.total_beds || 0}</p>
                <p className="text-sm text-gray-500">Total Beds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts + Mini Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Chart - spans 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Participation</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by</span>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#BF3853]">
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>
            </div>
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="0" y2="160" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="160" x2="700" y2="160" stroke="#e5e7eb" strokeWidth="1" />
                <text x="10" y="20" fontSize="10" fill="#9ca3af">400</text>
                <text x="10" y="85" fontSize="10" fill="#9ca3af">200</text>
                <text x="10" y="155" fontSize="10" fill="#9ca3af">0</text>
                <path d="M 50,120 Q 120,100 180,90 T 320,70 T 460,90 T 580,60 T 680,80" fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 50,120 Q 120,100 180,90 T 320,70 T 460,90 T 580,60 T 680,80 L 680,160 L 50,160 Z" fill="url(#areaGradient)" />
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="50%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#C4B5FD" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <text x="50" y="180" fontSize="11" fill="#9ca3af">JUN</text>
                <text x="150" y="180" fontSize="11" fill="#9ca3af">JUL</text>
                <text x="250" y="180" fontSize="11" fill="#9ca3af">AUG</text>
                <text x="350" y="180" fontSize="11" fill="#9ca3af">SEP</text>
                <text x="450" y="180" fontSize="11" fill="#9ca3af">OCT</text>
                <text x="550" y="180" fontSize="11" fill="#9ca3af">NOV</text>
                <text x="650" y="180" fontSize="11" fill="#9ca3af">DEC</text>
              </svg>
              <div className="absolute top-10 left-1/4 bg-[#5B47DB] text-white px-4 py-2 rounded-lg text-sm shadow-lg pointer-events-none">
                <div className="font-medium">Employees</div>
                <div className="text-xs opacity-90">Member: 255</div>
                <div className="text-xs opacity-90">8 August 2021</div>
              </div>
            </div>
          </div>

          {/* Mini KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            {[{
              label: 'Plan Month',
              value: dashboardStats?.birth_statistics?.this_month_births || 12,
            },{
              label: 'Member Average',
              value: dashboardStats?.birth_statistics?.avg_births_per_month || 293,
            },{
              label: 'Member Month',
              value: dashboardStats?.monthly_stats?.prenatal_visits || 222,
            },{
              label: 'Member Plan',
              value: dashboardStats?.overview?.total_patients || 37,
            }].map((kpi, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <div className="text-sm text-gray-500">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Management Table - full width */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Work management</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="pb-4 font-medium">SERVICE</th>
                <th className="pb-4 font-medium">PRIORITY</th>
                <th className="pb-4 font-medium">TOTAL</th>
                <th className="pb-4 font-medium">LAST PAYMENT</th>
                <th className="pb-4 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {dashboardStats?.recent_activity && dashboardStats.recent_activity.slice(0, 4).map((item, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900">{item.patient_name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                      Medium
                    </span>
                  </td>
                  <td className="py-4 font-medium text-gray-900">$200</td>
                  <td className="py-4 text-gray-600">{item.admission_date}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-900">80%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        {dashboardStats && dashboardStats.recent_activity && dashboardStats.recent_activity.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
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

        {/* Performance & Subscription Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Performance Metrics */}
          {dashboardStats && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
                <StarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4">
                  <div className="text-2xl font-bold text-[#A41F39]">{dashboardStats?.performance?.total_prenatal_visits || 0}</div>
                  <div className="text-sm text-gray-700">Total Prenatal Visits</div>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4">
                  <div className="text-2xl font-bold text-[#E56D85]">{dashboardStats?.performance?.average_stay_duration || 0} days</div>
                  <div className="text-sm text-gray-700">Avg Stay Duration</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="text-2xl font-bold text-[#BF3853]">{dashboardStats?.monthly_stats?.prenatal_visits || 0}</div>
                  <div className="text-sm text-gray-700">Monthly Prenatal Visits</div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
              <CreditCardIcon className="h-5 w-5 text-gray-400" />
            </div>
            {subscription?.status === "active" ? (
              <div className="space-y-4">
                <div className="flex items-center bg-green-50 rounded-xl p-4">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-green-600 font-semibold">
                    Active Subscription
                  </span>
                </div>
                {subscription.subscription?.end_date && (
                  <div className="flex items-center bg-gray-50 rounded-xl p-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-xs text-gray-500">Expires</div>
                      <div className="text-sm font-medium text-gray-900">{new Date(subscription.subscription.end_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
                {subscription.subscription?.start_date && (
                  <div className="flex items-center bg-gray-50 rounded-xl p-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-xs text-gray-500">Started</div>
                      <div className="text-sm font-medium text-gray-900">{new Date(subscription.subscription.start_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
                  <CreditCardIcon className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <div className="text-xs text-blue-600">Plan</div>
                    <div className="text-sm font-semibold text-blue-900">{subscription.subscription?.plan?.plan_name || "N/A"}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center bg-red-50 rounded-xl p-4">
                <XCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                <span className="text-red-600 font-semibold">
                  No active subscription
                </span>
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {/* Facility Tab */}
        {activeTab === 'facility' && (
          <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Facility Capacity Card */}
          {dashboardStats && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Facility Capacity</h2>
                <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#A41F39]">{dashboardStats?.overview?.total_beds || 0}</div>
                    <div className="text-sm text-gray-700">Total Beds</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4">
                    <div className="text-2xl font-bold text-[#BF3853]">{dashboardStats?.capacity?.available_beds || 0}</div>
                    <div className="text-sm text-gray-700">Available</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Occupancy Rate</span>
                    <span className="text-lg font-bold text-purple-900">{dashboardStats?.capacity?.occupancy_rate || 0}%</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all" 
                      style={{ width: `${dashboardStats?.capacity?.occupancy_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Facility Details Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
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

          {/* Facility Information Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
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
          </>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            {birthcare.status === "rejected" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 mb-2 font-medium">
                  Your facility was rejected. Please upload updated documents to resubmit.
                </p>
                {birthcare.rejection_reason && (
                  <p className="text-sm text-red-700 italic">
                    Reason: {birthcare.rejection_reason}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {birthcare.documents && birthcare.documents.length > 0 ? (
                birthcare.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <DocumentTextIcon className="h-5 w-5 text-[#BF3853]" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {doc.document_type}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open(doc.url, "_blank")}
                      className="px-4 py-2 bg-[#A41F39] hover:bg-[#BF3853] text-white rounded-lg"
                    >
                      View
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}
            {isUploadingDocuments && (
              <div className="mt-4 flex items-center justify-center space-x-2 p-4 bg-blue-50 rounded-xl">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-2 border-blue-200 border-t-[#BF3853]"></div>
                <span className="text-sm text-gray-700 font-medium">Uploading...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
