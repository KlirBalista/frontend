import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import axios from '@/lib/axios';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  patient, 
  billData,
  outstandingBalance, 
  birthcareId,
  birthCareInfo,
  onPaymentSuccess 
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  // Generate initial reference number when modal opens
  useEffect(() => {
    if (isOpen && !formData.reference_number) {
      setFormData(prev => ({
        ...prev,
        reference_number: generateReferenceNumber(prev.payment_method)
      }));
    }
  }, [isOpen]);

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: BanknotesIcon },
    { value: 'check', label: 'Check', icon: DocumentTextIcon },
    { value: 'philhealth', label: 'PhilHealth Benefits', icon: DocumentTextIcon },
    { value: 'dswd', label: 'DSWD Assistance', icon: DocumentTextIcon },
    { value: 'hmo', label: 'HMO Benefits', icon: DocumentTextIcon },
    { value: 'others', label: 'Other', icon: DocumentTextIcon }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const generateReferenceNumber = (paymentMethod) => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const prefixes = {
      'cash': 'CASH',
      'credit_card': 'CC',
      'debit_card': 'DC', 
      'bank_transfer': 'BT',
      'check': 'CHK',
      'philhealth': 'PH',
      'dswd': 'DSWD',
      'hmo': 'HMO',
      'others': 'OTH'
    };
    
    const prefix = prefixes[paymentMethod] || 'REF';
    return `${prefix}-${date}-${random}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-generate reference number when payment method changes
    if (name === 'payment_method') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        reference_number: generateReferenceNumber(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError(''); // Clear error when user types
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        amount: value
      }));
      setError('');
    }
  };

  const validateForm = () => {
    const amount = parseFloat(formData.amount);
    
    if (!formData.amount || amount <= 0) {
      return 'Please enter a valid payment amount.';
    }
    
    if (amount > outstandingBalance) {
      return `Payment amount cannot exceed outstanding balance of ${formatCurrency(outstandingBalance)}.`;
    }
    
    if (!formData.payment_date) {
      return 'Please select a payment date.';
    }
    
    // Validate reference number for certain payment methods
    if (['check'].includes(formData.payment_method) && !formData.reference_number.trim()) {
      return 'Reference number is required for this payment method.';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Process payment through the API
      const response = await axios.post(`/api/birthcare/${birthcareId}/payments/process`, {
        patient_id: patient.id,
        bill_id: billData?.id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        reference_number: formData.reference_number.trim() || null,
        notes: formData.notes.trim() || null
      });

      if (response.data.success) {
        setPaymentData(response.data.data);
        setSuccess(true);
        setTimeout(() => {
          onPaymentSuccess?.(response.data.data);
          onClose();
          setSuccess(false);
          setPaymentData(null);
          setFormData({
            amount: '',
            payment_method: 'cash',
            reference_number: '',
            notes: '',
            payment_date: new Date().toISOString().split('T')[0]
          });
        }, 3000);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setError(
        error.response?.data?.message || 
        'Failed to process payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayFullAmount = () => {
    setFormData(prev => ({
      ...prev,
      amount: outstandingBalance.toString()
    }));
  };

  const generateReceipt = (paymentInfo) => {
    // Helpers
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const toWords = (num) => {
      const ones = ['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN'];
      const tens = ['','','TWENTY','THIRTY','FORTY','FIFTY','SIXTY','SEVENTY','EIGHTY','NINETY'];
      const chunk = (n) => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n/10)] + (n%10? ' ' + ones[n%10] : '');
        if (n < 1000) return ones[Math.floor(n/100)] + ' HUNDRED' + (n%100? ' ' + chunk(n%100) : '');
        return '';
      };
      if (num === 0) return 'ZERO';
      let result = '';
      const millions = Math.floor(num/1000000); num %= 1000000;
      const thousands = Math.floor(num/1000); const hundreds = num%1000;
      if (millions) result += chunk(millions) + ' MILLION ';
      if (thousands) result += chunk(thousands) + ' THOUSAND ';
      if (hundreds) result += chunk(hundreds);
      return result.trim();
    };

    const amountPaid = parseFloat(formData.amount || 0);
    const prevBalance = Number(outstandingBalance || 0);
    const remaining = typeof paymentInfo?.remaining_balance === 'number' ? paymentInfo.remaining_balance : Math.max(prevBalance - amountPaid, 0);
    const methodLabel = getPaymentMethodLabel(formData.payment_method);
    const paymentDateStr = new Date(formData.payment_date).toLocaleDateString('en-US');
    const reference = formData.reference_number || paymentInfo?.payment?.reference_number || '';
    const receiptNo = paymentInfo?.payment?.payment_number || reference || 'N/A';
    const amountWords = `${toWords(Math.round(amountPaid))} PESOS`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Official Receipt - ${patient.first_name} ${patient.last_name}</title>
      <style>
        @media print { body { margin: 0; } }
        body { font-family: 'Courier New', Courier, monospace; color: #111; margin: 24px; font-size: 12px; }
        .line { border-top: 1px solid #000; margin: 12px 0; }
        .header { text-align: center; line-height: 1.4; }
        .title { font-weight: 700; }
        .sub { font-size: 11px; }
        .box { border: 1px solid #000; padding: 10px; margin-top: 12px; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; }
        .label { width: 160px; }
        .right { text-align: right; }
        .center { text-align: center; }
        .amount-box { border: 1px solid #000; padding: 16px; margin-top: 12px; }
        .amount { font-size: 18px; font-weight: 700; text-align: center; }
        .muted { color: #555; }
        .sig { margin-top: 32px; text-align: center; }
        .sig .line { margin: 24px 0 6px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">OFFICIAL RECEIPT</div>
        <div class="title" style="margin-top:6px;">${birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY'}</div>
        <div class="sub">${birthCareInfo?.description || ''}</div>
      </div>

      <div class="line"></div>

      <table>
        <tr>
          <td class="label">Receipt No.:</td>
          <td>${receiptNo}</td>
          <td class="label right">Date:</td>
          <td class="right">${dateStr}</td>
        </tr>
        <tr>
          <td class="label">Time:</td>
          <td>${timeStr}</td>
          <td class="label right">Patient:</td>
          <td class="right">${patient.first_name} ${patient.last_name}</td>
        </tr>
      </table>

      <div class="box">
        <div class="center" style="font-weight:700; margin-bottom:6px;">PAYMENT DETAILS</div>
        <table>
          <tr>
            <td class="label">Payment Method:</td>
            <td>${methodLabel}</td>
            <td class="label right">Reference Number:</td>
            <td class="right">${reference || '—'}</td>
          </tr>
          <tr>
            <td class="label">Payment Date:</td>
            <td>${paymentDateStr}</td>
            <td></td><td></td>
          </tr>
        </table>
      </div>

      <div class="amount-box">
        <div class="center" style="font-weight:700;">AMOUNT RECEIVED</div>
        <div class="amount">${formatCurrency(amountPaid)}</div>
        <div class="center muted" style="margin-top:6px;">(${amountWords})</div>
      </div>

      <div class="box">
        <table>
          <tr>
            <td class="label">Previous Balance:</td>
            <td class="right">${formatCurrency(prevBalance)}</td>
          </tr>
          <tr>
            <td class="label">Payment:</td>
            <td class="right">${formatCurrency(amountPaid)}</td>
          </tr>
          <tr>
            <td class="label">Remaining Balance:</td>
            <td class="right">${formatCurrency(remaining)}</td>
          </tr>
        </table>
      </div>

      <div class="line"></div>

      <div class="sig">
        <div class="line"></div>
        <div class="muted">Authorized Signature</div>
      </div>

      <div class="center" style="margin-top:16px;">Thank you for your payment!</div>
      <div class="center muted" style="margin-top:6px;">This is an official receipt. Please keep for your records.</div>
    </body>
    </html>`;

    return html;
  };

  const printReceipt = (paymentInfo) => {
    try {
      const printWindow = window.open('', '_blank');
      const receiptContent = generateReceipt(paymentInfo);
      
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        // Close the print window after a short delay
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  // Helper function for payment method labels (if not imported)
  const getPaymentMethodLabel = (method) => {
    const labels = {
      'cash': 'Cash Payment',
      'credit_card': 'Credit Card',
      'debit_card': 'Debit Card',
      'bank_transfer': 'Bank Transfer',
      'check': 'Check Payment',
      'philhealth': 'PhilHealth Benefits',
      'dswd': 'DSWD Assistance',
      'hmo': 'HMO Benefits',
      'others': 'Other Payment'
    };
    return labels[method] || method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Payment';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-auto w-11/12 max-w-md">
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-black">Process Payment</h1>
              </div>
            </div>
          </div>

        {success ? (
          // Success State
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Payment Processed Successfully!</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <p className="text-sm text-gray-700">
                Payment of <span className="font-semibold text-green-600">{formatCurrency(parseFloat(formData.amount))}</span> has been recorded.
              </p>
              {paymentData && (
                <p className="text-sm text-gray-600 mt-1">
                  Receipt #{paymentData.payment?.payment_number}
                </p>
              )}
            </div>
            <button
              onClick={() => paymentData && printReceipt(paymentData)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black transition-all duration-300 hover:scale-105 hover:shadow-md transform"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
          </div>
        ) : (
          // Payment Form
          <div className="p-6">
            {/* Patient Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-l">
                <div className="font-bold text-black">{patient.first_name} {patient.last_name}</div>
                <div className="text-gray-600 mt-1">Outstanding Balance: <span className="font-bold text-green-600">{formatCurrency(outstandingBalance)}</span></div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Payment Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-green-600 text-sm font-bold">₱</span>
                  </div>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="block w-full pl-8 pr-20 py-3 border border-gray-300 rounded-lg text-sm font-medium text-black"
                    required
                  />
                  <button
                    type="button"
                    onClick={handlePayFullAmount}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Pay Full
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Payment Method *
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg text-sm font-medium text-black"
                  required
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg text-sm font-medium text-black"
                  required
                />
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Reference Number (Auto-generated)
                  {['check'].includes(formData.payment_method) && (
                    <span className="text-red-600"> *</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleInputChange}
                    placeholder="Auto-generated reference number"
                    className="block w-full px-3 pr-16 py-3 border border-gray-300 rounded-lg text-sm font-medium text-black bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, reference_number: generateReferenceNumber(prev.payment_method) }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    New
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Reference number is automatically generated. You can edit it or generate a new one.</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional notes about the payment"
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg text-sm text-black placeholder:text-gray-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-md transform"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-[#A41F39] hover:bg-[#A41F39] text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                  <span className="transition-transform duration-300 hover:translate-x-1">
                    {loading ? 'Processing...' : 'Process Payment'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;