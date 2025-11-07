'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';

const SubscriptionSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    } else {
      setError('No payment session found');
      setLoading(false);
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await axios.get(`/api/subscription/payment-status/${sessionId}`);
      
      if (response.data.success) {
        setPaymentData(response.data.data);
      } else {
        setError('Failed to verify payment status');
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDB3C2]/10 to-[#F891A5]/10">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#BF3853] mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Verification Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/subscription')}
              className="bg-[#BF3853] text-white px-6 py-3 rounded-lg hover:bg-[#A41F39] transition-colors"
            >
              Back to Subscription
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = paymentData?.payment_session?.status === 'paid';
  const subscriptionStatus = paymentData?.subscription?.status;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDB3C2]/10 to-[#F891A5]/10 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for subscribing to our service
          </p>

          {/* Payment Details Card */}
          <div className="bg-gradient-to-br from-[#FDB3C2]/10 to-[#F891A5]/10 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold text-gray-900">
                  {paymentData?.payment_session?.plan?.plan_name}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-green-600">
                  ₱{paymentData?.payment_session?.amount}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {paymentData?.payment_session?.payment_method 
                    ? paymentData.payment_session.payment_method === 'card' 
                      ? 'Credit/Debit Card' 
                      : paymentData.payment_session.payment_method === 'gcash'
                        ? 'GCash'
                        : paymentData.payment_session.payment_method === 'paymaya'
                          ? 'PayMaya'
                          : paymentData.payment_session.payment_method
                    : 'Processing...'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Subscription Status:</span>
                <span className={`font-semibold capitalize ${
                  subscriptionStatus === 'active' ? 'text-green-600' : 
                  subscriptionStatus === 'pending' ? 'text-yellow-600' : 
                  'text-gray-600'
                }`}>
                  {subscriptionStatus}
                </span>
              </div>

              {subscriptionStatus === 'pending' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Subscription Pending</p>
                      <p className="mt-1">
                        Your payment was successful! Your subscription will become active when your current subscription expires.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {subscriptionStatus === 'active' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-green-800">
                      <p className="font-medium">Subscription Active</p>
                      <p className="mt-1">
                        Your subscription is now active! You have full access to all features.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/facility-dashboard')}
              className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white px-8 py-3 rounded-lg hover:from-[#A41F39] hover:to-[#8B1A2F] transition-all font-medium"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/subscription')}
              className="bg-white border-2 border-[#BF3853] text-[#BF3853] px-8 py-3 rounded-lg hover:bg-[#FDB3C2]/10 transition-colors font-medium"
            >
              View Subscription
            </button>
          </div>

          {/* Receipt Info */}
          <p className="text-sm text-gray-500 mt-6">
            A payment receipt has been sent to your email
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
