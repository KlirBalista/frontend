import React from 'react';

const DetailedPaymentSchedule = ({ 
  patientData, 
  charges = [], 
  payments = [], 
  adjustments = [], 
  totalCharges = 0 
}) => {
  // Calculate totals
  const grossAssessment = charges.reduce((sum, charge) => sum + (charge.total_amount || 0), 0);
  const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const totalAdjustments = adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0);
  const assessmentBalance = grossAssessment - totalPayments - totalAdjustments;

  // Group payments by date for better display
  const groupedPayments = payments.reduce((groups, payment) => {
    const date = new Date(payment.payment_date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short', 
      year: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(payment);
    return groups;
  }, {});

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Panel - Charges */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
            <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900">
                Medical Charges for {patientData?.period || new Date().getFullYear()}
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Individual Charges */}
              {charges.map((charge, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{charge.service_name}</div>
                    {charge.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {charge.description}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(charge.total_amount || charge.price || 0)}
                  </div>
                </div>
              ))}
              
              {/* Sample charges if none provided */}
              {charges.length === 0 && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Normal Delivery Package</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">₱25,000.00</div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Other Medical Fees</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Laboratory, Medicines, Room Accommodation
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">₱7,500.00</div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Miscellaneous Fees</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Medical Supplies, Documentation, Other Services
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">₱2,000.00</div>
                  </div>
                </>
              )}
              
              {/* Gross Assessment Total */}
              <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mt-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold text-gray-900">Gross Assessment</div>
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(grossAssessment || 34500)}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Panel - Payments and Adjustments */}
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
            <div className="bg-green-100 px-4 py-3 border-b border-green-200">
              <h3 className="text-sm font-semibold text-green-900">
                Payments and Adjustments for {patientData?.period || new Date().getFullYear()}
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Payment History */}
              {Object.entries(groupedPayments).map(([date, datePayments]) => (
                <div key={date} className="space-y-2">
                  <div className="bg-gray-100 px-3 py-2 rounded">
                    <div className="text-xs font-medium text-gray-700">
                      {date} | OR # {datePayments[0]?.reference_number || 'N/A'}
                    </div>
                  </div>
                  
                  {datePayments.map((payment, index) => (
                    <div key={index} className="ml-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">
                          {payment.description || getPaymentMethodLabel(payment.payment_method)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="ml-3 border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(datePayments.reduce((sum, p) => sum + p.amount, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Adjustments/Discounts */}
              {adjustments.map((adjustment, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-blue-100 px-3 py-2 rounded">
                    <div className="text-xs font-medium text-blue-700">
                      {new Date(adjustment.date).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })} | OR # {adjustment.reference_number || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="ml-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-900">
                        {adjustment.type} {adjustment.description && `- ${adjustment.description}`}
                      </span>
                      <span className="text-sm font-semibold text-blue-600">
                        -{formatCurrency(adjustment.amount)}
                      </span>
                    </div>
                    {adjustment.details && (
                      <div className="text-xs text-gray-500">{adjustment.details}</div>
                    )}
                  </div>
                  
                  <div className="ml-3 border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Adjustment</span>
                      <span className="text-sm font-semibold text-blue-600">
                        -{formatCurrency(adjustment.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Sample Payment Data if none provided */}
              {payments.length === 0 && adjustments.length === 0 && (
                <>
                  <div className="space-y-2">
                    <div className="bg-gray-100 px-3 py-2 rounded">
                      <div className="text-xs font-medium text-gray-700">
                        21 Jul, 2025 | OR # 3643
                      </div>
                    </div>
                    <div className="ml-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">Cash Payment</span>
                        <span className="text-sm font-semibold text-gray-900">₱15,000.00</span>
                      </div>
                    </div>
                    <div className="ml-3 border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Total</span>
                        <span className="text-sm font-semibold text-gray-900">₱15,000.00</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-blue-100 px-3 py-2 rounded">
                      <div className="text-xs font-medium text-blue-700">
                        09 Aug, 2025 | OR # DSWD Grant
                      </div>
                    </div>
                    <div className="ml-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">DSWD Assistance</span>
                        <span className="text-sm font-semibold text-blue-600">-₱5,000.00</span>
                      </div>
                      <div className="text-xs text-gray-500">Government assistance for medical expenses</div>
                    </div>
                    <div className="ml-3 border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Adjustment</span>
                        <span className="text-sm font-semibold text-blue-600">-₱5,000.00</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-gray-100 px-3 py-2 rounded">
                      <div className="text-xs font-medium text-gray-700">
                        20 Aug, 2025 | OR # 4700
                      </div>
                    </div>
                    <div className="ml-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">PhilHealth Benefits</span>
                        <span className="text-sm font-semibold text-blue-600">-₱8,000.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">Cash Payment</span>
                        <span className="text-sm font-semibold text-gray-900">₱6,500.00</span>
                      </div>
                    </div>
                    <div className="ml-3 border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Total</span>
                        <span className="text-sm font-semibold text-gray-900">₱6,500.00</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Total Payments and Adjustments */}
              <div className="bg-blue-100 border border-blue-300 rounded p-3 mt-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold text-blue-900">Total Payments and Adjustments</div>
                  <div className="text-sm font-bold text-blue-900">
                    {formatCurrency(totalPayments + totalAdjustments || 29500)}
                  </div>
                </div>
              </div>
              
              {/* Assessment Balance */}
              <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold text-yellow-900">Assessment Balance</div>
                  <div className="text-sm font-bold text-yellow-900">
                    {formatCurrency(Math.max(0, assessmentBalance) || 5000)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

export default DetailedPaymentSchedule;