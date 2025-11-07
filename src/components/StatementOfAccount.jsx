import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import axios from '@/lib/axios';
import PaymentModal from './PaymentModal';
import CustomDialog from './CustomDialog';

const StatementOfAccount = ({ patient, birthcareId, onBack, isModal = false }) => {
  const [soaData, setSoaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState('Current Admission');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [soaRefNo, setSoaRefNo] = useState('SOA-' + Date.now());
  const [philhealthNo, setPhilhealthNo] = useState('');
  const [facilityData, setFacilityData] = useState(null);
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  useEffect(() => {
    if (patient) {
      fetchStatementData();
      fetchFacilityData();
    }
  }, [patient, birthcareId]);

  const fetchStatementData = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcareId}/payments/soa`, {
        params: {
          patient_id: patient.id
        }
      });
      if (response.data.success) {
        console.log('SOA API Response Data:', response.data.data);
        console.log('Itemized charges:', response.data.data.itemized_charges);
        console.log('Totals:', response.data.data.totals);
        
        setSoaData(response.data.data);
        // Set billing period based on admission data
        if (response.data.data.admission) {
          const admissionDate = new Date(response.data.data.admission.admission_date);
          const periodLabel = `${admissionDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}`;
          setBillingPeriod(periodLabel);
        }
      }
    } catch (error) {
      console.error('Error fetching SOA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilityData = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcareId}`);
      if (response.data.success || response.data.id) {
        const facility = response.data.success ? response.data.data : response.data;
        setFacilityData({
          name: facility.name?.toUpperCase() || 'HEALTH CARE FACILITY',
          description: facility.description || '',
          address: facility.owner?.address || facility.address || '',
          contact_number: facility.owner?.contact_number || facility.contact_number || ''
        });
      }
    } catch (error) {
      console.error('Error fetching facility data:', error);
      // Set default facility data
      setFacilityData({
        name: 'HEALTH CARE FACILITY',
        description: 'Health Care Services',
        address: '',
        contact_number: ''
      });
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    // Refresh the SOA data after successful payment
    fetchStatementData();
    console.log('Payment processed successfully:', paymentData);
  };

  const handleMakePayment = () => {
    setShowPaymentModal(true);
  };

  const handlePrintStatement = () => {
    // Directly use browser print for reliability and simplicity
    handleClientSidePrint();
  };
  
  const handlePrintStatementBlob = async () => {
    // Server-side PDF generation with blob response
    const response = await axios.get(`/api/birthcare/${birthcareId}/payments/soa/pdf`, {
      params: {
        patient_id: patient.id
      },
      responseType: 'blob',
      timeout: 30000 // 30 second timeout
    });

    // Create blob URL and open in new tab
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Open PDF in new tab
    const newWindow = window.open(url, '_blank');
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Popup blocked, offer browser print as alternative
      setDialog({
        isOpen: true,
        title: 'Popup Blocked',
        message: 'Popup was blocked by your browser. Would you like to use browser print instead?',
        type: 'warning',
        showCancel: true,
        confirmText: 'OK',
        cancelText: 'Cancel',
        onConfirm: () => {
          setDialog({ ...dialog, isOpen: false });
          handleClientSidePrint();
        }
      });
    }
    
    // Cleanup after a delay to ensure the new tab has loaded
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 2000);
  };
  
  const handleClientSidePrint = () => {
    setIsPrinting(true);
    try {
      // Create a new window with the statement content
      const printWindow = window.open('', '_blank');
      const printContent = generatePrintableHTML(charges, payments, grossAssessment, totalPayments, totalBalance);
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        // Don't close immediately to allow user to see print dialog
        setTimeout(() => {
          printWindow.close();
          setIsPrinting(false);
        }, 1000);
      };
    } catch (error) {
      console.error('Error with client-side printing:', error);
      setDialog({
        isOpen: true,
        title: 'Print Failed',
        message: 'Failed to open print dialog. Please try again.',
        type: 'error',
        confirmText: 'OK',
        onConfirm: () => setDialog({ ...dialog, isOpen: false })
      });
      setIsPrinting(false);
    }
  };
  
  const generatePrintableHTML = (chargesData, paymentsData, gross, totalPay, balance) => {
    // Build simplified printable SOA similar to your screenshot
    const today = new Date();
    const formatDate = d => new Date(d).toLocaleDateString('en-US');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Statement of Account - ${patient.first_name} ${patient.last_name}</title>
      <style>
        @media print { body { margin: 0; } }
        body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #111; }
        .box { border: 1px solid #333; padding: 16px; }
        .header-box { border: 2px solid #333; padding: 16px; text-align: center; margin-bottom: 18px; }
        .facility-title { font-size: 16px; font-weight: 700; letter-spacing: .5px; }
        .facility-sub { font-size: 12px; margin-top: 4px; }
        .doc-title { margin-top: 10px; font-size: 14px; font-weight: 700; text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 6px 8px; font-size: 12px; }
        th { background: #f3f3f3; text-align: left; }
        .no-border td { border: none; }
        .right { text-align: right; }
        .center { text-align: center; }
        .summary { margin-top: 12px; }
        .summary .label { width: 50%; }
        .outstanding { color: #c0392b; font-weight: 700; }
        .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .sig-line { border-top: 1px solid #333; height: 1px; margin-top: 40px; }
        .muted { color: #555; font-size: 11px; }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header-box">
        <div class="facility-title">${facilityData?.name || 'HEALTH CARE FACILITY'}</div>
        <div class="facility-sub">${facilityData ? (
          facilityData.description || facilityData.address || 'Health Care Services'
        ) : 'Health Care Services'}${facilityData?.contact_number ? ' • ' + facilityData.contact_number : ''}</div>
        <div class="doc-title">STATEMENT OF ACCOUNT</div>
      </div>

      <!-- Patient information -->
      <table class="box" style="margin-bottom: 16px;">
        <tr>
          <td style="width: 25%;"><strong>Patient Name:</strong></td>
          <td>${patient.first_name} ${patient.last_name}</td>
          <td style="width: 15%;"><strong>Date:</strong></td>
          <td style="width: 25%;" class="right">${formatDate(today)}</td>
        </tr>
        <tr>
          <td><strong>Billing Period:</strong></td>
          <td>${billingPeriod}</td>
          <td><strong>SOA No.:</strong></td>
          <td class="right">${soaRefNo}</td>
        </tr>
      </table>

      <!-- Itemized charges -->
      <div class="box" style="margin-bottom: 16px;">
        <div style="font-weight:700; margin-bottom:8px;">ITEMIZED CHARGES</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="center" style="width:70px;">Qty</th>
              <th class="right" style="width:140px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${chargesData.map(c => `
              <tr>
                <td>${c.service_name}${c.description ? ` - ${c.description}` : ''}</td>
                <td class="center">${c.quantity || 1}</td>
                <td class="right">${formatCurrency(c.total_price)}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="2" style="font-weight:700;">TOTAL CHARGES</td>
              <td class="right" style="font-weight:700;">${formatCurrency(gross)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Payment history -->
      <div class="box" style="margin-bottom: 16px;">
        <div style="font-weight:700; margin-bottom:8px;">PAYMENT HISTORY</div>
        <table>
          <thead>
            <tr>
              <th style="width:140px;">Date</th>
              <th>Method</th>
              <th>Reference</th>
              <th class="right" style="width:140px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${paymentsData.length ? paymentsData.map(p => `
              <tr>
                <td>${formatDate(p.payment_date)}</td>
                <td>${getPaymentMethodLabel(p.payment_method)}</td>
                <td>${p.reference_number || ''}</td>
                <td class="right">${formatCurrency(p.amount)}</td>
              </tr>
            `).join('') : `
              <tr><td colspan="4" class="center muted">No payments recorded</td></tr>
            `}
            <tr>
              <td colspan="3" style="font-weight:700;">TOTAL PAYMENTS</td>
              <td class="right" style="font-weight:700;">${formatCurrency(totalPay)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div class="box summary">
        <table class="no-border">
          <tr class="no-border">
            <td class="label"><strong>Total Charges:</strong></td>
            <td class="right">${formatCurrency(gross)}</td>
          </tr>
          <tr class="no-border">
            <td class="label"><strong>Total Payments:</strong></td>
            <td class="right">${formatCurrency(totalPay)}</td>
          </tr>
          <tr class="no-border">
            <td class="label"><strong>OUTSTANDING BALANCE:</strong></td>
            <td class="right outstanding">${formatCurrency(Math.max(0, balance))}</td>
          </tr>
        </table>
      </div>

      <!-- Signatures -->
      <div class="signatures">
        <div>
          <div class="sig-line"></div>
          <div class="muted center" style="margin-top:6px;">Prepared by:<br/>Billing Clerk / Accountant</div>
        </div>
        <div>
          <div class="sig-line"></div>
          <div class="muted center" style="margin-top:6px;">Acknowledged by:<br/>Patient / Representative</div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFC] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="relative">
            <div className="inline-block rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#ff6b6b]" style={{animation: 'spin 1s linear infinite'}}></div>
          </div>
          <p className="mt-4 text-lg font-medium text-[#1b1b18]">Loading Statement</p>
          <p className="text-sm text-gray-500">Preparing your billing information...</p>
        </div>
      </div>
    );
  }

  // Data processing for charges and payments

  // Check if we have real data from the Patient Charges system
  const hasRealData = soaData?.itemized_charges && soaData.itemized_charges.length > 0;
  
  // Helper: resolve a charge date from multiple possible fields or from name text
  const getChargeDate = (charge) => {
    // Try various date field names that might exist in the data
    const possibleDateFields = [
      'date_added', 'added_at', 'created_at', 'createdAt', 'date_created', 'created',
      'charge_date', 'service_date', 'date', 'added', 'timestamp', 'updated_at', 'updatedAt'
    ];
    
    for (const field of possibleDateFields) {
      const raw = charge?.[field];
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // Nested shapes (e.g., added: { date: ... })
    if (charge?.added && typeof charge.added === 'object') {
      const raw = charge.added.date || charge.added.at || charge.added_on;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return d;
      }
    }
    
    // Try to extract date from service name (like "Semi-Private Room (2025-10-20)")
    if (typeof charge?.service_name === 'string') {
      const dateMatch = charge.service_name.match(/\((\d{4}-\d{2}-\d{2})\)/);
      if (dateMatch) {
        const d = new Date(dateMatch[1]);
        if (!isNaN(d.getTime())) return d;
      }
    }
    
    // Try to extract from description
    if (typeof charge?.description === 'string') {
      const dateMatch = charge.description.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const d = new Date(dateMatch[1]);
        if (!isNaN(d.getTime())) return d;
      }
    }
    
    return null;
  };
  
  // Only use real charges data from the API - no fallback sample data
  let charges = hasRealData ? (soaData.itemized_charges || []) : [];
  
  // Debug: Log charge data structure to console
  console.log('Raw charges data:', charges.map(c => ({
    service_name: c.service_name,
    all_fields: Object.keys(c),
    extracted_date: getChargeDate(c)?.toLocaleDateString()
  })));
  
  // Aggregate duplicate services by service_name to combine quantities
  const aggregatedChargesMap = {};
  charges.forEach(charge => {
    const key = charge.service_name;
    if (aggregatedChargesMap[key]) {
      // Add to existing service
      aggregatedChargesMap[key].quantity += (charge.quantity || 1);
      aggregatedChargesMap[key].total_price = parseFloat(aggregatedChargesMap[key].total_price) + parseFloat(charge.total_price || 0);
    } else {
      // Create new aggregated service
      aggregatedChargesMap[key] = {
        ...charge,
        quantity: charge.quantity || 1,
        total_price: parseFloat(charge.total_price || 0),
        unit_price: parseFloat(charge.unit_price || charge.total_price || 0)
      };
    }
  });
  
  // Convert back to array
  charges = Object.values(aggregatedChargesMap);
  
  // Sort charges in chronological order (oldest first)
  charges = charges.sort((a, b) => {
    const dateA = getChargeDate(a)?.getTime();
    const dateB = getChargeDate(b)?.getTime();
    const safeA = dateA ?? Number.POSITIVE_INFINITY; // undated go last
    const safeB = dateB ?? Number.POSITIVE_INFINITY;
    
    console.log('Comparing:', {
      a: a.service_name,
      b: b.service_name,
      dateA: dateA ? new Date(dateA).toLocaleDateString() : 'no date',
      dateB: dateB ? new Date(dateB).toLocaleDateString() : 'no date',
      result: safeA - safeB > 0 ? 'b comes first' : 'a comes first'
    });
    
    return safeA - safeB; // Ascending order (oldest first)
  });
  
  console.log('Final sorted order:', charges.map(c => c.service_name));
  
  const payments = hasRealData ? (soaData.payment_history || []) : [];
  
  // Use API totals if available and valid, otherwise calculate
  // Backend now returns current_charges with ALL itemized charges (including room)
  const grossAssessment = hasRealData && soaData?.totals?.current_charges 
    ? soaData.totals.current_charges 
    : charges.reduce((sum, charge) => sum + (charge.total_price || 0), 0);
    
  const totalPayments = hasRealData && soaData?.totals?.current_payments 
    ? soaData.totals.current_payments 
    : payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
  // Use outstanding_balance which now includes all charges (room + services)
  // This is the accurate balance for payment processing
  const totalBalance = hasRealData && typeof soaData?.totals?.outstanding_balance === 'number' 
    ? soaData.totals.outstanding_balance
    : hasRealData && typeof soaData?.totals?.active_balance === 'number' 
    ? soaData.totals.active_balance 
    : (grossAssessment - totalPayments);

  return (
    <div className={isModal ? "bg-white text-black rounded-2xl overflow-hidden shadow-lg" : "min-h-screen bg-white text-black"}>
      {/* Header Bar */}
      {!isModal && (
        <div className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Title */}
              <div>
                <h1 className="text-xl font-bold text-black">Statement of Account</h1>
                <p className="text-sm text-gray-600">
                  {patient.first_name} {patient.last_name} • {new Date().toLocaleDateString()}
                </p>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintStatement}
                  disabled={isGeneratingPDF || isPrinting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black transition-all duration-300 hover:scale-105 hover:shadow-md transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                  <PrinterIcon className="w-4 h-4 transition-transform duration-300 hover:rotate-12" />
                  {isGeneratingPDF ? 'Generating...' : isPrinting ? 'Printing...' : 'Print'}
                </button>
                {totalBalance > 0 && (
                  <button
                    onClick={handleMakePayment}
                    disabled={showPaymentModal}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#E56D85] hover:bg-[#F891A5] text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    <span className="transition-transform duration-300 hover:translate-x-1">Make Payment</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isModal ? "min-h-[85vh] py-6" : "pt-24 pb-8"}>
        <div className={`${isModal ? "max-w-none px-8 h-full" : "max-w-7xl mx-auto px-6"}` }>
          {/* Modal Header - Only shown in modal mode */}
          {isModal && (
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Title */}
                <div>
                  <h1 className="text-xl font-bold text-black">Statement of Account</h1>
                  <p className="text-sm text-gray-600">
                    {patient.first_name} {patient.last_name} • {new Date().toLocaleDateString()}
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrintStatement}
                    disabled={isGeneratingPDF || isPrinting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A41F39] hover:bg-[#A41F39] text-white transition-all duration-300 hover:scale-105 hover:shadow-md transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    <PrinterIcon className="w-4 h-4 transition-transform duration-300 hover:rotate-12" />
                    {isGeneratingPDF ? 'Generating...' : isPrinting ? 'Printing...' : 'Print'}
                  </button>
                  {totalBalance > 0 && (
                    <button
                      onClick={handleMakePayment}
                      disabled={showPaymentModal}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#A41F39] hover:bg-[#A41F39] text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                      <span className="transition-transform duration-300 hover:translate-x-1">Make Payment</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Patient Info Card */}
          <div className={`bg-white rounded-lg p-6 ${isModal ? "border-0" : "mb-8 border border-gray-200 shadow-sm"}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Patient Name
                </label>
                <p className="text-lg font-semibold text-black">
                  {patient.first_name} {patient.last_name}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Statement Date
                </label>
                <p className="text-lg font-semibold text-black">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Billing Period
                </label>
                <p className="text-lg font-semibold text-black">
                  {billingPeriod.replace('Admission ', '')}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  SOA Reference
                </label>
                <p className="text-lg font-semibold text-black">
                  {soaRefNo}
                </p>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 xl:grid-cols-3 ${isModal ? "gap-6" : "gap-8"}`}>
            {/* Medical Charges - Takes up 2 columns */}
            <div className="xl:col-span-2">
              <div className={`bg-white rounded-lg ${isModal ? "border border-gray-500" : "border border-gray-500 shadow-sm"}`}>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Medical Charges
                  </h2>
                </div>
                
                <div className="p-6">
                  {charges.length > 0 ? (
                    <div className="space-y-4">
                      {charges.map((charge, index) => (
                        <div key={charge.id || charge.service_name + index || index} 
                             className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border border-gray-300 hover:border-gray-200 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium text-black">
                              {charge.service_name}
                            </div>
                            {charge.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {charge.description}
                              </div>
                            )}
                            {charge.quantity > 1 && (
                              <div className="text-xs text-green-600 mt-1">
                                Qty: {charge.quantity} × {formatCurrency(charge.unit_price)}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(charge.total_price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-600 mb-2">No charges recorded</div>
                      <div className="text-sm text-gray-500">Medical charges will appear here when added</div>
                    </div>
                  )}
                  
                  {/* Total Charges */}
                  <div className="mt-6 pt-6 border-t border-gray-300">
                    <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <span className="text-lg font-semibold text-black">Total Charges</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(grossAssessment)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Payments & Summary */}
            <div className={isModal ? "space-y-6" : "space-y-8"}>
              {/* Payments */}
              <div className={`bg-white rounded-lg ${isModal ? "border border-gray-500" : "border border-gray-500 shadow-sm"}`}>
                <div className="px-6 py-4 border-b border-gray-500">
                  <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Payments
                  </h2>
                </div>
                
                <div className="p-6">
                  {payments && payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((payment, index) => (
                        <div key={index} className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-black">
                                {getPaymentMethodLabel(payment.payment_method)}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </div>
                              {payment.reference_number && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Ref: {payment.reference_number}
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-gray-600">No payments yet</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Balance Summary */}
              <div className={`bg-white rounded-lg ${isModal ? "border border-gray-500" : "border border-gray-500 shadow-sm"}`}>
                <div className="px-6 py-4 border-b border-gray-500">
                  <h2 className="text-lg font-semibold text-black">Balance Summary</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Total Charges</span>
                    <span className="font-semibold text-green-600">{formatCurrency(grossAssessment)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Total Payments</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalPayments)}</span>
                  </div>
                  <div className="border-t border-gray-500 py-2">
                    <div className="flex justify-between items-center">
                      <span className="text-l font-semibold text-black">Outstanding Balance</span>
                      <span className={`text-l font-bold ${
                        totalBalance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(Math.max(0, totalBalance))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          patient={patient}
          billData={soaData?.current_bill}
          outstandingBalance={totalBalance}
          birthcareId={birthcareId}
          birthCareInfo={facilityData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      
      {/* Custom Dialog */}
      <CustomDialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText || 'OK'}
        cancelText={dialog.cancelText || 'Cancel'}
        showCancel={dialog.showCancel || false}
      />
    </div>
  );
};

// Helper function to get payment method labels
const getPaymentMethodLabel = (method) => {
  const labels = {
    'cash': 'Cash Payment',
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'bank_transfer': 'Bank Transfer',
    'check': 'Check Payment',
    'insurance': 'Insurance',
    'philhealth': 'PhilHealth Benefits',
    'dswd': 'DSWD Assistance',
    'doh': 'DOH Assistance',
    'hmo': 'HMO Benefits',
    'private': 'Private Payment',
    'others': 'Other Payment'
  };
  return labels[method] || method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Payment';
};

export default StatementOfAccount;