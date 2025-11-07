"use client";
import { useAuth } from "@/hooks/auth";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import axios from '@/lib/axios';
import { Notification, useNotification } from '@/components/Notification';

const PrenatalVisitsLogPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  const { notification, success, error: showError, info, hideNotification } = useNotification();
  
  // State management
  const [visitLogs, setVisitLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch visit logs
  const fetchVisitLogs = async () => {
    setLoading(true);
    try {
      // Try to fetch from visit-logs endpoint first, fallback to constructed data
      let logsData = [];
      
      try {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}/visit-logs`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
          }
        });
        logsData = response.data.data || response.data || [];
      } catch (logError) {
        console.warn('Visit logs endpoint not available, fetching from prenatal visits');
        
        // Fallback: Get all prenatal visits and construct log entries
        const visitsResponse = await axios.get(`/api/birthcare/${birthcare_Id}/prenatal-calendar`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
          }
        });
        
        const visits = visitsResponse.data || [];
        logsData = visits.map(visit => ({
          id: visit.id,
          visit_id: visit.id,
          patient_id: visit.patient?.id,
          patient_name: `${visit.patient?.first_name} ${visit.patient?.last_name}`,
          visit_number: visit.visit_number,
          visit_name: visit.visit_name,
          previous_status: 'Scheduled',
          new_status: visit.status,
          action_type: visit.status === 'Scheduled' ? 'scheduled' : 'status_update',
          changed_by: 'Staff',
          changed_at: visit.updated_at || visit.created_at || new Date().toISOString(),
          scheduled_date: visit.scheduled_date,
          recommended_week: visit.recommended_week,
          notes: `Visit ${visit.visit_number} - ${visit.visit_name}`,
          patient: visit.patient
        }));
      }
      
      // Load and merge local logs from localStorage
      let mergedLogs = logsData;
      try {
        const localLogs = JSON.parse(localStorage.getItem('prenatal_visit_logs_local') || '[]');
        if (localLogs.length > 0) {
          // Merge remote and local logs, removing duplicates
          const combinedLogs = [...localLogs, ...logsData];
          const uniqueLogs = combinedLogs.reduce((acc, log) => {
            const existing = acc.find(existing => 
              existing.visit_id === log.visit_id && 
              existing.new_status === log.new_status &&
              Math.abs(new Date(existing.changed_at) - new Date(log.changed_at)) < 5000
            );
            if (!existing) {
              acc.push(log);
            }
            return acc;
          }, []);
          mergedLogs = uniqueLogs;
        }
      } catch (e) {
        console.warn('Failed to load local visit logs:', e);
      }
      
      // Compress to the latest entry per visit, then sort
      const compressed = compressLogsByVisit(mergedLogs);
      setVisitLogs(compressed);
      setFilteredLogs(compressed);
      
    } catch (error) {
      console.error('Error fetching visit logs:', error);
      showError('Error', 'Failed to fetch visit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && birthcare_Id) {
      fetchVisitLogs();
    }
  }, [user, birthcare_Id]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_prenatal_visits_log"))
  ) {
    return <div>Unauthorized</div>;
  }

  // Listen for real-time visit status updates from other pages
  useEffect(() => {
    const handleVisitStatusUpdate = (event) => {
      const newLogEntry = event.detail;
      console.log('Visit Logs page received visit status update:', newLogEntry);
      console.log('Event received at:', new Date().toISOString());
      
      // Upsert the log entry by visit_id (do not add a new row)
      setVisitLogs(prevLogs => {
        console.log('Upserting log. Previous logs count:', prevLogs.length);
        
        let found = false;
        const updated = prevLogs.map(log => {
          if (log.visit_id === newLogEntry.visit_id) {
            found = true;
            return { ...log, ...newLogEntry };
          }
          return log;
        });
        
        const result = found ? updated : [newLogEntry, ...updated];
        const compressed = compressLogsByVisit(result);
        
        // Update localStorage as well
        try {
          localStorage.setItem('prenatal_visit_logs_local', JSON.stringify(compressed.slice(0, 200)));
        } catch (e) {
          console.warn('Failed to update local visit logs:', e);
        }
        
        console.log('Logs count after upsert:', compressed.length);
        return compressed;
      });
      
      // Show notification about the update
      info(
        'Visit Status Updated',
        `${newLogEntry.patient_name}'s Visit ${newLogEntry.visit_number} status updated to ${newLogEntry.new_status}`
      );
    };

    // Listen for custom events from other pages
    window.addEventListener('prenatal:visit-status-updated', handleVisitStatusUpdate);
    
    // Check for any recent updates in localStorage on page load
    const checkForRecentUpdate = () => {
      try {
        const lastLogStr = localStorage.getItem('prenatal_visit_last_log');
        if (lastLogStr) {
          const lastLog = JSON.parse(lastLogStr);
          const logTime = new Date(lastLog.changed_at);
          const now = new Date();
          
          // If log is less than 30 seconds old, add it to current logs
          if ((now - logTime) < 30000) {
            setVisitLogs(prevLogs => {
              // Upsert by visit_id so only one row per visit is kept
              let replaced = false;
              const updated = prevLogs.map(l => {
                if (l.visit_id === lastLog.visit_id) {
                  replaced = true;
                  return { ...l, ...lastLog };
                }
                return l;
              });
              const res = replaced ? updated : [lastLog, ...updated];
              const compressed = compressLogsByVisit(res);
              return compressed;
            });
          }
          
          // Clean up old localStorage entry
          localStorage.removeItem('prenatal_visit_last_log');
        }
      } catch (e) {
        console.warn('Failed to check for recent visit log updates:', e);
      }
    };

    // Check on component mount
    setTimeout(checkForRecentUpdate, 100);
    
    // Also check for updates when window gains focus (user switches back to this tab)
    const handleWindowFocus = () => {
      console.log('Window gained focus, checking for new visit logs...');
      checkForRecentUpdate();
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('prenatal:visit-status-updated', handleVisitStatusUpdate);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [info]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = visitLogs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.visit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.new_status?.toLowerCase() === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(log => {
            const logDate = new Date(log.changed_at);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === filterDate.getTime();
          });
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(log => new Date(log.changed_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(log => new Date(log.changed_at) >= filterDate);
          break;
      }
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [visitLogs, searchTerm, statusFilter, dateFilter]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700';
      case 'status_update':
        return 'bg-purple-50 text-purple-700';
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'missed':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  // Helper: keep only the most recent log per visit
  const compressLogsByVisit = (logs) => {
    const byVisit = new Map();
    logs.forEach(log => {
      const key = log.visit_id;
      const existing = byVisit.get(key);
      if (!existing || new Date(log.changed_at) > new Date(existing.changed_at)) {
        byVisit.set(key, log);
      }
    });
    return Array.from(byVisit.values()).sort((a,b) => new Date(b.changed_at) - new Date(a.changed_at));
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Patient', 'Visit', 'Current Status', 'Notes'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.changed_at).toLocaleString(),
        log.patient_name,
        `${log.visit_number} - ${log.visit_name}`,
        log.new_status,
        log.notes?.replace(/,/g, ';') || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prenatal-visits-current-status-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Prenatal Visit Logs</h1>
              <p className="text-sm text-gray-900 mt-1 font-medium">
                Complete audit trail of all prenatal visit status changes
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('Manual refresh triggered');
                  fetchVisitLogs();
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#F891A5] text-[#A41F39] font-semibold rounded-xl hover:bg-[#FDB3C2]/20 transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportLogs}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#BF3853]/25 transition-all duration-200"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient, visit, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent transition-all duration-200 bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visit Logs Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Results Info */}
          <div className="px-6 py-5 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDB3C2]/20 text-[#BF3853] font-semibold">
                    {filteredLogs.length} logs
                  </span>
                  {searchTerm && <span className="ml-2 text-gray-500"> matching \"{searchTerm}\"</span>}
                  {loading && <span className="ml-2 text-[#BF3853] animate-pulse">Loading...</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>

          {loading && currentLogs.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-[#BF3853]" />
              <span className="ml-3 text-gray-900 font-medium">Loading visit logs...</span>
            </div>
          ) : currentLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FDB3C2]/30 to-[#F891A5]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-[#BF3853]" />
              </div>
              {filteredLogs.length === 0 && visitLogs.length === 0 ? (
                <>
                  <p className="text-xl font-bold text-gray-700 mb-2">No visit logs yet</p>
                  <p className="text-gray-500">Visit logs will appear here when prenatal visits status changes.</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-gray-700 mb-2">No logs found</p>
                  <p className="text-gray-500">Try adjusting your search terms or filters to see more results.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">Date & Time</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">Patient</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">Visit Details</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Status Change</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {currentLogs.map((log, index) => (
                      <tr 
                        key={log.id || index} 
                        className="border-b border-white/30 hover:bg-[#FDB3C2]/10 transition-all duration-200 group"
                      >
                        {/* Date & Time */}
                        <td className="px-6 py-4 text-center text-sm border-r border-white/30">
                          <div className="font-bold text-gray-900 group-hover:text-[#BF3853] transition-colors">
                            {new Date(log.changed_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-900">
                            {new Date(log.changed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>

                        {/* Patient */}
                        <td className="px-6 py-4 text-center text-sm border-r border-white/30">
                          <div className="font-bold text-gray-900 group-hover:text-[#BF3853] transition-colors">
                            {log.patient_name}
                          </div>
                        </td>

                        {/* Visit Details */}
                        <td className="px-6 py-4 text-center text-sm border-r border-white/30">
                          <div className="font-bold text-gray-900">
                            Visit {log.visit_number}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center text-sm">
                          <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${getStatusColor(log.new_status)}`}>
                            {log.new_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-5 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-[#FDB3C2]/20 hover:border-[#BF3853] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    
                    <span className="text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-[#FDB3C2]/20 hover:border-[#BF3853] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
          autoClose={notification.autoClose}
          duration={notification.duration}
        />
      )}
    </div>
  );
};

export default PrenatalVisitsLogPage;