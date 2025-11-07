"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import Button from "@/components/Button.jsx";

const PlansPage = ({ id }) => {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get("/api/plans");
        setPlans(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch plans");
      }
    };

    fetchPlans();
  }, []);

  const selectPlan = (planId) => {
    router.push(`/register?plan_id=${planId}`);
  };

  // Define static plans with time-based model - same features, different durations
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

  const staticPlans = [
    {
      id: 'free-trial',
      plan_name: 'Free Trial',
      price: 0,
      duration_in_year: 0,
      duration_text: '30 Seconds',
      description: 'Quick demo to explore all features',
      features: commonFeatures,
      buttonText: 'Start Free Trial',
      popular: false,
      gradient: 'from-[#FDB3C2] to-[#F891A5]',
      bgColor: 'from-rose-50 to-pink-50',
      iconColor: 'text-[#F891A5]',
      trialNote: 'No credit card required'
    },
    {
      id: 'basic',
      plan_name: 'Basic',
      price: 99.99,
      duration_in_year: 1,
      duration_text: '1 Year',
      description: 'Perfect for small to medium healthcare facilities',
      features: commonFeatures,
      buttonText: 'Choose Basic',
      popular: false,
      gradient: 'from-[#F891A5] to-[#E56D85]',
      bgColor: 'from-pink-50 to-rose-100',
      iconColor: 'text-[#F891A5]'
    },
    {
      id: 'standard',
      plan_name: 'Standard',
      price: 249.99,
      duration_in_year: 3,
      duration_text: '3 Years',
      description: 'Great value for growing healthcare practices',
      features: commonFeatures,
      buttonText: 'Choose Standard',
      popular: false,
      gradient: 'from-[#E56D85] to-[#BF3853]',
      bgColor: 'from-rose-100 to-rose-200',
      iconColor: 'text-[#BF3853]',
      savings: 'Save 25%'
    },
    {
      id: 'premium',
      plan_name: 'Premium',
      price: 399.99,
      duration_in_year: 5,
      duration_text: '5 Years',
      description: 'Best value for established healthcare facilities',
      features: commonFeatures,
      buttonText: 'Choose Premium',
      popular: true,
      gradient: 'from-[#BF3853] to-[#A41F39]',
      bgColor: 'from-rose-200 to-rose-300',
      iconColor: 'text-[#A41F39]',
      savings: 'Save 35%'
    }
  ];

  return (
    <section id={id} className="relative py-20 bg-gradient-to-br from-rose-50/30 via-white to-pink-50/20">
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-rose-50 to-pink-100 rounded-full text-[#E56D85] font-bold text-sm mb-6 shadow-sm">
            💎 Flexible Pricing Options
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F891A5] via-[#E56D85] to-[#BF3853] mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Select the perfect plan for your healthcare facility and start transforming patient care today
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-200 text-red-700 rounded-2xl text-center max-w-2xl mx-auto">
            {error}
          </div>
        )}
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-stretch">
          {staticPlans.map((plan, index) => (
            <div
              key={plan.id}
              className={`group relative h-full ${plan.popular ? 'scale-105 md:scale-110' : ''}`}
            >
              {/* Glow effect for popular plan */}
              {plan.popular && (
                <div className="absolute -inset-1 bg-gradient-to-r from-[#E56D85] via-[#F891A5] to-[#E56D85] rounded-3xl opacity-30 group-hover:opacity-50 transition duration-500 blur-lg animate-pulse"></div>
              )}
              
              <div className={`relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl border transition-all duration-500 group-hover:-translate-y-1 h-full flex flex-col min-h-[650px] ${
                plan.popular ? 'border-[#E56D85]/20 shadow-rose-200/30' : 'border-rose-100'
              }`}>
                
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2 z-10">
                    <div className="bg-gradient-to-r from-[#E56D85] to-[#BF3853] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                      ⭐ Most Popular
                    </div>
                    {plan.savings && (
                      <div className="bg-gradient-to-r from-[#F891A5] to-[#E56D85] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                        {plan.savings}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Savings badge for non-popular plans */}
                {plan.savings && !plan.popular && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-gradient-to-r from-[#F891A5] to-[#E56D85] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                      {plan.savings}
                    </div>
                  </div>
                )}

                {/* Plan content - flex grow to ensure equal heights */}
                <div className="flex-grow flex flex-col">
                  {/* Plan header */}
                  <div className="text-center mb-8">
                    <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${plan.popular ? 'mt-8' : 'mt-4'}`}>
                      <svg className={`w-8 h-8 ${plan.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.plan_name}</h3>
                    <div className="mb-4">
                      {plan.price === 0 ? (
                        <div className="text-4xl font-bold text-gray-900">Free</div>
                      ) : (
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold text-gray-900">₱{plan.price}</span>
                          <span className="text-gray-500 ml-1">.00</span>
                        </div>
                      )}
                      <p className="text-gray-500 font-medium">{plan.duration_text}</p>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Features list */}
                  <div className="mb-8 flex-grow">
                    <div className="text-center mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-[#BF3853]">
                        ✨ Full Access to All Features
                      </span>
                    </div>
                    <ul className="space-y-3 min-h-[240px]">
                      {plan.features.slice(0, 6).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center mr-3 mt-0.5`}>
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 6 && (
                        <li className="flex items-center justify-center pt-2">
                          <span className="text-sm text-gray-500 font-medium">
                            + {plan.features.length - 6} more features
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* CTA Button - positioned at bottom */}
                <div className="mt-auto">
                  <button
                    onClick={() => plan.id.startsWith('free') || plan.id.startsWith('basic') ? router.push('/register') : selectPlan(plan.id)}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg bg-gradient-to-r ${plan.gradient} ${plan.popular ? 'shadow-rose-300/50' : 'shadow-rose-200/30'}`}
                  >
                    {plan.buttonText}
                  </button>
                  
                  {/* Additional info */}
                  {plan.trialNote && (
                    <p className="text-center text-xs text-gray-500 mt-3">
                      {plan.trialNote}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional info section */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">All plans include secure data storage and HIPAA compliance</p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-[#F891A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              30-day money back guarantee
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-[#F891A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              SSL Security
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-[#F891A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364" />
              </svg>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlansPage;
