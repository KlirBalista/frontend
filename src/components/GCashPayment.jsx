'use client';

import { useState } from 'react';

const GCashPayment = ({ onSubmit, processing, planAmount }) => {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    accountName: '',
    pin: ''
  });
  const [errors, setErrors] = useState({});

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^09\d{9}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid mobile number (e.g., 09123456789)';
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    if (!formData.pin.trim()) {
      newErrors.pin = 'GCash PIN is required for verification';
    } else if (formData.pin.length !== 4) {
      newErrors.pin = 'PIN must be 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        paymentMethod: 'gcash',
        ...formData,
        amount: planAmount
      });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold">G</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">GCash Payment</h3>
          <p className="text-sm text-gray-600">Secure payment via GCash wallet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Amount Display */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">Amount to Pay:</span>
            <span className="text-lg font-bold text-blue-800">{formatPrice(planAmount)}</span>
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
            GCash Mobile Number
          </label>
          <input
            type="tel"
            id="mobileNumber"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="09123456789"
            maxLength="11"
          />
          {errors.mobileNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>
          )}
        </div>

        {/* Account Name */}
        <div>
          <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name
          </label>
          <input
            type="text"
            id="accountName"
            name="accountName"
            value={formData.accountName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.accountName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Juan Dela Cruz"
          />
          {errors.accountName && (
            <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>
          )}
        </div>

        {/* GCash PIN */}
        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
            GCash PIN
          </label>
          <input
            type="password"
            id="pin"
            name="pin"
            value={formData.pin}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.pin ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••"
            maxLength="4"
          />
          {errors.pin && (
            <p className="mt-1 text-sm text-red-600">{errors.pin}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Enter your 4-digit GCash PIN for verification
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-green-800">Secure Payment</p>
              <p className="text-green-700">Your payment is protected by GCash's security measures</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={processing}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            processing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </div>
          ) : (
            `Pay ${formatPrice(planAmount)} with GCash`
          )}
        </button>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          This is a demo payment form. No actual charges will be made.
        </p>
      </form>
    </div>
  );
};

export default GCashPayment;