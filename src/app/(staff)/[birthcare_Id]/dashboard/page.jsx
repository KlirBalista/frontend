'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from '@/lib/axios';

const Dashboard = () => {
  const params = useParams();
  const birthcare_id = params.birthcare_Id;
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard statistics
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/birthcare/${birthcare_id}/dashboard/statistics`);
      if (response.data.success) {
        setDashboardData(response.data.data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (birthcare_id) {
      fetchDashboardData();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [birthcare_id]);

  if (loading && !dashboardData) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-[#BF3853]/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853] transition-all duration-300 hover:scale-105 px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overview, capacity, trends, recent_activity, room_occupancy, alerts } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Staff Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time facility overview and patient management
          </p>
        </div>
        <div className="text-right">
          <button 
            onClick={fetchDashboardData}
            className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-[#BF3853]/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 px-4 py-2 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div key={index} className={`p-4 rounded-2xl border backdrop-blur-sm ${
              alert.type === 'danger' ? 'bg-[#A41F39]/10 border-[#A41F39]/30 text-[#A41F39]' :
              alert.type === 'warning' ? 'bg-[#F891A5]/10 border-[#F891A5]/30 text-[#BF3853]' :
              'bg-[#FDB3C2]/10 border-[#FDB3C2]/30 text-[#BF3853]'
            }`}>
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overview Statistics Cards - Important Summary Only */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="In Labor"
            value={overview?.patients_in_labor || 0}
            icon="heart"
            color="pink1"
          />
          <StatCard
            title="Active Admissions"
            value={overview?.active_admissions || 0}
            icon="clipboard"
            color="pink2"
          />
          <StatCard
            title="Today's Admissions"
            value={overview?.todays_admissions || 0}
            icon="plus"
            color="pink3"
          />
          <StatCard
            title="Total Patients"
            value={overview?.total_patients || 0}
            icon="users"
            color="pink4"
          />
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column with Facility Capacity and Trends taking half height each */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Capacity Overview */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Facility Capacity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Total Beds</span>
                  <span className="font-semibold">{capacity?.total_beds || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Occupied</span>
                  <span className="font-semibold text-[#A41F39]">{capacity?.occupied_beds || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Available</span>
                  <span className="font-semibold text-[#BF3853]">{capacity?.available_beds || 0}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 text-sm">Occupancy Rate</span>
                    <span className="font-semibold">{capacity?.occupancy_rate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#E56D85] to-[#BF3853] h-2 rounded-full transition-all" 
                      style={{ width: `${capacity?.occupancy_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

          {/* Trends */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trends</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Weekly Admissions</span>
                  <span className="font-semibold">{trends?.weekly_admissions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Monthly Admissions</span>
                  <span className="font-semibold">{trends?.monthly_admissions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Monthly Deliveries</span>
                  <span className="font-semibold">{trends?.monthly_deliveries || 0}</span>
                </div>
              </div>
            </div>
          </div>

        {/* Room Occupancy taking up the right half */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Occupancy</h3>
            <div className="space-y-3">
              {room_occupancy && room_occupancy.length > 0 ? (
                room_occupancy.map((room) => (
                  <div key={room.id} className="border border-white/30 bg-white/30 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">{room.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        room.is_fully_occupied 
                          ? 'bg-[#A41F39]/10 text-[#A41F39]' 
                          : 'bg-[#BF3853]/10 text-[#BF3853]'
                      }`}>
                        {room.is_fully_occupied ? 'Full' : 'Available'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {room.occupied_beds}/{room.total_beds} beds occupied
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-gradient-to-r from-[#F891A5] to-[#E56D85] h-1.5 rounded-full" 
                        style={{ width: `${room.occupancy_rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No rooms available</p>
              )}
            </div>
          </div>
        </div>

      {/* Recent Activity */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="px-6 py-4 border-b border-white/20">
          <h3 className="text-lg font-semibold text-gray-900">Recent Admissions</h3>
        </div>
        <div className="p-6">
          {recent_activity && recent_activity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/30">
                    <th className="text-left py-3 text-sm font-medium text-gray-700">Patient</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-700">Date & Time</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_activity.map((admission) => (
                    <tr key={admission.id} className="border-b border-white/20">
                      <td className="py-3 font-medium text-gray-900">
                        {admission.patient_name}
                      </td>
                      <td className="py-3 text-gray-600">
                        {admission.admission_date}
                        {admission.admission_time && (
                          <span className="block text-sm">{admission.admission_time}</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admission.status_color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {admission.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent admissions</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  const palette = {
    pink1: {
      iconBg: 'bg-green-100', icon: 'text-green-600'
    },
    pink2: {
      iconBg: 'bg-green-100', icon: 'text-green-600'
    },
    pink3: {
      iconBg: 'bg-yellow-100', icon: 'text-yellow-600'
    },
    pink4: {
      iconBg: 'bg-blue-100', icon: 'text-blue-600'
    }
  };

  const c = palette[color] || palette.pink1;

  const iconComponents = {
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />,
    clipboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />,
    minus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 ${c.iconBg} rounded-full`}>
          <svg className={`h-6 w-6 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {iconComponents[icon] || iconComponents.users}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
