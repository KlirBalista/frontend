// Example usage page for the payment system
import React from 'react';
import PaymentDashboard from '../../components/PaymentDashboard';

export default function PaymentsPage() {
  // In a real app, you would get the birthcareId from your auth context or route params
  const birthcareId = 1; // Example birthcare ID

  return <PaymentDashboard birthcareId={birthcareId} />;
}