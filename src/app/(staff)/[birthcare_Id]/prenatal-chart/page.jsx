"use client";
import { useAuth } from "@/hooks/auth";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Calendar, Clock, Users, AlertCircle, CheckCircle2, User, Hash, CalendarPlus, Clock as ClockIcon } from "lucide-react";
import axios from '@/lib/axios';
import Button from '@/components/Button';
import PrenatalScheduleModal from '@/components/PrenatalScheduleModal';
import TodaysVisitsModal from '@/components/TodaysVisitsModal';
import UpcomingVisitsModal from '@/components/UpcomingVisitsModal';
import VisitLogModal from '@/components/VisitLogModal';
import { Notification, useNotification } from '@/components/Notification';

const PrenatalChartPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { notification, success, error: showError, warning, info, hideNotification } = useNotification();
  const { birthcare_Id } = useParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [todaysVisits, setTodaysVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [birthCareInfo, setBirthCareInfo] = useState(null);
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [showPrenatalModal, setShowPrenatalModal] = useState(false);
  const [showTodaysModal, setShowTodaysModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [showVisitLogModal, setShowVisitLogModal] = useState(false);
  const [selectedVisitForLog, setSelectedVisitForLog] = useState(null);

  // WHO 8 Visit Schedule Reference
  const whoSchedule = [
    { number: 1, name: "First visit", week: "before 12 weeks", description: "Initial assessment, confirm pregnancy" },
    { number: 2, name: "Second visit", week: "20 weeks", description: "Anatomy scan, genetic screening" },
    { number: 3, name: "Third visit", week: "26 weeks", description: "Glucose screening, blood pressure check" },
    { number: 4, name: "Fourth visit", week: "30 weeks", description: "Growth monitoring, position check" },
    { number: 5, name: "Fifth visit", week: "34 weeks", description: "Preterm prevention, birth planning" },
    { number: 6, name: "Sixth visit", week: "36 weeks", description: "Final preparations, positioning" },
    { number: 7, name: "Seventh visit", week: "38 weeks", description: "Labor readiness, final checks" },
    { number: 8, name: "Eighth visit", week: "40 weeks", description: "Due date assessment, delivery planning" }
  ];

  // Fetch birthcare info
  const fetchBirthCareInfo = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      setBirthCareInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching birth care info:', error);
    }
  };

  // Fetch calendar data and today's visits
  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Build a 12-month window starting from the selected month
      const startDateObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endDateObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 12, 0); // last day 11 months ahead

      // Format dates without timezone conversion
      const formatDateString = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDate = formatDateString(startDateObj);
      const endDate = formatDateString(endDateObj);
      
      const [calendarResponse, todaysResponse] = await Promise.all([
        axios.get(`/api/birthcare/${birthcare_Id}/prenatal-calendar`, {
          params: {
            start: startDate,
            end: endDate
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }),
        axios.get(`/api/birthcare/${birthcare_Id}/todays-visits`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        })
      ]);
      
      const allVisits = calendarResponse.data || [];
      setCalendarData(allVisits);
      setTodaysVisits(todaysResponse.data || []);
      
      // Filter upcoming visits from the calendar data
      const today = (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();
      const futureVisits = allVisits.filter(visit => {
        const visitDate = normalizeYMD(visit.scheduled_date);
        return visitDate >= today && visit.status === 'Scheduled';
      });
      setUpcomingVisits(futureVisits);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data. Please try again.');
      setCalendarData([]);
      setTodaysVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && birthcare_Id) {
      fetchBirthCareInfo();
      fetchData();
    }
  }, [user, birthcare_Id, selectedDate]);

  // Keep Today's Visits in sync when status is changed from other pages/tabs
  useEffect(() => {
    const handleStatusEvent = (e) => {
      try {
        const detail = e?.detail || {};
        const updatedId = detail.visit_id ?? detail.id;
        const newStatusRaw = detail.new_status ?? detail.status;
        if (!updatedId || !newStatusRaw) return;
        const normalized = String(newStatusRaw).charAt(0).toUpperCase() + String(newStatusRaw).slice(1).toLowerCase();

        // Update status in Today's Visits instead of removing
        setTodaysVisits(prev => prev.map(v => {
          const vid = (v?.id ?? v?.visit_id);
          if (vid === updatedId) {
            return { ...v, status: normalized };
          }
          return v;
        }));
      } catch {}
    };

    const handleStorage = (e) => {
      if (e.key === 'prenatal_visit_last_log' && e.newValue) {
        try {
          const detail = JSON.parse(e.newValue);
          handleStatusEvent({ detail });
        } catch {}
      }
    };

    window.addEventListener('prenatal:visit-status-updated', handleStatusEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('prenatal:visit-status-updated', handleStatusEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_prenatal_schedule"))
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600 font-semibold">Unauthorized Access</div>
      </div>
    );
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Normalize various API date formats to YYYY-MM-DD in local time
  const normalizeYMD = (input) => {
    if (!input) return null;
    if (typeof input === 'string') {
      if (input.includes('T')) {
        const d = new Date(input); // convert from UTC to local
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      }
      // Handles 'YYYY-MM-DD HH:mm:ss' and 'YYYY-MM-DD'
      return input.split(' ')[0];
    }
    try {
      const d = new Date(input);
      if (!isNaN(d)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      }
    } catch {}
    return null;
  };

  const getVisitsForDate = (day) => {
    // Create date string without timezone conversion
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    
    const visits = calendarData.filter(visit => {
      const visitDate = normalizeYMD(visit.scheduled_date);
      return visitDate === dateStr;
    });
    
    return visits;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const isToday = (day) => {
    const today = new Date();
    const checkDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    return checkDate.toDateString() === today.toDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  // Handle marking visits as missed or completed
  const handleVisitStatusUpdate = async (visitId, newStatus) => {
    try {
      const normalized = String(newStatus || '').charAt(0).toUpperCase() + String(newStatus || '').slice(1).toLowerCase();
      console.log(`Updating visit ${visitId} status to ${normalized}`);

      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Helper to extract status from various API shapes
      const extractStatus = (res) => {
        const d = res?.data;
        if (!d) return undefined;
        if (typeof d === 'object') {
          if (d.data?.status) return d.data.status;
          if (d.new_status) return d.new_status;
          if (d.status) return d.status;
        }
        return undefined;
      };

      let success = false;
      let response;

      // Attempt 1: Dedicated status endpoint (PATCH), multiple payload keys
      const statusPayloads = [
        { status: normalized },
        { new_status: normalized },
        { visit_status: normalized },
      ];
      for (const body of statusPayloads) {
        try {
          console.log(`PATCH attempt with payload:`, body);
          response = await axios.patch(`/api/birthcare/${birthcare_Id}/prenatal-visits/${visitId}/status`, body, { headers });
          console.log('PATCH response:', response.data);
          const serverStatus = extractStatus(response);
          console.log(`Server returned status: "${serverStatus}", expected: "${normalized}"`);
          if (serverStatus && String(serverStatus).toLowerCase() === String(normalized).toLowerCase()) {
            success = true;
            console.log('✅ Status update confirmed by server');
            break;
          }
        } catch (err) {
          console.log('PATCH /status failed with body', body, err.response?.status, err.response?.statusText);
        }
      }

      // Attempt 2: PUT full visit with correct key
      if (!success) {
        try {
          console.log(`PUT attempt with payload: { status: "${normalized}" }`);
          response = await axios.put(`/api/birthcare/${birthcare_Id}/prenatal-visits/${visitId}`, { status: normalized }, { headers });
          console.log('PUT response:', response.data);
          const serverStatus = extractStatus(response) ?? response?.data?.data?.status;
          console.log(`Server returned status: "${serverStatus}", expected: "${normalized}"`);
          if (serverStatus && String(serverStatus).toLowerCase() === String(normalized).toLowerCase()) {
            success = true;
            console.log('✅ Status update confirmed by server via PUT');
          }
        } catch (err) {
          console.log('PUT /prenatal-visits/{id} failed', err.response?.status, err.response?.statusText);
        }
      }

      if (!success) {
        throw new Error('All endpoint attempts failed or status did not persist');
      }

      // Refresh the calendar/today data after updating status
      await fetchData();

    } catch (error) {
      console.error('Failed to update visit status:', error);

      // Show more specific error message
      let errorMessage = 'Failed to update visit status.';
      if (error.response?.status === 404) {
        errorMessage = 'Visit status update endpoint not found. Please contact support.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid status value. Please try again.';
      }

      showError(
        'Status Update Failed',
        errorMessage + ' Please try again.'
      );
    }
  };

  // Handle confirmed status change from visit log modal
  const handleConfirmStatusChange = async (newStatus) => {
    if (!selectedVisitForLog) return;
    
    try {
      // Create log entry data
      const logEntry = {
        id: Date.now(),
        visit_id: selectedVisitForLog.id,
        patient_id: selectedVisitForLog.patient.id,
        patient_name: `${selectedVisitForLog.patient.first_name} ${selectedVisitForLog.patient.last_name}`,
        previous_status: selectedVisitForLog.status,
        new_status: newStatus,
        changed_by: user?.name || 'Staff',
        changed_at: new Date().toISOString(),
        visit_number: selectedVisitForLog.visit_number,
        visit_name: selectedVisitForLog.visit_name,
        action_type: 'status_update',
        scheduled_date: selectedVisitForLog.scheduled_date,
        recommended_week: selectedVisitForLog.recommended_week,
        notes: `Visit status changed from ${selectedVisitForLog.status} to ${newStatus}`
      };
      
      console.log('Creating visit log entry:', logEntry);
      
      // Try to create log entry first (if endpoint exists)
      let logCreatedSuccessfully = false;
      try {
        await axios.post(`/api/birthcare/${birthcare_Id}/visit-logs`, logEntry, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        console.log('Visit log entry created successfully');
        logCreatedSuccessfully = true;
      } catch (logError) {
        console.warn('Failed to create visit log entry:', logError);
        // Continue with status update even if logging fails
        // The log will still be broadcasted for real-time updates
      }
      
      // Update visit status
      await handleVisitStatusUpdate(selectedVisitForLog.id, newStatus);

      // Broadcast event so other pages (e.g., Visit Logs) can update immediately
      try {
        // Add success flag to log entry for UI feedback
        const broadcastLogEntry = { ...logEntry, logged_successfully: logCreatedSuccessfully };
        
        console.log('Dispatching visit status update event:', broadcastLogEntry);
        window.dispatchEvent(new CustomEvent('prenatal:visit-status-updated', { detail: broadcastLogEntry }));
        // Persist to localStorage so newly opened logs page can pick it up
        localStorage.setItem('prenatal_visit_last_log', JSON.stringify(broadcastLogEntry));
        
        // Also append to a local rolling log store so the logs page can always pick it up
        try {
          const existing = JSON.parse(localStorage.getItem('prenatal_visit_logs_local') || '[]');
          const merged = [broadcastLogEntry, ...existing]
            .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
            .slice(0, 200); // cap to avoid unbounded growth
          localStorage.setItem('prenatal_visit_logs_local', JSON.stringify(merged));
        } catch (e2) {
          console.warn('Failed to persist local visit logs:', e2);
        }
        
        console.log('Visit status update broadcasted successfully');
      } catch (e) {
        console.warn('Failed to broadcast visit log update event:', e);
      }
      
      // Update status in today's visits sidebar instead of removing
      try {
        setTodaysVisits(prev => prev.map(v => {
          const vid = v?.id ?? v?.visit_id;
          if (vid === selectedVisitForLog.id) {
            return { ...v, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase() };
          }
          return v;
        }));
      } catch {}
      
      // Close modal and reset selection
      setShowVisitLogModal(false);
      setSelectedVisitForLog(null);
      
      // Show success message
      success(
        'Status Updated Successfully',
        `Visit status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} and logged successfully.`
      );
      
    } catch (error) {
      console.error('Failed to update visit status with logging:', error);
      showError(
        'Update Failed',
        'Failed to update visit status. Please try again.'
      );
    }
  };

  // Handle right-click context menu for visits
  const handleVisitRightClick = (e, visit) => {
    e.preventDefault();
    
    console.log('Visit object:', visit); // Debug log
    
    // Only allow status changes for scheduled visits (try both cases)
    if (visit.status !== 'Scheduled' && visit.status !== 'scheduled') {
      console.log('Visit status is not scheduled:', visit.status);
      return;
    }
    
    const contextMenu = [
      {
        label: 'Update Visit Status',
        action: () => {
          setSelectedVisitForLog(visit);
          setShowVisitLogModal(true);
        },
        color: 'text-[#A41F39]'
      }
    ];
    
    // Create a simple context menu with better error handling
    const menu = document.createElement('div');
    menu.className = 'fixed z-50 bg-white border-2 border-gray-200 rounded-lg shadow-xl py-2 min-w-48';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    menu.setAttribute('data-context-menu', 'true');
    
    contextMenu.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = `px-4 py-2 hover:bg-gray-100 cursor-pointer ${item.color} font-medium text-sm`;
      menuItem.textContent = item.label;
      menuItem.onclick = () => {
        item.action();
        removeMenu();
      };
      menu.appendChild(menuItem);
    });
    
    document.body.appendChild(menu);
    
    // Remove menu function with error handling
    const removeMenu = () => {
      try {
        if (menu && menu.parentNode) {
          menu.parentNode.removeChild(menu);
        }
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('contextmenu', handleOutsideClick);
        document.removeEventListener('keydown', handleEscapeKey);
      } catch (error) {
        console.warn('Error removing context menu:', error);
      }
    };
    
    // Handle clicks outside menu
    const handleOutsideClick = (event) => {
      if (!menu.contains(event.target)) {
        removeMenu();
      }
    };
    
    // Handle escape key
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        removeMenu();
      }
    };
    
    // Add event listeners with delay to prevent immediate triggering
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('contextmenu', handleOutsideClick);
      document.addEventListener('keydown', handleEscapeKey);
    }, 10);
  };

  const handleCreateSchedule = async (scheduleData) => {
    try {
      console.log('Creating prenatal schedule:', scheduleData);
      
      // Calculate all 8 WHO visits based on the start date
      const baseDate = new Date(scheduleData.scheduled_date);
      const visits = [];
      
      // WHO 8-Visit Schedule with recommended weeks
      const whoSchedule = [
        { name: "First Visit", week: "8-12", description: "First antenatal visit" },
        { name: "Second Visit", week: "20", description: "Focused antenatal care" },
        { name: "Third Visit", week: "26", description: "Prevention and management of problems" },
        { name: "Fourth Visit", week: "30", description: "Prevention and management of problems" },
        { name: "Fifth Visit", week: "34", description: "Prevention and management of problems" },
        { name: "Sixth Visit", week: "36", description: "Birth preparedness and complication readiness" },
        { name: "Seventh Visit", week: "38", description: "Birth preparedness and complication readiness" },
        { name: "Eighth Visit", week: "40", description: "Birth preparedness and complication readiness" }
      ];
      
      // Calculate dates for each visit (assuming first visit is at 10 weeks)
      const conceptionDate = new Date(baseDate.getTime() - (10 * 7 * 24 * 60 * 60 * 1000));
      
      const visitScheduleWeeks = [10, 20, 26, 30, 34, 36, 38, 40]; // weeks from conception
      
      for (let i = 0; i < 8; i++) {
        const weeksFromConception = visitScheduleWeeks[i];
        const scheduledDate = new Date(conceptionDate.getTime() + (weeksFromConception * 7 * 24 * 60 * 60 * 1000));
        
        visits.push({
          patient_id: scheduleData.selected_patient.id,
          visit_number: i + 1,
          visit_name: whoSchedule[i].name,
          recommended_week: whoSchedule[i].week,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          status: 'Scheduled',
          notes: `${whoSchedule[i].description}`
        });
      }
      
      // Make API call to create all visits at once using batch endpoint
      const response = await axios.post(`/api/birthcare/${birthcare_Id}/prenatal-visits/batch`, {
        visits: visits
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Prenatal schedule created successfully:', response.data);
      
      // Refresh the calendar data after creating schedule
      await fetchData();
      
    } catch (error) {
      console.error('Failed to create prenatal schedule:', error);
      throw error;
    }
  };

  return (
    <div className="bg-[#F891A5]/20 rounded-2xl py-8">
      {/* Modern Tooltip */}
      <div className="max-w-full mx-auto p-3">

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Prenatal Schedules
              </h1>
              <p className="text-gray-900 sm font-medium">
                WHO 8-Visit Prenatal Schedule Calendar
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => setShowPrenatalModal(true)}
              >
<CalendarPlus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 border border-[#F891A5]/30 rounded-xl">
                <Clock className="h-4 w-4 text-gray-900" />
                <span className="text-sm font-medium text-gray-900">Today: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* WHO 8-Visit Schedule with Today's Visits - Upper Section */}
        <div className="mb-6 grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* WHO Schedule - 3/4 width */}
          <div className="xl:col-span-3">
            <div className="bg-white/95 backdrop-blur-sm border-2 border-[#FDB3C2]/30 rounded-2xl shadow-xl shadow-[#E56D85]/10">
              <div className="px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border-b-2 border-[#A41F39]/20 rounded-t-2xl">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-white mr-2" />
                  <h3 className="text-lg font-bold text-white">WHO 8-Visit Schedule</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {whoSchedule.map((visit) => (
                    <div key={visit.number} className="bg-gradient-to-br from-[#FDB3C2]/10 to-[#F891A5]/10 border-2 border-gray-900 rounded-lg p-3 hover:shadow-md hover:border-[#E56D85]/50 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-7 h-7 bg-gradient-to-r from-[#E56D85] to-[#BF3853] rounded-full flex items-center justify-center text-white font-bold text-xs mr-2.5">
                            {visit.number}
                          </div>
                          <div className="font-semibold text-[12px] text-gray-900">
                            Visit {visit.number}
                          </div>
                        </div>
                        <div className="px-2 py-0.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white text-[10px] font-bold rounded-full">
                          {visit.week}
                        </div>
                      </div>
                    <div className="text-xs text-gray-900 leading-tight">
                        {visit.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Visits - 1/4 width side panel */}
          <div className="xl:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm border-2 border-[#FDB3C2]/30 rounded-2xl shadow-xl shadow-[#E56D85]/10">
              <div className="px-4 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border-b-2 border-[#A41F39]/20 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-white mr-2" />
                    <h3 className="text-lg font-bold text-white">Today's Visits</h3>
                    <span className="ml-2 text-[11px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                      {todaysVisits.length}
                    </span>
                  </div>
                  {todaysVisits.length > 3 && (
                    <button
                      onClick={() => setShowTodaysModal(true)}
                      className="text-[11px] font-semibold text-white/95 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors"
                    >
                      View all
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3">
                {todaysVisits.length > 0 ? (
                  <div className="space-y-3">
                    {todaysVisits.slice(0, 3).map((visit) => (
                      <div 
                        key={visit.id} 
                        className={`flex items-center justify-between p-2 bg-gradient-to-r from-[#FDB3C2]/10 to-[#F891A5]/10 border border-gray-900 rounded-lg transition-all duration-200 ${
                          visit.status === 'Scheduled' ? 'cursor-pointer hover:shadow-md hover:border-[#E56D85]/50' : 'cursor-default'
                        }`}
                        onContextMenu={(e) => handleVisitRightClick(e, visit)}
                        title={visit.status === 'Scheduled' ? 'Right-click to change status' : `Status: ${visit.status}`}
                      >
                        <div>
                          <div className="font-semibold text-sm text-gray-900">
                            {visit.patient.first_name} {visit.patient.last_name}
                          </div>
                          <div className="text-xs text-gray-900 font-medium">{visit.visit_name}</div>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(visit.status)}`}>
                          {visit.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-900 text-sm font-medium text-center py-4">No visits for today</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-stretch">
          {/* Main Calendar */}
          <div className="xl:col-span-3">
            {/* Calendar */}
            <div className="bg-white/95 backdrop-blur-sm border-2 border-[#FDB3C2]/30 rounded-2xl shadow-2xl shadow-[#E56D85]/10 h-full">
              {/* Calendar Header - Compact */}
              <div className="px-4 py-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border-b border-[#A41F39]/20 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 border border-white/30 rounded-lg text-sm font-bold text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  >
                    ←
                  </button>
                  <h2 className="text-lg font-bold text-white">
                    {formatDate(selectedDate)}
                  </h2>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 border border-white/30 rounded-lg text-sm font-bold text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-3">
                {loading && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E56D85]"></div>
                    <span className="ml-2 text-sm text-gray-900 font-medium">Loading calendar...</span>
                  </div>
                )}

                {error && (
                  <div className="bg-gradient-to-r from-red-50/80 to-red-100/80 border-2 border-red-300 rounded-xl p-4 mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="ml-2 text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-0.5 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-bold text-gray-900 bg-gradient-to-r from-[#FDB3C2]/10 to-[#F891A5]/10 rounded-md">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: getFirstDayOfMonth(selectedDate) }, (_, i) => (
                    <div key={`empty-${i}`} className="h-24 border border-[#FDB3C2]/30 rounded-lg"></div>
                  ))}
                  
                  {/* Days of the month */}
                  {Array.from({ length: getDaysInMonth(selectedDate) }, (_, i) => {
                    const day = i + 1;
                    const visits = getVisitsForDate(day);
                    const isCurrentDay = isToday(day);
                    
                    return (
                      <div
                        key={day}
                        className={`h-24 border border-[#FDB3C2]/30 p-1.5 rounded-lg transition-all duration-200 overflow-visible relative ${
                          isCurrentDay ? 'bg-gradient-to-br from-[#E56D85]/10 to-[#BF3853]/10 border-[#E56D85]' : 'hover:bg-gradient-to-br hover:from-[#FDB3C2]/10 hover:to-[#F891A5]/5'
                        }`}
                      >
                        <div className={`text-xs font-semibold ${isCurrentDay ? 'font-bold text-gray-900' : 'text-gray-900'}`}>
                          {day}
                        </div>
                        
                        {/* Visit indicators */}
                        <div className="mt-0.5 space-y-0.5">
                          {visits.slice(0, 1).map((visit, idx) => (
                            <div
                              key={idx}
                              className={`relative group text-[10px] px-1.5 py-0.5 rounded-md cursor-pointer transition-all duration-200 hover:shadow-sm font-medium border ${
                                visit.status === 'Completed' 
                                  ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 hover:shadow-green-200/50' 
                                  : visit.status === 'Scheduled' 
                                  ? 'bg-gradient-to-r from-[#FDB3C2]/40 to-[#F891A5]/40 text-[#A41F39] border-[#F891A5] hover:shadow-[#F891A5]/30 hover:from-[#FDB3C2]/60 hover:to-[#F891A5]/60' 
                                  : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 hover:shadow-red-200/50'
                              }`}
                              onContextMenu={(e) => handleVisitRightClick(e, visit)}
                              title={visit.status === 'Scheduled' ? 'Right-click to change status' : `Status: ${visit.status}`}
                            >
                              {/* Patient Name */}
                              <div className="font-semibold text-[10px] truncate">
                                {visit.patient.first_name} {visit.patient.last_name}
                              </div>
                              
                              {/* Visit Details */}
                              <div className="hidden md:flex items-center justify-between text-[9px] opacity-80">
                                <span className="truncate">
                                  Visit {visit.visit_number}: {visit.visit_name}
                                </span>
                                <span className="ml-1 px-1 py-0.5 bg-black/10 rounded text-[9px] font-bold whitespace-nowrap">
                                  {visit.recommended_week}w
                                </span>
                              </div>
                              
                              {/* Hover tooltip inside calendar */}
                              <div className="absolute left-0 top-full mt-1 w-56 bg-[#A41F39] text-white p-2.5 rounded-md shadow-xl border border-[#BF3853] z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <div className="flex items-center space-x-2 mb-1.5">
                                  <User className="h-3 w-3 text-[#FDB3C2]" />
                                  <span className="font-semibold text-[11px]">
                                    {visit.patient.first_name} {visit.patient.last_name}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Hash className="h-3 w-3 text-[#F891A5]" />
                                  <span className="text-xs text-[#FDB3C2]">
                                    Visit {visit.visit_number}: {visit.visit_name}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <ClockIcon className="h-3 w-3 text-[#E56D85]" />
                                  <span className="text-[11px] text-[#FDB3C2]">
                                    Recommended at week {visit.recommended_week}
                                  </span>
                                </div>
                                {/* Arrow */}
                                <div className="absolute bottom-full left-4 transform">
                                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#A41F39]"></div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {visits.length > 1 && (
                            <div className="text-[10px] text-gray-900 font-medium bg-[#FDB3C2]/20 px-1.5 py-0.5 rounded-md border border-gray-900">
                              +{visits.length - 1} more visit{visits.length - 1 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="h-full">
            {/* Upcoming Visits */}
            <div className="bg-white/95 backdrop-blur-sm border-2 border-[#FDB3C2]/30 rounded-2xl shadow-xl shadow-[#E56D85]/10 h-full flex flex-col">
              <div className="px-4 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border-b-2 border-[#A41F39]/20 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-white mr-2" />
                    <h3 className="text-lg font-bold text-white">Upcoming Visits</h3>
                  </div>
                  {upcomingVisits.length > 6 && (
                    <button
                      onClick={() => setShowUpcomingModal(true)}
                      className="text-[11px] font-semibold text-white/95 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors"
                    >
                      View all
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3 flex-1 overflow-y-auto">
                {upcomingVisits.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingVisits.slice(0, 6).map((visit) => (
                      <div 
                        key={visit.id} 
                        className={`border-l-4 pl-3 py-2 bg-gradient-to-r from-[#FDB3C2]/10 to-[#F891A5]/5 border border-gray-900 rounded-r-lg transition-all duration-200 ${
                          visit.status === 'Scheduled' ? 'cursor-pointer hover:shadow-md hover:border-[#E56D85]/50' : 'cursor-default'
                        }`}
                        onContextMenu={(e) => handleVisitRightClick(e, visit)}
                        title={visit.status === 'Scheduled' ? 'Right-click to change status' : `Status: ${visit.status}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-sm text-gray-900">
                            {visit.patient.first_name} {visit.patient.last_name}
                          </div>
                          <div className="text-[10px] text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] px-2 py-0.5 rounded-full font-bold">
                            Visit {visit.visit_number}
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-900 mb-1 font-medium leading-tight">
                          {visit.visit_name} - {visit.recommended_week}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-900 font-medium">
                            📅 {(() => {
                              // Normalize to local date first, then format
                              const ymd = normalizeYMD(visit.scheduled_date);
                              const [year, month, day] = ymd.split('-');
                              const date = new Date(year, month - 1, day);
                              return date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              });
                            })()}
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusColor(visit.status)
                          }`}>
                            {visit.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {upcomingVisits.length > 6 && (
                      <div className="text-center py-2">
                        <span className="text-xs text-gray-900 font-medium">+{upcomingVisits.length - 6} more visits...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-gray-900 mx-auto mb-2" />
                    <p className="text-gray-900 text-sm font-medium">No upcoming visits scheduled</p>
                    <p className="text-gray-900 text-xs mt-1">Create a Visit 1 prenatal form to auto-schedule visits</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Prenatal Schedule Modal */}
      <PrenatalScheduleModal
        isOpen={showPrenatalModal}
        onClose={() => setShowPrenatalModal(false)}
        onScheduleCreated={handleCreateSchedule}
        birthcareId={birthcare_Id}
      />
      
      {/* Today's Visits Modal */}
      <TodaysVisitsModal
        isOpen={showTodaysModal}
        onClose={() => setShowTodaysModal(false)}
        visits={todaysVisits}
        onVisitRightClick={handleVisitRightClick}
        getStatusColor={getStatusColor}
      />
      
      {/* Upcoming Visits Modal */}
      <UpcomingVisitsModal
        isOpen={showUpcomingModal}
        onClose={() => setShowUpcomingModal(false)}
        visits={upcomingVisits}
        onVisitRightClick={handleVisitRightClick}
        getStatusColor={getStatusColor}
        normalizeYMD={normalizeYMD}
      />
      
      {/* Visit Log Modal */}
      <VisitLogModal
        isOpen={showVisitLogModal}
        onClose={() => {
          setShowVisitLogModal(false);
          setSelectedVisitForLog(null);
        }}
        visit={selectedVisitForLog}
        onConfirmStatusChange={handleConfirmStatusChange}
      />
      
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

export default PrenatalChartPage;
