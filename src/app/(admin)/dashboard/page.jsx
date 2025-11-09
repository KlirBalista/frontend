"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import {
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  BuildingOfficeIcon,
  ChevronRightIcon,
  UsersIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalUsers: 0,
    totalFacilities: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch applications for stats and recent list
        const applicationsResponse = await axios.get('/api/admin/birthcare-applications?perPage=5');
        const applications = applicationsResponse.data.applications || [];
        
        // Calculate stats from applications
        const totalApplications = applicationsResponse.data.total || 0;
        const pendingApplications = applications.filter(app => app.status === 'pending').length;
        const approvedApplications = applications.filter(app => app.status === 'approved').length;
        const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
        
        setStats({
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications,
          totalUsers: 0, // This would need a separate API endpoint
          totalFacilities: approvedApplications,
        });
        
        setRecentApplications(applications.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
            <p className="mt-4 text-gray-700 font-semibold">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ADMIN DASHBOARD
          </h1>
          <p className="text-gray-600 text-lg">
            System administration and management portal
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Applications */}
          <div className="bg-white rounded-xl shadow-lg border-0 p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] shadow-lg">
                <DocumentTextIcon className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          {/* Pending Applications */}
          <div className="bg-white rounded-xl shadow-lg border-0 p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                <ClockIcon className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </div>

          {/* Approved Applications */}
          <Link href="/birthcare-applications?status=approved">
            <div className="bg-white rounded-xl shadow-lg border-0 p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-xl cursor-pointer">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                  <CheckCircleIcon className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Approved</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.approvedApplications}</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Total Facilities */}
          <div className="bg-white rounded-xl shadow-lg border-0 p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#BF3853] to-[#A41F39] shadow-lg">
                <BuildingOfficeIcon className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Active Facilities</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalFacilities}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Recent Applications</h3>
              <Link 
                href="/birthcare-applications" 
                className="text-sm font-semibold text-white hover:text-pink-100 transition-colors underline underline-offset-2"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((app, index) => (
                  <div key={app.id || index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-xl border border-pink-100 hover:from-pink-50 hover:to-rose-50 transition-all duration-200">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{app.name}</h4>
                      <p className="text-sm text-gray-600 font-medium">
                        {app.owner?.firstname} {app.owner?.lastname}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#FDB3C2] rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-[#BF3853]" />
                </div>
                <p className="text-gray-600 font-medium">No recent applications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
