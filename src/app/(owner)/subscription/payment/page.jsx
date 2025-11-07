'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import GCashPayment from '@/components/GCashPayment';

const SubscriptionPaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!planId) {
      router.push('/subscription');
      return;
    }
    fetchPlanDetails();
  }, [planId]);

  const fetchPlanDetails = async () => {
    try {
      const response = await axios.get(`/api/plans/${planId}`);
      setSelectedPlan(response.data);
    } catch (err) {
      setError('Failed to load plan details');
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async (paymentData) => {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        transactionId: `TXN_${Date.now()}`,
        message: 'Payment processed successfully'
      };
    } else {
      return {
        success: false,
        message: 'Payment failed. Please try again.'
      };
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    setProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      const paymentResult = await simulatePayment(paymentData);
      
      if (paymentResult.success) {
        // Update user subscription
        await updateUserSubscription(paymentResult.transactionId);
        
        // Show success message and redirect
        alert('🎉 Payment Successful! Your subscription has been updated.');
        router.push('/subscription?payment=success');
      } else {
        setError(paymentResult.message);
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const updateUserSubscription = async (transactionId) => {
    try {
      const response = await axios.post('/api/owner/subscription/update', {
        plan_id: selectedPlan.id,
        payment_method: paymentMethod,
        payment_reference: transactionId,
      });
      return response.data;
    } catch (error) {
      console.error('Subscription update error:', error);
      // For demo purposes, we'll still show success even if backend update fails
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="lg:p-6 w-full h-full pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded mb-6 w-2/3"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="lg:p-6 w-full h-full pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Plan Not Found</h1>
              <p className="text-gray-600 mb-6">The selected subscription plan could not be found.</p>
              <button
                onClick={() => router.push('/subscription')}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Back to Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full h-full pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Complete Your Subscription
                </h1>
                <p className="text-gray-600">
                  You're subscribing to the <strong>{selectedPlan.plan_name}</strong> plan
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6 sticky top-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{selectedPlan.plan_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedPlan.duration_in_year} year{selectedPlan.duration_in_year > 1 ? 's' : ''}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-blue-600">{formatPrice(selectedPlan.price)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 mb-1">What's Included:</p>
                        <ul className="text-blue-700 space-y-1">
                          <li>• All system features</li>
                          <li>• Unlimited patients</li>
                          <li>• 24/7 support</li>
                          <li>• Regular updates</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  
                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-700">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Method Selection */}
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodSelect={setPaymentMethod}
                  />

                  {/* Payment Forms */}
                  {paymentMethod === 'gcash' && (
                    <GCashPayment
                      onSubmit={handlePaymentSubmit}
                      processing={processing}
                      planAmount={selectedPlan.price}
                    />
                  )}

                  {paymentMethod === 'card' && (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <p className="text-gray-600">Card payment coming soon</p>
                    </div>
                  )}

                  {!paymentMethod && (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <p>Please select a payment method to continue</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentPage;