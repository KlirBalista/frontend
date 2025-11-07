'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import SubscriptionWarning from '@/components/SubscriptionWarning';
import TrialTimer from '@/components/TrialTimer';

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState({});

  useEffect(() => {
    fetchPlans();
    fetchUserSubscription();
    
    // Check for subscription error from localStorage
    const storedError = localStorage.getItem('subscription_error');
    if (storedError) {
      try {
        const parsedError = JSON.parse(storedError);
        setSubscriptionError(parsedError);
        // Clear the error from localStorage after displaying
        localStorage.removeItem('subscription_error');
      } catch (e) {
        console.error('Error parsing subscription error:', e);
      }
    }
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/plans');
      setPlans(response.data);
    } catch (err) {
      setError('Failed to load subscription plans');
      console.error('Error fetching plans:', err);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const response = await axios.get('/api/owner/subscription');
      setUserSubscription(response.data);
    } catch (err) {
      console.log('No active subscription found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!agreedToTerms[planId]) {
      alert('Please agree to the terms and conditions before subscribing.');
      return;
    }

    try {
      setLoading(true);
      
      // Create PayMongo checkout session
      const response = await axios.post('/api/subscription/checkout', {
        plan_id: planId
      });

      if (response.data.success) {
        // Redirect to PayMongo checkout URL
        window.location.href = response.data.data.checkout_url;
      } else {
        alert(response.data.message || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error subscribing:', err);
      const errorMessage = err.response?.data?.message || 'Failed to subscribe. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, duration, planName) => {
    if (planName === 'Free Trial') {
      return {
        total: 'Free',
        yearly: '30 Seconds Only!',
        duration: 'Quick Demo'
      };
    }
    
    const numPrice = parseFloat(price);
    const numDuration = parseInt(duration);
    const yearly = numDuration > 1 ? numPrice / numDuration : numPrice;
    return {
      total: `₱${numPrice.toFixed(2)}`,
      yearly: `₱${yearly.toFixed(2)}/year`,
      duration: numDuration === 1 ? '1 Year' : `${numDuration} Years`
    };
  };

  const getPlanConfig = (planName) => {
    const configs = {
      'Free Trial': {
        gradient: 'from-[#FDB3C2] to-[#F891A5]',
        bgColor: 'from-[#FDB3C2]/10 to-[#F891A5]/10',
        iconColor: 'text-[#F891A5]',
        popular: false,
        savings: null
      },
      'Basic': {
        gradient: 'from-[#F891A5] to-[#E56D85]',
        bgColor: 'from-[#F891A5]/10 to-[#E56D85]/10',
        iconColor: 'text-[#E56D85]',
        popular: false,
        savings: null
      },
      'Standard': {
        gradient: 'from-[#E56D85] to-[#BF3853]',
        bgColor: 'from-[#E56D85]/10 to-[#BF3853]/10',
        iconColor: 'text-[#BF3853]',
        popular: false,
        savings: 'Save 25%'
      },
      'Premium': {
        gradient: 'from-[#BF3853] to-[#A41F39]',
        bgColor: 'from-[#BF3853]/10 to-[#A41F39]/10',
        iconColor: 'text-[#A41F39]',
        popular: true,
        savings: 'Save 35%'
      }
    };
    return configs[planName] || configs['Basic'];
  };

  const commonFeatures = [
    'Complete patient management system',
    'Prenatal care scheduling & tracking',
    'Advanced labor monitoring',
    'Room & bed management',
    'Newborn screening & documentation',
    'Birth certificate generation',
    'Advanced billing system',
    'Staff role management',
    'Comprehensive reporting & analytics',
    'Unlimited patient records'
  ];

  if (loading) {
    return (
      <div className="lg:p-6 w-full h-full pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded mb-6 w-2/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Invoice History Modal */}
      {showInvoiceHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Invoice History</h2>
              <button
                onClick={() => setShowInvoiceHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {userSubscription?.payment_history && userSubscription.payment_history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Paid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userSubscription.payment_history.map((payment, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.reference_number || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {payment.plan?.plan_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                            ₱{payment.amount}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {payment.payment_method === 'card' ? 'Credit/Debit Card' : 
                             payment.payment_method === 'gcash' ? 'GCash' : 
                             payment.payment_method === 'paymaya' ? 'PayMaya' : 
                             payment.payment_method || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.paid_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            INV-{payment.id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✓ Paid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No payment history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trial Timer for urgent countdown */}
      <TrialTimer />
      
      {/* Subscription Warning Component */}
      <SubscriptionWarning />
      
      <div className="w-full h-full">
        <div className="w-full">
          <div className="bg-gradient-to-br from-white to-[#FDB3C2]/5 rounded-lg shadow-sm border border-[#FDB3C2]/20">
            
            {/* Header */}
            <div className="p-6 border-b border-[#FDB3C2]/30">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Subscription Management
              </h1>
              <p className="text-gray-600">
                Choose the plan that best fits your healthcare facility needs
              </p>
            </div>

            <div className="p-6">
              {/* Subscription Required Error Display */}
              {subscriptionError && (
                <div className="mb-6 p-6 bg-gradient-to-r from-[#A41F39]/10 to-[#BF3853]/10 border-l-4 border-[#A41F39] rounded-lg shadow-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-[#A41F39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-lg font-bold text-[#A41F39]">
                        ⚡ Free Trial Expired!
                      </h3>
                      <div className="mt-2 text-sm text-[#BF3853]">
                        <p>Your 30-second free trial has ended. Choose a subscription plan below to continue using all features of the Birth Care System.</p>
                      </div>
                      <div className="mt-4">
                        <div className="bg-[#A41F39]/10 rounded-lg p-3">
                          <p className="text-[#A41F39] font-semibold text-sm">
                            💡 Don't lose your progress! Subscribe now to keep your facility data and continue serving your patients.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* General Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-[#A41F39]/10 border border-[#A41F39]/30 text-[#A41F39] rounded-lg">
                  {error}
                </div>
              )}

            {/* Current Subscription - Simple & Clean */}
            {userSubscription && userSubscription.status === 'active' && userSubscription.subscription && (
              <div className="mb-8 space-y-4">
                {/* Active Subscription */}
                <div className="p-6 bg-gradient-to-br from-[#BF3853]/5 to-[#A41F39]/5 border border-[#BF3853]/30 rounded-lg">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#BF3853] to-[#A41F39] rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Current Subscription</h2>
                        <p className="text-sm text-gray-600">Your active plan details</p>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center space-x-2 bg-[#BF3853]/10 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-[#BF3853] rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-[#BF3853] capitalize">{userSubscription.status}</span>
                    </div>
                  </div>
                
                {/* Subscription Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">CURRENT PLAN</h3>
                    <p className="text-lg font-semibold text-gray-900">{userSubscription.subscription.plan?.plan_name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">
                      {userSubscription.subscription.plan?.plan_name === 'Free Trial' 
                        ? 'Limited 30-second trial period' 
                        : 'Full access to all features'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">BILLING PERIOD</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {userSubscription.subscription.plan?.plan_name === 'Free Trial'
                        ? 'Free Trial'
                        : userSubscription.subscription.duration_in_year 
                          ? `${userSubscription.subscription.duration_in_year} Year${userSubscription.subscription.duration_in_year > 1 ? 's' : ''}`
                          : '1 Year'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {userSubscription.subscription.start_date
                        ? `Started ${new Date(userSubscription.subscription.start_date).toLocaleDateString()}`
                        : 'Started 9/29/2025'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">RENEWAL DATE</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {userSubscription.expires_at 
                        ? new Date(userSubscription.expires_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : 'No end date'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {userSubscription.expires_at
                        ? (() => {
                            const daysLeft = Math.ceil((new Date(userSubscription.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                            return daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired';
                          })()
                        : 'Ongoing subscription'
                      }
                    </p>
                  </div>
                </div>
                  
                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-[#BF3853]/20">
                    <button 
                      onClick={() => setShowInvoiceHistory(true)}
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-[#BF3853] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>View Invoice History</span>
                    </button>
                  </div>
                </div>

                {/* Pending Subscriptions */}
                {userSubscription?.pending_subscriptions && userSubscription.pending_subscriptions.length > 0 && (
                  <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Pending Subscription</h2>
                        <p className="text-sm text-gray-600">Will activate when current subscription expires</p>
                      </div>
                    </div>

                    {userSubscription.pending_subscriptions.map((pendingSub, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-yellow-200">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">PLAN</h3>
                          <p className="text-lg font-semibold text-gray-900">{pendingSub.plan?.plan_name}</p>
                          <p className="text-xs text-gray-500">
                            {pendingSub.plan?.duration_in_year} Year{pendingSub.plan?.duration_in_year > 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">AMOUNT</h3>
                          <p className="text-lg font-semibold text-green-600">
                            ₱{(pendingSub.payment_session || pendingSub.paymentSession)?.amount || 0}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(pendingSub.payment_session || pendingSub.paymentSession)?.status === 'paid' 
                              ? `Paid on ${new Date((pendingSub.payment_session || pendingSub.paymentSession).paid_at).toLocaleDateString()}`
                              : 'Payment pending'
                            }
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">WILL ACTIVATE ON</h3>
                          <p className="text-lg font-semibold text-gray-900">
                            {pendingSub.start_date
                              ? new Date(pendingSub.start_date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })
                              : 'After current expires'
                            }
                          </p>
                          <p className="text-xs text-gray-500">Automatically activated</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <h2 className="text-lg font-semibold text-gray-800 mb-6">Available Plans</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
              {plans
                .sort((a, b) => {
                  // Sort Free Trial first, then by duration
                  if (a.plan_name === 'Free Trial') return -1;
                  if (b.plan_name === 'Free Trial') return 1;
                  return a.duration_in_year - b.duration_in_year;
                })
                .map((plan) => {
                  const pricing = formatPrice(plan.price, plan.duration_in_year, plan.plan_name);
                  const isCurrentPlan = userSubscription?.subscription?.plan_id === plan.id;
                  const config = getPlanConfig(plan.plan_name);
                  
                  return (
                    <div key={plan.id} className="relative">
                      <div className={`border rounded-lg p-6 h-full flex flex-col transition-all duration-200 hover:shadow-md ${
                        isCurrentPlan 
                          ? 'border-[#BF3853] bg-gradient-to-br from-[#BF3853]/5 to-[#A41F39]/5' 
                          : config.popular
                            ? 'border-[#E56D85] bg-gradient-to-br from-[#E56D85]/5 to-[#BF3853]/5'
                            : 'border-[#FDB3C2]/30 bg-white hover:border-[#F891A5]'
                      }`}>
                        
                        {/* Badges */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            {config.popular && !isCurrentPlan && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#E56D85] to-[#BF3853] text-white">
                                Most Popular
                              </span>
                            )}
                            {isCurrentPlan && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#BF3853]/10 text-[#BF3853]">
                                Current Plan
                              </span>
                            )}
                          </div>
                          {config.savings && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#FDB3C2]/20 text-[#A41F39]">
                              {config.savings}
                            </span>
                          )}
                        </div>

                        {/* Plan content */}
                        <div className="flex-grow flex flex-col">
                          {/* Plan header */}
                          <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {plan.plan_name}
                            </h3>
                            <div className="mb-3">
                              <div className="text-3xl font-bold text-gray-900">
                                {pricing.total}
                              </div>
                              <div className="text-sm text-gray-500">
                                {pricing.yearly} • {pricing.duration}
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">{plan.description}</p>
                          </div>

                          {/* Features list */}
                          <div className="mb-8 flex-grow">
                            <div className="text-center mb-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 text-[#A41F39]">
                                ✨ Full Access to All Features
                              </span>
                            </div>
                            <ul className="space-y-3 min-h-[240px]">
                              {commonFeatures.slice(0, 6).map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-start">
                                  <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center mr-3 mt-0.5`}>
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                                </li>
                              ))}
                              {commonFeatures.length > 6 && (
                                <li className="flex items-center justify-center pt-2">
                                  <span className="text-sm text-gray-500 font-medium">
                                    + {commonFeatures.length - 6} more features
                                  </span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        {/* Terms Checkbox */}
                        {!isCurrentPlan && plan.plan_name !== 'Free Trial' && (
                          <div className="mb-3 flex items-start">
                            <input
                              id={`terms-${plan.id}`}
                              type="checkbox"
                              checked={agreedToTerms[plan.id] || false}
                              onChange={(e) => setAgreedToTerms({...agreedToTerms, [plan.id]: e.target.checked})}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#BF3853] focus:ring-[#BF3853]/50 cursor-pointer"
                            />
                            <label htmlFor={`terms-${plan.id}`} className="ml-2 text-xs text-gray-600">
                              I agree to the{' '}
                              <button
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="text-[#BF3853] hover:text-[#A41F39] underline"
                              >
                                terms and conditions
                              </button>
                            </label>
                          </div>
                        )}

                        {/* CTA Button */}
                        <div className="mt-auto">
                          <button
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={isCurrentPlan || plan.plan_name === 'Free Trial' || (!agreedToTerms[plan.id] && plan.plan_name !== 'Free Trial')}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                              isCurrentPlan
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : plan.plan_name === 'Free Trial'
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  : !agreedToTerms[plan.id]
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#8B1A2F] text-white shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {isCurrentPlan 
                              ? 'Current Plan' 
                              : plan.plan_name === 'Free Trial'
                                ? '⚡ Active Trial (30s Only!)'
                                : 'Subscribe Now'
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {plans.length === 0 && !error && (
              <div className="text-center py-8 text-gray-500">
                No subscription plans available at the moment.
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-[#BF3853] to-[#A41F39] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Terms and Conditions</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Payment Terms</h2>
              
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ Important: No Refunds or Cancellations</h3>
                <p className="text-sm text-red-700 font-semibold">
                  All subscription payments are final and non-refundable. Once payment is processed, you cannot cancel or request a refund.
                </p>
              </div>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                By subscribing to any BirthCare System plan, you acknowledge and agree that all payments made for subscription services are strictly <strong>non-refundable and non-cancellable</strong>. This policy applies to all subscription plans, including but not limited to Basic, Standard, and Premium plans.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                Once you complete your payment and your subscription is activated, you will have immediate access to all features included in your selected plan for the entire duration of the subscription period (1 year, 2 years, or 3 years, depending on your chosen plan). The subscription cannot be terminated early, and no partial refunds will be issued under any circumstances.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                We strongly encourage you to carefully review your selected plan, its features, pricing, and duration before completing your purchase. If you have any questions or concerns about a subscription plan, please contact our support team at birthcare@gmail.com or call 09486198125 before making your payment.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                In the event of technical issues, service disruptions, or errors on our part, BirthCare System reserves the right to investigate and resolve such issues on a case-by-case basis. However, this does not constitute a guarantee of refunds or cancellations. Any disputes regarding subscription charges must be raised within 7 days of the transaction date.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                By proceeding with your subscription payment, you confirm that you have read, understood, and agreed to this No Refund and No Cancellation policy. You also acknowledge that this policy is legally binding and enforceable under the laws of the Philippines.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                BirthCare System is committed to providing high-quality service and support throughout your subscription period. We appreciate your understanding and cooperation regarding this policy.
              </p>

              <div className="text-sm leading-6 text-gray-700 mt-6 pt-4 border-t border-gray-200">
                <p className="font-semibold mb-2">For questions, billing inquiries, or support, please contact us at:</p>
                <p>Email: birthcare@gmail.com</p>
                <p>Address: Davao City, Philippines</p>
                <p>Phone: 09486198125</p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionPage;
