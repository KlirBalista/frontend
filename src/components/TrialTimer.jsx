'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';

const TrialTimer = ({ onExpiry }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkSubscriptionStatus = async () => {
      try {
        const response = await axios.get('/api/owner/subscription');
        
        if (!mounted) return;
        
        const subscription = response.data.subscription;
        if (subscription && subscription.plan && subscription.plan.plan_name === 'Free Trial') {
          const endDate = new Date(subscription.expires_at);
          const now = new Date();
          const timeDiff = endDate.getTime() - now.getTime();
          
          if (timeDiff > 0) {
            const seconds = Math.ceil(timeDiff / 1000);
            setTimeLeft(seconds);
            setIsVisible(true);
            
            // Start countdown
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(intervalRef.current);
                  setIsVisible(false);
                  // Handle expiry
                  if (onExpiry) onExpiry();
                  // Only redirect if not already on subscription page
                  if (typeof window !== 'undefined' && !window.location.pathname.includes('/subscription')) {
                    router.push('/subscription');
                  }
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else {
            // Trial already expired
            setIsVisible(false);
            if (onExpiry) onExpiry();
            // Only redirect if not already on subscription page
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/subscription')) {
              router.push('/subscription');
            }
          }
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setIsVisible(false);
      }
    };

    // Check immediately
    checkSubscriptionStatus();
    
    // Set up periodic checking every 5 seconds as backup
    const periodicCheck = setInterval(checkSubscriptionStatus, 5000);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(periodicCheck);
    };
  }, [router, onExpiry]);

  if (!isVisible || timeLeft === null) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-lg">
                ⚡ Free Trial Expires in: {timeLeft} seconds
              </p>
              <p className="text-red-100 text-sm">
                Subscribe now to continue using all features!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
<button 
              onClick={() => router.push('/subscription')}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialTimer;