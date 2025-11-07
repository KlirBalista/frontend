'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const SubscriptionWarning = () => {
  const [warning, setWarning] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check for existing warning in localStorage
    const storedWarning = localStorage.getItem('subscription_warning');
    if (storedWarning && !isDismissed) {
      setWarning(storedWarning);
    }

    // Listen for new subscription warnings
    const handleSubscriptionWarning = (event) => {
      if (!isDismissed) {
        setWarning(event.detail.warning);
      }
    };

    window.addEventListener('subscriptionWarning', handleSubscriptionWarning);

    return () => {
      window.removeEventListener('subscriptionWarning', handleSubscriptionWarning);
    };
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setWarning(null);
    localStorage.removeItem('subscription_warning');
  };

  if (!warning || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg shadow-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-amber-800">
              <strong>Subscription Warning:</strong> {warning}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Please renew your subscription to avoid service interruption.
            </p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex rounded-md bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50"
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionWarning;