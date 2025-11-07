import axios from '@/lib/axios';

/**
 * Check if a patient has finalized charges/bills
 * @param {string} birthcareId - The birthcare facility ID
 * @param {number} patientId - The patient ID
 * @returns {Promise<{hasBills: boolean, billData: object|null, error: string|null}>}
 */
export async function checkPatientBillingStatus(birthcareId, patientId) {
  try {
    const response = await axios.get(`/api/birthcare/${birthcareId}/patient-charges/bill-summary/${patientId}`);
    
    if (response.data?.success && response.data?.data?.has_bill) {
      return {
        hasBills: true,
        billData: response.data.data,
        error: null
      };
    }
    
    return {
      hasBills: false,
      billData: null,
      error: null
    };
    
  } catch (error) {
    console.error('Error checking patient billing status:', error);
    return {
      hasBills: false,
      billData: null,
      error: error.response?.data?.message || error.message || 'Failed to check billing status'
    };
  }
}

/**
 * Get detailed patient bills including payment history
 * @param {string} birthcareId - The birthcare facility ID
 * @param {number} patientId - The patient ID
 * @returns {Promise<{bills: array, payments: array, totals: object, error: string|null}>}
 */
export async function getPatientBillingDetails(birthcareId, patientId) {
  try {
    // Get bill summary
    const billSummaryResponse = await axios.get(`/api/birthcare/${birthcareId}/patient-charges/bill-summary/${patientId}`);
    
    let bills = [];
    let charges = [];
    let payments = [];
    let totals = {
      totalCharges: 0,
      totalPayments: 0,
      outstandingBalance: 0
    };
    
    if (billSummaryResponse.data?.success && billSummaryResponse.data?.data?.has_bill) {
      const billData = billSummaryResponse.data.data;
      
      // Extract charges from bill items
      if (billData.bill_items) {
        charges = billData.bill_items.map(item => ({
          service_name: item.service_name,
          description: item.description,
          quantity: parseInt(item.quantity || 1),
          unit_price: parseFloat(item.unit_price || 0),
          total_amount: parseFloat(item.total_price || 0),
          charge_date: item.created_at
        }));
      }
      
      // Try to get bills from payments API for more complete data
      try {
        const paymentsResponse = await axios.get(`/api/birthcare/${birthcareId}/payments?patient_id=${patientId}`);
        bills = paymentsResponse.data?.data?.data || [];
        
        // Get payment history from bills
        for (const bill of bills) {
          try {
            const paymentResponse = await axios.get(`/api/birthcare/${birthcareId}/payments/${bill.id}/payments`);
            const billPayments = (paymentResponse.data?.data || []).map(payment => ({
              ...payment,
              bill_number: bill.bill_number,
              bill_id: bill.id
            }));
            payments.push(...billPayments);
          } catch (err) {
            console.log(`Could not fetch payments for bill ${bill.id}`);
          }
        }
      } catch (err) {
        console.log('Could not fetch detailed bills from payments API');
      }
      
      // Calculate totals
      const totalFromCharges = charges.reduce((sum, charge) => sum + parseFloat(charge.total_amount || 0), 0);
      const totalFromBills = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0);
      const totalCharges = Math.max(totalFromCharges, totalFromBills, parseFloat(billData.total_amount || 0));
      const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
      
      totals = {
        totalCharges,
        totalPayments,
        outstandingBalance: totalCharges - totalPayments
      };
    }
    
    return {
      bills,
      charges,
      payments,
      totals,
      error: null
    };
    
  } catch (error) {
    console.error('Error getting patient billing details:', error);
    return {
      bills: [],
      charges: [],
      payments: [],
      totals: { totalCharges: 0, totalPayments: 0, outstandingBalance: 0 },
      error: error.response?.data?.message || error.message || 'Failed to get billing details'
    };
  }
}

/**
 * Format currency for display
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(parseFloat(amount || 0));
}

/**
 * Get billing status description
 * @param {number} totalCharges - Total charges amount
 * @param {number} totalPayments - Total payments amount
 * @returns {object} Status information
 */
export function getBillingStatus(totalCharges, totalPayments) {
  const outstandingBalance = totalCharges - totalPayments;
  
  if (outstandingBalance <= 0) {
    return {
      status: 'paid',
      label: 'Paid',
      color: 'green',
      description: 'Account is fully paid'
    };
  } else if (totalPayments > 0) {
    return {
      status: 'partial',
      label: 'Partial Payment',
      color: 'yellow',
      description: `Outstanding balance: ${formatCurrency(outstandingBalance)}`
    };
  } else {
    return {
      status: 'unpaid',
      label: 'Unpaid',
      color: 'red',
      description: `Full amount due: ${formatCurrency(outstandingBalance)}`
    };
  }
}
