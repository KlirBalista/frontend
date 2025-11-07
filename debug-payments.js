// Quick debugging script for PaymentDashboard
// Open browser console on http://localhost:3000/2/payments and run this

console.log('=== PAYMENT DASHBOARD DEBUG ===');

// Check if we have any patients with billing data
const checkPatientsTable = () => {
  const rows = document.querySelectorAll('tbody tr');
  console.log(`Found ${rows.length} patient rows`);
  
  rows.forEach((row, index) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 6) {
      const patient = cells[0]?.textContent?.trim();
      const room = cells[1]?.textContent?.trim();
      const charges = cells[2]?.textContent?.trim();
      const payments = cells[3]?.textContent?.trim();
      const balance = cells[4]?.textContent?.trim();
      const status = cells[5]?.textContent?.trim();
      
      console.log(`Patient ${index + 1}: ${patient}`);
      console.log(`  Room: ${room}`);
      console.log(`  Charges: ${charges}`);
      console.log(`  Payments: ${payments}`);
      console.log(`  Balance: ${balance}`);
      console.log(`  Status: ${status}`);
      console.log('---');
    }
  });
};

// Run the check
setTimeout(checkPatientsTable, 2000);

console.log('Check browser network tab for API calls');
console.log('Look for calls to:');
console.log('- /api/birthcare/2/payments/patients-billing-status');
console.log('- /api/birthcare/2/patient-admission');
console.log('- /api/birthcare/2/patients');
console.log('- /api/birthcare/2/patient-charges/admitted-patients');
console.log('- /api/birthcare/2/patient-charges/bill-summary/*');