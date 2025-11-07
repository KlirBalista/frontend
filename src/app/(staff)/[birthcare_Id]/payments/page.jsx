"use client";

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/auth';
import PaymentDashboard from '@/components/PaymentDashboard';

export default function PaymentsPage() {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: 'auth' });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_payments"))
  ) {
    return <div>Unauthorized</div>;
  }

  return <PaymentDashboard birthcareId={birthcare_Id} />;
}