import React, { useState } from 'react';
import {
  XMarkIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MedicalIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const AddServiceModal = ({ 
  isOpen, 
  onClose, 
  onServiceAdded,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    service_name: '',
    category: '',
    description: '',
    price: '',
    active: true
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const serviceCategories = [
    'Consultation',
    'Diagnostic',
    'Laboratory',
    'Prenatal Care',
    'Delivery Services',
    'Newborn Care',
    'Emergency Care',
    'Pharmacy',
    'Administrative',
    'Other'
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        price: value
      }));
      setErrors(prev => ({
        ...prev,
        price: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.service_name.trim()) {
      newErrors.service_name = 'Service name is required';
    }
    
    const price = parseFloat(formData.price);
    if (!formData.price || price <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Process service creation
      const serviceData = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      setSuccess(true);
      setTimeout(() => {
        onServiceAdded?.(serviceData);
        onClose();
        setSuccess(false);
        setFormData({
          service_name: '',
          category: '',
          description: '',
          price: '',
          active: true
        });
        setErrors({});
      }, 2000);
    } catch (error) {
      console.error('Service creation error:', error);
      setErrors({ submit: 'Failed to create service. Please try again.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-auto w-11/12 max-w-lg">
        <div className="relative bg-white rounded-2xl border border-gray-200 p-6 shadow-xl">
          {success ? (
            // Success State
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="mt-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Service Added Successfully!</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    {formData.service_name} has been added to your services with a price of {formatCurrency(parseFloat(formData.price))}.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Add Service Form
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] rounded-lg flex items-center justify-center mr-3">
                    <PlusCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Add Service</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <div className="text-sm text-red-700">{errors.submit}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    name="service_name"
                    value={formData.service_name}
                    onChange={handleInputChange}
                    placeholder="Enter service name"
                    className={`block w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm placeholder-gray-400 ${
                      errors.service_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.service_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.service_name}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Enter Service Category"
                    className={`block w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm placeholder-gray-400 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter Service Description"
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm resize-none placeholder-gray-400"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handlePriceChange}
                    placeholder="0.00"
                    className={`block w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm placeholder-gray-400 ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                  {formData.price && (
                    <p className="mt-1 text-xs text-gray-500">
                      Price: {formatCurrency(parseFloat(formData.price) || 0)}
                    </p>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#ff6b6b] focus:ring-[#ff6b6b] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active Service
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6 -mt-2">
                  Active services are available for selection when creating patient charges
                </p>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-normal text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2.5 bg-[#A41F39] border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-pink-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Service'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;