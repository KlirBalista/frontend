import Axios from "axios";

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
  withXSRFToken: true,
});

// Response interceptor to handle subscription errors
axios.interceptors.response.use(
  (response) => {
    // Check for subscription warning header
    const subscriptionWarning = response.headers['x-subscription-warning'];
    if (subscriptionWarning) {
      // Store warning in localStorage or dispatch to global state
      if (typeof window !== 'undefined') {
        localStorage.setItem('subscription_warning', subscriptionWarning);
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('subscriptionWarning', { 
          detail: { warning: subscriptionWarning } 
        }));
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.error === 'subscription_required') {
      // Handle subscription required error
      if (typeof window !== 'undefined') {
        // Store error details for display
        localStorage.setItem('subscription_error', JSON.stringify(error.response.data));
        
        // Only redirect if not already on subscription page to prevent infinite loops
        if (!window.location.pathname.includes('/subscription')) {
          window.location.href = '/subscription';
        }
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default axios;
