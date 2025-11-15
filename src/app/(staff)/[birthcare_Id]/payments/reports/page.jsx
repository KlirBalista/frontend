"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';

export default function PaymentsReportsPage() {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: 'auth' });
  
  const [dashboardData, setDashboardData] = useState({
    summary: {
      total_bills: 0,
      total_revenue: 0,
      total_paid: 0,
      total_outstanding: 0,
      overdue_amount: 0,
      bills_by_status: {}
    },
    monthly_revenue: {},
    recent_bills: [],
    overdue_count: 0
  });

  // Print function that optimizes layout
  const handlePrint = () => {
    // Add print styles for a cleaner, A4-friendly PDF layout
    const printStyles = `
      @page {
        size: A4;
        margin: 20mm;
      }

      @media print {
        /* Hide sidebar and navigation */
        aside, nav, .sidebar, [class*="sidebar"] {
          display: none !important;
        }

        /* Hide interactive controls */
        button, input, select, .no-print {
          display: none !important;
        }

        /* Main container full-width */
        .max-w-7xl {
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Reset body for printing */
        body {
          margin: 0 !important;
          padding: 0 !important;
          font-size: 11pt !important;
          background: #ffffff !important;
        }

        /* Typography adjustments */
        h1, .text-3xl {
          font-size: 18pt !important;
          margin-bottom: 6px !important;
        }
        h2, .text-2xl, .text-xl {
          font-size: 14pt !important;
          margin-bottom: 4px !important;
        }
        h3, .text-lg {
          font-size: 12pt !important;
        }

        /* Remove excessive card shadows and colors */
        .bg-gray-50, .bg-white, [class*="bg-"] {
          background: #ffffff !important;
          box-shadow: none !important;
        }
        [class*="shadow"] {
          box-shadow: none !important;
        }

        /* Use single-column layout for grids so sections stack nicely */
        .grid {
          display: block !important;
        }
        .grid > * {
          width: 100% !important;
        }

        /* Tables */
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 10pt !important;
        }
        thead {
          background: #f3f4f6 !important;
        }
        th, td {
          border: 1px solid #d1d5db !important;
          padding: 6px 8px !important;
        }

        /* Ensure charts don't overflow page */
        svg {
          max-height: 300px !important;
        }

        /* Add some spacing between major sections */
        section, .mb-8, .mt-8 {
          page-break-inside: avoid;
          margin-bottom: 12px !important;
        }

        /* Manual page break helper */
        .page-break {
          page-break-after: always;
        }
      }
    `;

    // Add styles to head
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);

    // Trigger print
    window.print();

    // Clean up styles after printing
    setTimeout(() => {
      document.head.removeChild(styleSheet);
    }, 1000);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportsData, setReportsData] = useState({
    payment_methods: {},
    daily_collections: [],
    top_services: []
  });
  const [analyticsData, setAnalyticsData] = useState({
    revenue_trends: {
      growth_rate: 0,
      comparison_period: 'last_month',
      trend: 'stable'
    }
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // month, quarter, year

  // Fetch comprehensive payment analytics data
  const fetchPaymentAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const emptyDashboard = {
        summary: {
          total_bills: 0,
          total_revenue: 0,
          total_paid: 0,
          total_outstanding: 0,
          overdue_amount: 0,
          bills_by_status: {},
        },
        monthly_revenue: {},
        recent_bills: [],
        overdue_count: 0,
      };

      // Fetch multiple data sources in parallel
      const [dashboardResponse, reportsResponse, analyticsResponse] = await Promise.allSettled([
        axios.get(`/api/birthcare/${birthcare_Id}/payments/dashboard`),
        axios.get(`/api/birthcare/${birthcare_Id}/payments/reports`, {
          params: {
            start_date: dateRange.start,
            end_date: dateRange.end,
            period: selectedPeriod,
          },
        }),
        axios.get(`/api/birthcare/${birthcare_Id}/payments/analytics`, {
          params: {
            period: selectedPeriod,
          },
        }),
      ]);

      // ------- DASHBOARD DATA (with fallback) -------
      let effectiveDashboard = emptyDashboard;

      if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.data?.success) {
        const apiData = dashboardResponse.value.data.data || {};
        console.log('Dashboard API data:', apiData);
        effectiveDashboard = { ...emptyDashboard, ...apiData };
      } else {
        console.warn('Dashboard API failed, trying payments index fallback', {
          status: dashboardResponse.status,
          error: dashboardResponse.reason || dashboardResponse.value?.data,
        });

        // Fallback: use /payments index which also returns a summary
        try {
          const fallbackRes = await axios.get(`/api/birthcare/${birthcare_Id}/payments`, {
            params: { status: 'all', per_page: 50 },
          });

          if (fallbackRes.data?.success) {
            const bills = fallbackRes.data.data?.data || fallbackRes.data.data || [];
            const summary = fallbackRes.data.summary || emptyDashboard.summary;

            effectiveDashboard = {
              summary,
              // Use latest 5 bills as "recent bills"
              recent_bills: bills.slice(0, 5),
              monthly_revenue: {},
              overdue_count: summary.overdue_amount > 0 ? 1 : 0,
            };
          } else {
            console.warn('Payments index fallback did not return success, using empty dashboard data');
          }
        } catch (fallbackErr) {
          console.error('Payments index fallback failed:', fallbackErr);
        }
      }

      setDashboardData(effectiveDashboard);

      // ------- REPORTS DATA -------
      if (reportsResponse.status === 'fulfilled' && reportsResponse.value.data?.success) {
        setReportsData(reportsResponse.value.data.data || {});
      } else {
        console.warn('Reports API failed, using empty data', {
          status: reportsResponse.status,
          error: reportsResponse.reason || reportsResponse.value?.data,
        });
        setReportsData({
          payment_methods: {},
          daily_collections: [],
          top_services: [],
        });
      }

      // ------- ANALYTICS DATA -------
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.data?.success) {
        setAnalyticsData(analyticsResponse.value.data.data || {});
      } else {
        console.warn('Analytics API failed, calculating from available data');
        setAnalyticsData(calculateRealAnalyticsData(effectiveDashboard));
      }

    } catch (err) {
      console.error('Error fetching payment analytics:', err);
      setError('Unable to fetch payment data from server.');
      
      // Set empty data structures
      setDashboardData({
        summary: {
          total_bills: 0,
          total_revenue: 0,
          total_paid: 0,
          total_outstanding: 0,
          overdue_amount: 0,
          bills_by_status: {}
        },
        monthly_revenue: {},
        recent_bills: [],
        overdue_count: 0
      });
      setReportsData({
        payment_methods: {},
        daily_collections: [],
        top_services: []
      });
      setAnalyticsData({
        revenue_trends: {
          growth_rate: 0,
          comparison_period: 'last_month',
          trend: 'stable'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate real analytics data from actual monthly revenue
  const calculateRealAnalyticsData = (dashboardData) => {
    const monthlyRevenue = dashboardData?.monthly_revenue || {};
    const months = Object.keys(monthlyRevenue).map(Number).sort((a, b) => a - b);
    
    if (months.length < 2) {
      return {
        revenue_trends: {
          growth_rate: 0,
          comparison_period: 'last_month',
          trend: 'stable'
        }
      };
    }
    
    // Get current and previous month revenues
    const currentMonth = new Date().getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    
    const currentRevenue = Number(monthlyRevenue[currentMonth]) || 0;
    const previousRevenue = Number(monthlyRevenue[previousMonth]) || 0;
    
    // Calculate growth rate
    let growthRate = 0;
    let trend = 'stable';
    
    if (previousRevenue > 0) {
      growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
      trend = growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable';
    }
    
    return {
      revenue_trends: {
        growth_rate: growthRate,
        comparison_period: 'last_month',
        trend: trend
      }
    };
  };

  useEffect(() => {
    if (user && birthcare_Id) {
      fetchPaymentAnalytics();
    }
  }, [user, birthcare_Id, dateRange, selectedPeriod]);

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Handle date range changes
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const generateMonthlyChart = () => {
    // Use real monthly revenue data from API or fallback to 0
    const monthlyRevenue = dashboardData.monthly_revenue || {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const getMonthRevenue = (monthIndex) => {
      // Try different key formats that the backend might return
      const monthNumber = monthIndex + 1;
      const k1 = monthNumber; // numeric key (1..12)
      const k2 = String(monthNumber); // '1'..'12' 
      const k3 = String(monthNumber).padStart(2, '0'); // '01'..'12'
      
      // Get the value from the API response
      const val = monthlyRevenue[k1] ?? monthlyRevenue[k2] ?? monthlyRevenue[k3] ?? 0;
      return Number(val) || 0;
    };

    return months.map((month, index) => ({
      month,
      revenue: getMonthRevenue(index)
    }));
  };

  const getStatusSummary = () => {
    const billsByStatus = dashboardData.summary?.bills_by_status || {};
    return [
      { status: 'Draft', count: billsByStatus.draft || 0, color: 'bg-gray-100 text-gray-800' },
      { status: 'Sent', count: billsByStatus.sent || 0, color: 'bg-blue-100 text-blue-800' },
      { status: 'Partially Paid', count: billsByStatus.partially_paid || 0, color: 'bg-yellow-100 text-yellow-800' },
      { status: 'Paid', count: billsByStatus.paid || 0, color: 'bg-green-100 text-green-800' },
      { status: 'Overdue', count: billsByStatus.overdue || 0, color: 'bg-red-100 text-red-800' },
      { status: 'Cancelled', count: billsByStatus.cancelled || 0, color: 'bg-gray-100 text-gray-800' },
    ];
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading reports & analytics...</p>
        </div>
      </div>
    );
  }

  const summary = dashboardData.summary || {};
  const recentBills = dashboardData.recent_bills || [];
  const monthlyData = generateMonthlyChart();
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);
  const growthRateNum = Number(analyticsData.revenue_trends?.growth_rate ?? 0);
  const growthRateFormatted = `${growthRateNum > 0 ? '+' : ''}${growthRateNum.toFixed(1)}%`;
  const trendLabel = (analyticsData.revenue_trends?.trend || 'stable') === 'up' ? 'Increasing' : ((analyticsData.revenue_trends?.trend || 'stable') === 'down' ? 'Decreasing' : 'Stable');

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Enhanced Header with Controls */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">Payment Reports & Analytics</h1>
            <p className="text-sm text-gray-900 mt-1">Comprehensive payment analytics and financial insights</p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 no-print">
            {/* Date Range Picker */}
            <div className="flex gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="block w-full px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="block w-full px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-gray-900"
                />
              </div>
            </div>
            
            {/* Period Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="block w-full px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-gray-900"
              >
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            
            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchPaymentAnalytics}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-gradient-to-r from-[#BF3853]/10 to-[#A41F39]/10 border-2 border-[#BF3853]/50 text-[#A41F39] px-6 py-4 rounded-2xl mb-6 shadow-lg">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[#BF3853] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Total Payments</h3>
              <p className="text-3xl font-bold text-green-600">{summary.total_payments || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">₱{parseFloat(summary.total_revenue || 0).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center border border-green-200">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Outstanding</h3>
              <p className="text-3xl font-bold text-green-600">₱{parseFloat(summary.total_outstanding || 0).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center border border-amber-200">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Profit</h3>
              <p className="text-3xl font-bold text-green-600">₱{parseFloat(summary.total_paid || 0).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center border border-emerald-200">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 17l6-6 4 4 7-7M21 21H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Monthly Revenue Chart */}
      <div className="mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Monthly Revenue</h3>
              <p className="text-sm text-gray-900 mt-1">Revenue performance overview</p>
            </div>
          </div>
          
          {/* Simple Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-900">Current Month</div>
              <div className="text-lg font-bold text-green-600">
                ₱{(monthlyData[new Date().getMonth()]?.revenue || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-900">Highest</div>
              <div className="text-lg font-bold text-green-600">
                ₱{(monthlyData.reduce((max, current) => current.revenue > max.revenue ? current : max, monthlyData[0] || {}).revenue || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-900">Total</div>
              <div className="text-lg font-bold text-green-600">
                ₱{monthlyData.reduce((sum, data) => sum + data.revenue, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-3">
            {monthlyData.map((data, index) => {
              const currentMonthIndex = new Date().getMonth();
              const isCurrentMonth = index === currentMonthIndex;
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-8 text-sm font-medium text-gray-900">
                    {data.month}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-6 relative">
                      <div 
                        className={`h-6 rounded-full transition-all duration-300 ${
                          isCurrentMonth ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-start pl-3">
                          <span className="text-xs font-medium text-white">
                            ₱{data.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Collection Rate and Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Collection Rate */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Rate</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-900 mb-1">
                <span>Collected</span>
                <span>{summary.total_revenue ? ((summary.total_paid / summary.total_revenue) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full" 
                  style={{ 
                    width: summary.total_revenue ? 
                      `${(summary.total_paid / summary.total_revenue) * 100}%` : '0%' 
                  }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">₱{parseFloat(summary.total_paid || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-900">Collected</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">₱{parseFloat(summary.total_outstanding || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-900">Outstanding</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-900">Average Payment Amount</span>
              <span className="font-semibold text-green-600">
                ₱{summary.total_bills ? (summary.total_revenue / summary.total_bills).toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-900">Profit</span>
              <span className="font-semibold text-green-600">{formatCurrency(parseFloat(summary.total_paid || 0))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-900">Collection Rate</span>
              <span className="font-semibold text-green-600">
                {summary.total_revenue ? ((summary.total_paid / summary.total_revenue) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-900">Payments This Month</span>
              <span className="font-semibold text-green-600">{monthlyData[new Date().getMonth()]?.revenue ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Trend Line Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Monthly Revenue Trend</h3>
            <p className="text-sm text-gray-900 mt-1">Revenue performance over the year</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {(analyticsData.revenue_trends?.trend || 'stable') === 'down' ? '↘' : '↗'} 
              {growthRateFormatted}
            </div>
            <div className="text-xs text-gray-900">vs. last month</div>
          </div>
        </div>
        
        {/* Line Chart */}
        <div className="relative h-80">
          <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
            {/* Grid Lines */}
            <defs>
              <pattern id="grid" width="66.67" height="50" patternUnits="userSpaceOnUse">
                <path d="M 66.67 0 L 0 0 0 50" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Horizontal grid lines */}
            {[0, 1, 2, 3, 4, 5].map(i => (
              <line 
                key={i}
                x1="60" 
                y1={50 + (i * 40)} 
                x2="740" 
                y2={50 + (i * 40)}
                stroke="#e5e7eb" 
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}
            
            {/* Main trend line */}
            <polyline
              points={monthlyData.map((data, index) => {
                const chartBottom = 255; // matches y-position of ₱0 label
                const chartHeight = 200; // distance from ₱0 to top (₱max)
                const y = chartBottom - (data.revenue / maxRevenue) * chartHeight;
                return `${80 + (index * 55)},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {monthlyData.map((data, index) => {
              const currentMonthIndex = new Date().getMonth();
              const isCurrentMonth = index === currentMonthIndex;
              const cx = 80 + (index * 55);
              const chartBottom = 255; // matches y-position of ₱0 label
              const chartHeight = 200; // distance from ₱0 to top (₱max)
              const cy = chartBottom - (data.revenue / maxRevenue) * chartHeight;
              
              return (
                <g key={index}>
                  {/* Data point */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isCurrentMonth ? "6" : "4"}
                    fill="#3b82f6"
                    className="hover:r-7 transition-all duration-200 cursor-pointer drop-shadow-sm"
                  />
                  
                  {/* Current month highlight */}
                  {isCurrentMonth && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="8"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  )}
                  
                  {/* Tooltip on hover */}
                  <g className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <rect
                      x={cx - 35}
                      y={cy - 45}
                      width="70"
                      height="32"
                      rx="4"
                      fill="rgb(17, 24, 39)"
                      fillOpacity="0.9"
                    />
                    <text
                      x={cx}
                      y={cy - 32}
                      textAnchor="middle"
                      className="text-xs font-semibold fill-white"
                    >
                      {data.month}
                    </text>
                    <text
                      x={cx}
                      y={cy - 18}
                      textAnchor="middle"
                      className="text-xs fill-white"
                    >
                      ₱{(data.revenue / 1000).toFixed(0)}k
                    </text>
                  </g>
                </g>
              );
            })}
            
            {/* Y-axis labels */}
            {[0, 1, 2, 3, 4, 5].map(i => {
              const value = (maxRevenue / 5) * (5 - i);
              return (
                <text
                  key={i}
                  x="50"
                  y={55 + (i * 40)}
                  textAnchor="end"
                  className="text-xs font-medium fill-gray-500"
                >
                  {value > 0 ? `₱${Math.round(value).toLocaleString()}` : '₱0'}
                </text>
              );
            })}
            
            {/* X-axis labels */}
            {monthlyData.map((data, index) => (
              <text
                key={index}
                x={80 + (index * 55)}
                y="280"
                textAnchor="middle"
                  className={`text-xs font-medium ${
                  index === new Date().getMonth() ? 'fill-gray-900 font-bold' : 'fill-gray-900'
                }`}
              >
                {data.month}
              </text>
            ))}
          </svg>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-900">Highest Month</div>
            <div className="text-lg font-bold text-green-600">
              ₱{(monthlyData.reduce((max, current) => current.revenue > max.revenue ? current : max, monthlyData[0] || {}).revenue || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-900">{monthlyData.reduce((max, current) => current.revenue > max.revenue ? current : max, monthlyData[0] || {}).month}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-900">Average Monthly Change</div>
            <div className="text-lg font-bold text-green-600">
              {growthRateFormatted}
            </div>
            <div className="text-xs text-gray-900">vs. last month</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-900">Current Trend</div>
            <div className="text-lg font-bold text-green-600">
              {trendLabel}
            </div>
            <div className="text-xs text-gray-900">{growthRateFormatted}</div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Payment #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-900">
                    No recent payments found.
                  </td>
                </tr>
              ) : (
                recentBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.bill_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.patient?.first_name} {bill.patient?.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(bill.bill_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₱{parseFloat(bill.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                        bill.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                        bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        bill.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bill.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="mt-8 no-print">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report
            </button>
            
            <button
              onClick={fetchPaymentAnalytics}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            
            <div className="text-sm text-gray-900 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}