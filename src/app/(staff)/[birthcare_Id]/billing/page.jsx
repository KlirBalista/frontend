"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/hooks/auth';

export default function BillingPage() {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'delete'
  const [selectedService, setSelectedService] = useState(null);

  const [formData, setFormData] = useState({
    service_name: '',
    category: '',
    description: '',
    price: '',
    is_active: true
  });
  const [customInputs, setCustomInputs] = useState({
    service_name: false,
    category: false,
    description: false,
    price: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Build suggestion lists from existing services
  const unique = (arr) => Array.from(new Set(arr.filter(v => v !== null && v !== undefined && String(v).trim() !== '')));
  const serviceNameOptions = unique(services.map(s => s.service_name));
  const categoryOptions = unique(services.map(s => s.category));
  const descriptionOptions = unique(services.map(s => s.description));
  const priceOptions = unique(services.map(s => {
    const p = s.price;
    if (p === null || p === undefined || p === '') return null;
    const num = Number(p);
    return Number.isFinite(num) ? num.toFixed(2) : String(p);
  }));

  const fetchServices = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching services from API...');
      
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/billing`);
      
      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch services');
      }
      const fetchedServices = data.data || [];
      console.log(`Successfully fetched ${fetchedServices.length} services from API`);
      setServices(fetchedServices);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching services:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      
      // Show error message but don't fall back to localStorage
      setError(`Failed to fetch services from API: ${err.message}. Please check your connection or contact support.`);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };


  // Filter services based on search and active status
  useEffect(() => {
    let filtered = services;
    
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (showActiveOnly) {
      filtered = filtered.filter(service => service.is_active);
    }
    
    setFilteredServices(filtered);
  }, [services, searchTerm, showActiveOnly]);

  useEffect(() => {
    if (user && birthcare_Id) {
      fetchServices();
    }
  }, [user, birthcare_Id]);

  if (!user) {
    return null;
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_billing"))
  ) {
    return <div>Unauthorized</div>;
  }


  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.service_name.trim()) {
      errors.service_name = 'Service name is required';
    }
    
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      errors.price = 'Valid price is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      service_name: '',
      category: '',
      description: '',
      price: '',
      is_active: true
    });
    setFormErrors({});
    setSelectedService(null);
    setCustomInputs({
      service_name: false,
      category: false,
      description: false,
      price: false
    });
  };

  // Open modal functions
  const openCreateModal = () => {
    resetForm();
    setModalType('create');
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setFormData({
      service_name: service.service_name,
      category: service.category || '',
      description: service.description || '',
      price: service.price.toString(),
      is_active: service.is_active
    });
    setSelectedService(service);
    setModalType('edit');
    setShowModal(true);
  };

  const openDeleteModal = (service) => {
    setSelectedService(service);
    setModalType('delete');
    setShowModal(true);
  };

  // CRUD Operations
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      let method = 'POST';
      
      if (modalType === 'edit') {
        method = 'PUT';
      }
      
      const newServiceData = {
        service_name: formData.service_name.trim(),
        category: formData.category.trim() || null,
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        is_active: formData.is_active
      };
      
      const response = await axios({
        url: `/api/birthcare/${birthcare_Id}/billing${modalType === 'edit' ? `/${selectedService.id}` : ''}`,
        method: method.toLowerCase(),
        data: newServiceData,
      });
      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.message || `Failed to ${modalType} service`);
      }
      
      setSuccess(`Service ${modalType === 'create' ? 'created' : 'updated'} successfully`);
      setShowModal(false);
      resetForm();
      
      // Refresh the services list
      await fetchServices();
      
    } catch (err) {
      console.error('Error submitting service:', err);
      setError(`Failed to ${modalType} service: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    
    try {
      const response = await axios.delete(`/api/birthcare/${birthcare_Id}/billing/${selectedService.id}`);
      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete service');
      }
      
      setSuccess('Service deleted successfully');
      setShowModal(false);
      setSelectedService(null);
      
      // Refresh the services list
      await fetchServices();
      
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(`Failed to delete service: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E56D85]"></div>
        <span className="ml-3 text-[#A41F39] font-medium">Loading charges...</span>
      </div>
    );
  }

  return (
      <div className="max-w-[90rem] mx-auto p-6">
        {/* Hero Header */}
        <div className="relative mb-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">
                      Item Charges
                    </h1>
                    <p className="text-gray-900 mt-2 font-medium">
                      Manage medical services, procedures, and billing rates
                    </p>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 border-2 border-[#E56D85]/50 text-gray-900 px-6 py-4 rounded-2xl mb-6 shadow-lg shadow-[#E56D85]/10">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold">{success}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-gradient-to-r from-[#BF3853]/10 to-[#A41F39]/10 border-2 border-[#BF3853]/50 text-gray-900 px-6 py-4 rounded-2xl mb-6 shadow-lg shadow-[#BF3853]/10">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/95 backdrop-blur-sm border border-[#E56D85]/40 rounded-lg p-3 shadow-md shadow-[#E56D85]/10 hover:shadow-lg hover:scale-102 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-[#E56D85] to-[#BF3853] rounded-lg shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h0a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-lg font-bold text-gray-900">{filteredServices.length}</p>
                <p className="text-m font-bold text-gray-900">Total Services</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm border border-[#E56D85]/40 rounded-lg p-3 shadow-md shadow-[#E56D85]/10 hover:shadow-lg hover:scale-102 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-[#E56D85] to-[#BF3853] rounded-lg shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-lg font-bold text-gray-900">{filteredServices.filter(s => s.is_active).length}</p>
                <p className="text-m font-bold text-gray-900">Active Services</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm border border-[#E56D85]/40 rounded-lg p-3 shadow-md shadow-[#E56D85]/10 hover:shadow-lg hover:scale-102 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-[#E56D85] to-[#BF3853] rounded-lg shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-lg font-bold text-green-700">₱{filteredServices.reduce((sum, s) => sum + parseFloat(s.price || 0), 0).toLocaleString()}</p>
                <p className="text-m font-bold text-gray-900">Total Value</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm border border-[#E56D85]/40 rounded-lg p-3 shadow-md shadow-[#E56D85]/10 hover:shadow-lg hover:scale-102 transition-all duration-200">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-[#E56D85] to-[#BF3853] rounded-lg shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-lg font-bold text-gray-900">
                  {filteredServices.length > 0 ? [...new Set(filteredServices.map(s => s.category).filter(Boolean))].length : 0}
                </p>
                <p className="text-m font-bold text-gray-900">Categories</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-xl shadow-[#E56D85]/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative w-full max-w-sm">
                {/* Search Icon */}
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-900 z-10 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>

                {/* Input Field */}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search services..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300 placeholder:text-gray-900"
                />
              </div>
             
              <div className="flex gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none px-4 py-3 bg-gradient-to-br from-[#FDB3C2]/20 to-[#F891A5]/20 border border-[#F891A5]/30 rounded-xl hover:from-[#FDB3C2]/30 hover:to-[#F891A5]/30 transition-all duration-200">
                  <input
                    type="checkbox"
                    checked={showActiveOnly}
                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                    className="rounded border-[#F891A5] text-[#E56D85] focus:ring-[#E56D85] focus:ring-2"
                  />
                  <span className="text-sm font-bold text-gray-900">Active only</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center justify-center rounded-xl bg-[#A41F39] px-6 py-3 text-sm font-bold text-white hover:shadow-2xl hover:shadow-[#BF3853]/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E56D85] transition-all duration-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Service
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-lg border-2 border-[#FDB3C2]/30 rounded-2xl shadow-2xl shadow-[#E56D85]/10 overflow-hidden">
          <div className="px-5 py-3 bg-[#A41F39]">
            <h2 className="text-base font-bold text-white">
              Medical Services & Charges ({filteredServices.length})
            </h2>
          </div>

          {filteredServices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#FDB3C2]/30 to-[#F891A5]/30 rounded-2xl mb-4 border-2 border-[#F891A5]/40">
                <svg className="h-10 w-10 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h0a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">No services found</h3>
              <p className="mt-2 text-sm text-gray-900">Get started by creating your first medical service.</p>
              <div className="mt-6">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#E56D85] to-[#BF3853] hover:shadow-2xl hover:shadow-[#BF3853]/30 hover:scale-105 transition-all duration-300"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Service
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-[#FDB3C2]/30">
                <thead className="bg-gradient-to-r from-[#FDB3C2]/10 to-[#F891A5]/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-m font-bold text-gray-900 uppercase tracking-wider">
                      Service Name
                    </th>
                    <th className="px-6 py-4 text-left text-m font-bold text-gray-900 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-m font-bold text-gray-900 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-right text-m font-bold text-gray-900 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-right text-m font-bold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#FDB3C2]/20">
                  {filteredServices.map((service, index) => (
                    <tr key={service.id} className={`hover:bg-gradient-to-r hover:from-[#FDB3C2]/10 hover:to-[#F891A5]/10 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-[#FDB3C2]/5'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-2 w-2 rounded-full mr-3 ${service.is_active ? 'bg-[#E56D85]' : 'bg-gray-400'}`}></div>
                          <div>
                            <div className="text-m font-bold text-gray-900">{service.service_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {service.category && (
                          <span className="inline-flex items-center text-m font-bold text-gray-900">
                            {service.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-m text-gray-900 truncate">
                          {service.description || 'No description provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-m font-bold text-green-700">
                          ₱{parseFloat(service.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(service)}
                            className="inline-flex items-center px-3 py-1.5 border-2 border-[#E56D85] rounded-xl text-xs font-bold text-gray-900 bg-white hover:bg-gradient-to-r hover:from-[#FDB3C2]/20 hover:to-[#F891A5]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E56D85] transition-all duration-300 hover:shadow-md"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(service)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:shadow-2xl hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 hover:scale-105"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
          <div className="relative mx-auto w-11/12 max-w-lg">
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-[#E56D85]/20 overflow-hidden">
              {(modalType === 'create' || modalType === 'edit') && (
                <>
                  {/* Header */}
                  <div className="px-6 py-4 bg-[#A41F39]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={modalType === 'create' ? "M12 4v16m8-8H4" : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          {modalType === 'create' ? 'Add Service' : 'Edit Service'}
                        </h3>
                      </div>
                      <button
                        onClick={closeModal}
                        className="text-white/80 hover:text-white focus:outline-none hover:bg-white/10 rounded-lg p-1 transition-all duration-200"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="p-6">

                    {/* Error Messages */}
                    {Object.values(formErrors).filter(err => err).length > 0 && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-red-50/80 to-red-100/80 border-2 border-red-300 rounded-xl flex items-start shadow-md">
                        <svg className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-sm text-red-800">
                          <p className="font-bold mb-2">Please fix the following errors:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {Object.values(formErrors).filter(err => err).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                  <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Service Name */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Service Name *
                      </label>
                      {!customInputs.service_name ? (
                        <select
                          value={formData.service_name}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '__other__') {
                              setCustomInputs(prev => ({ ...prev, service_name: true }));
                              setFormData(prev => ({ ...prev, service_name: '' }));
                            } else if (v) {
                              const svc = services.find(s => s.service_name === v);
                              if (svc) {
                                setFormData({
                                  service_name: v,
                                  category: svc?.category ?? '',
                                  description: svc?.description ?? '',
                                  price: svc?.price !== undefined && svc?.price !== null ? String(svc.price) : '',
                                  is_active: svc?.is_active ?? formData.is_active,
                                });
                                setCustomInputs({
                                  service_name: false,
                                  category: !svc?.category,
                                  description: !svc?.description,
                                  price: !svc?.price
                                });
                              }
                            }
                          }}
                          className={`block w-full h-11 px-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm bg-white/80 backdrop-blur-sm transition-all duration-300 ${
                            formErrors.service_name ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                          }`}
                          required
                        >
                          <option value="">Select service name...</option>
                          {serviceNameOptions.map((v, i) => (
                            <option key={i} value={v}>{v}</option>
                          ))}
                          <option value="__other__">+ Add New Service</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.service_name}
                          onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                          placeholder="Enter service name"
                          className={`block w-full h-11 px-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm bg-white/80 backdrop-blur-sm transition-all duration-300 placeholder:text-gray-900 leading-normal ${
                            formErrors.service_name ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                          }`}
                          required
                        />
                      )}
                      {formErrors.service_name && (
                        <p className="mt-1 text-sm text-red-600 font-medium">{formErrors.service_name}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Category
                      </label>
                      {!customInputs.category ? (
                        <select
                          value={formData.category}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '__other__') {
                              setCustomInputs(prev => ({ ...prev, category: true }));
                              setFormData(prev => ({ ...prev, category: '' }));
                            } else {
                              setFormData(prev => ({ ...prev, category: v }));
                            }
                          }}
                          className="block w-full h-11 px-4 border-2 border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm transition-all duration-300"
                        >
                          <option value="">Select category...</option>
                          {categoryOptions.map((v, i) => (
                            <option key={i} value={v}>{v}</option>
                          ))}
                          <option value="__other__">+ Add New Category</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="e.g., Consultation, Diagnostic, Laboratory"
                          className="block w-full h-11 px-4 border-2 border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm transition-all duration-300 placeholder:text-gray-900 leading-normal"
                        />
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Description
                      </label>
                      {!customInputs.description ? (
                        <select
                          value={formData.description}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '__other__') {
                              setCustomInputs(prev => ({ ...prev, description: true }));
                              setFormData(prev => ({ ...prev, description: '' }));
                            } else {
                              setFormData(prev => ({ ...prev, description: v }));
                            }
                          }}
                          className="block w-full h-11 px-4 border-2 border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm transition-all duration-300"
                        >
                          <option value="">Select description...</option>
                          {descriptionOptions.map((v, i) => (
                            <option key={i} value={v}>{v}</option>
                          ))}
                          <option value="__other__">+ Add New Description</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Brief description of the service"
                          className="block w-full h-11 px-4 border-2 border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm transition-all duration-300 placeholder:text-gray-900 leading-normal"
                        />
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Price *
                      </label>
                      {!customInputs.price ? (
                        <select
                          value={formData.price}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '__other__') {
                              setCustomInputs(prev => ({ ...prev, price: true }));
                              setFormData(prev => ({ ...prev, price: '' }));
                            } else {
                              setFormData(prev => ({ ...prev, price: v }));
                            }
                          }}
                          className={`block w-full h-11 px-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm bg-white/80 backdrop-blur-sm transition-all duration-300 ${
                            formErrors.price ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                          }`}
                          required
                        >
                          <option value="">Select price...</option>
                          {priceOptions.map((v, i) => (
                            <option key={i} value={v}>{v}</option>
                          ))}
                          <option value="__other__">+ Add New Price</option>
                        </select>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          className={`block w-full h-11 px-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent text-sm bg-white/80 backdrop-blur-sm transition-all duration-300 leading-normal ${
                            formErrors.price ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                          }`}
                          required
                        />
                      )}
                      {formErrors.price && (
                        <p className="mt-1 text-sm text-red-600 font-medium">{formErrors.price}</p>
                      )}
                      {formData.price && (
                        <p className="mt-1 text-xs text-green-700 font-medium bg-green-50/50 rounded-lg px-2 py-1">
                          Preview: {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                            minimumFractionDigits: 2
                          }).format(parseFloat(formData.price) || 0)}
                        </p>
                      )}
                    </div>

                    {/* Active Status */}
                    <div className="flex items-start">
                      <input
                        id="active"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-[#E56D85] focus:ring-[#E56D85] focus:ring-2 border-[#F891A5] rounded mt-1"
                      />
                      <div className="ml-3">
                        <label htmlFor="active" className="block text-sm font-bold text-gray-900">
                          Active Service
                        </label>
                        <p className="text-xs text-gray-900 mt-1">
                          Active services are available for selection when creating patient charges
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-6 border-t border-[#FDB3C2]/30 mt-6">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-4 py-3 border-2 border-[#E56D85] rounded-xl text-sm font-bold text-gray-900 bg-white hover:bg-gradient-to-r hover:from-[#FDB3C2]/20 hover:to-[#F891A5]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E56D85] transition-all duration-300 hover:shadow-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#E56D85] to-[#BF3853] border border-transparent rounded-xl text-sm font-bold text-white hover:shadow-2xl hover:shadow-[#BF3853]/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E56D85] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                      >
                        {submitting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {modalType === 'create' ? 'Creating...' : 'Saving...'}
                          </div>
                        ) : (
                          modalType === 'create' ? 'Create Service' : 'Save Changes'
                        )}
                      </button>
                    </div>
                    </form>
                  </div>
                </>
              )}

              {modalType === 'delete' && (
                <>
                  <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 border-b border-red-600/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-white">Delete Service</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <p className="text-gray-900 font-medium mb-2">Are you sure you want to delete:</p>
                      <p className="text-lg font-bold text-gray-900 mb-2">\"{selectedService?.service_name}\"?</p>
                      <p className="text-sm text-gray-900">This action cannot be undone and will remove the service permanently.</p>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                      <button onClick={closeModal} className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300">
                        Cancel
                      </button>
                      <button onClick={handleDelete} disabled={submitting} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 border border-transparent rounded-xl text-sm font-bold text-white hover:shadow-2xl hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105">
                        {submitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Deleting...
                          </div>
                        ) : (
                          'Delete Service'
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
