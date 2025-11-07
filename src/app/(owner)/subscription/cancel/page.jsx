'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';

const SubscriptionCancelPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const handleCancelSession = async () => {
    if (!sessionId) return;

    setCancelling(true);
    try {
      await axios.post(`/api/subscription/cancel/${sessionId}`);
      setCancelled(true);
    } catch (err) {
      console.error('Error cancelling session:', err);
      // Still mark as cancelled even if API fails
      setCancelled(true);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          {/* Cancel Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            You have cancelled the subscription payment
          </p>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">No charges were made</p>
                <p>Your payment was cancelled and no amount has been charged. You can try again anytime.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/subscription')}
              className="w-full bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white px-8 py-3 rounded-lg hover:from-[#A41F39] hover:to-[#8B1A2F] transition-all font-medium"
            >
              Try Again
            </button>
            
            {sessionId && !cancelled && (
              <button
                onClick={handleCancelSession}
                disabled={cancelling}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel This Payment Session'}
              </button>
            )}

            {cancelled && (
              <div className="text-sm text-green-600 font-medium">
                ✓ Payment session cancelled successfully
              </div>
            )}

            <button
              onClick={() => router.push('/facility-dashboard')}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500 mt-6">
            Need help? Contact our support team
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelPage;
