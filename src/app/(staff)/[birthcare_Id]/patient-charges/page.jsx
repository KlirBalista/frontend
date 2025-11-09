"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/hooks/auth';
import BulkChargingModal from '@/components/BulkChargingModal';
import DiscountModal from '@/components/DiscountModal';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export default function PatientChargesPage() {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const [admittedPatients, setAdmittedPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [searchService, setSearchService] = useState('');
  const [showActiveServicesOnly, setShowActiveServicesOnly] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Pending/saved charges that are accumulated until final billing
  const [savedCharges, setSavedCharges] = useState([]); // array of groups for the currently selected patient
  const [databaseCharges, setDatabaseCharges] = useState(null); // charges already saved in database
  const STORAGE_KEY = `pending_charges_${birthcare_Id}`;
  
  // Enhanced functionality state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedBillForDiscount, setSelectedBillForDiscount] = useState(null);
  const [showSavedChargesModal, setShowSavedChargesModal] = useState(false);
  const [showSelectedServicesModal, setShowSelectedServicesModal] = useState(false);

  // Sample admitted patients data for demonstration
  const samplePatients = [
    {
      id: 1,
      firstname: "Maria",
      lastname: "Santos",
      middlename: "Cruz",
      age: 28,
      admission_date: "2025-01-15",
      room_number: "201",
      room_type: "Private",
      status: "Admitted"
    },
    {
      id: 2,
      firstname: "Anna",
      lastname: "Garcia",
      middlename: "Lopez",
      age: 25,
      admission_date: "2025-01-16",
      room_number: "102",
      room_type: "Semi-Private",
      status: "Admitted"
    },
    {
      id: 3,
      firstname: "Carmen",
      lastname: "Rodriguez",
      middlename: "Torres",
      age: 32,
      admission_date: "2025-01-17",
      room_number: "301",
      room_type: "Private",
      status: "Admitted"
    },
    {
      id: 4,
      firstname: "Isabel",
      lastname: "Fernandez",
      middlename: "Morales",
      age: 29,
      admission_date: "2025-01-18",
      room_number: "205",
      room_type: "Private",
      status: "In Labor"
    }
  ];



  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_patient_charges"))
  ) {
    return <div>Unauthorized</div>;
  }

  // Fetch admitted patients
  const fetchAdmittedPatients = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching admitted patients from patient charges API...');
      
      // Use the correct patient-charges endpoint
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/patient-charges/admitted-patients`);
      
      if (response.data.success && response.data.data) {
        const admittedPatients = response.data.data;
        console.log('Successfully fetched', admittedPatients.length, 'admitted patients from patient charges API');
        setAdmittedPatients(admittedPatients);
        return;
      } else {
        throw new Error(response.data.message || 'Failed to fetch admitted patients');
      }
      
    } catch (err) {
      console.error('Error fetching admitted patients from API:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      
      // If the admission API fails, try alternative endpoints
      try {
        console.log('Trying alternative approach: fetching from patient-admission endpoint...');
        
        // Try the patient-admission endpoint
        let alternativeResponse;
        try {
          alternativeResponse = await axios.get(`/api/birthcare/${birthcare_Id}/patient-admission`);
        } catch (admissionErr) {
          console.log('Patient-admission endpoint failed, trying patients endpoint...');
          alternativeResponse = await axios.get(`/api/birthcare/${birthcare_Id}/patients`);
        }
        
        const allData = alternativeResponse.data.data || alternativeResponse.data || [];
        
        // Filter for patients who can be charged (admitted, in-labor, delivered)
        const admittedPatients = allData.filter(item => {
          // Check various possible status fields for chargeable statuses
          const status = item.status || item.admission_status || '';
          const lowerStatus = status.toLowerCase();
          
          return lowerStatus === 'admitted' || 
                 lowerStatus === 'active' ||
                 lowerStatus === 'in-labor' ||
                 lowerStatus === 'delivered' ||
                 // Fallback: if no discharge date and has admission date
                 ((item.discharge_date === null || item.discharge_date === undefined) &&
                  (item.admission_date !== null && item.admission_date !== undefined))
        });
        
        if (admittedPatients.length > 0) {
          console.log('Found', admittedPatients.length, 'admitted patients from alternative endpoint');
          setAdmittedPatients(admittedPatients);
        } else {
          console.log('No admitted patients found in any endpoint, using sample data');
          setAdmittedPatients(samplePatients);
          setError('⚠️ No currently admitted patients found in system. Showing sample data for demonstration. Please check if there are any actual admitted patients in the admission list.');
        }
        
      } catch (fallbackErr) {
        console.error('Fallback patient fetch also failed:', fallbackErr);
        console.log('Using sample patients data for demonstration');
        setAdmittedPatients(samplePatients);
        setError('⚠️ Unable to fetch patient data from API. Using sample data for demonstration. Please check your network connection and server status.');
      }
    }
  };

  // Fetch services from the patient charges system
  const fetchServices = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching medical services from patient charges API...');
      
      // Use the correct patient charges services endpoint
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/patient-charges/services`);
        
      const data = response.data;
      
      if (data.success && data.data) {
        const fetchedServices = data.data;
        console.log(`Successfully fetched ${fetchedServices.length} medical services from patient charges API`);
        setServices(fetchedServices);
        return;
      } else {
        throw new Error(data.message || 'Failed to fetch services');
      }
      
    } catch (err) {
      console.error('Error fetching medical services:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      
      // No fallback - services must be created in item charges navigation
      console.log('No services found - services need to be created in item charges navigation');
      setServices([]);
      setError('⚠️ No medical services found. Please create services in the Item Charges navigation first.');
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAdmittedPatients(),
        fetchServices()
      ]);
      setLoading(false);
    };

    if (user && birthcare_Id) {
      initializeData();
    }
  }, [user, birthcare_Id]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.patient-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  // Filter patients based on search
  const filteredPatients = admittedPatients.filter(patient => {
    // Handle both direct patient data and admission data with nested patient
    const patientData = patient.patient || patient;
    const firstName = patientData.firstname || patientData.first_name || patient.firstname || '';
    const lastName = patientData.lastname || patientData.last_name || patient.lastname || '';
    const middleName = patientData.middlename || patientData.middle_name || patient.middlename || '';
    
    const fullName = `${firstName} ${middleName} ${lastName}`.toLowerCase();
    const roomNumber = patient.room_number || patient.room?.room_number || '';
    
    return fullName.includes(searchPatient.toLowerCase()) || 
           roomNumber.toString().toLowerCase().includes(searchPatient.toLowerCase());
  });

  // Filter services based on search and active status
  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchService.toLowerCase()) ||
                         (service.description && service.description.toLowerCase().includes(searchService.toLowerCase())) ||
                         (service.category && service.category.toLowerCase().includes(searchService.toLowerCase()));
    
    const isActiveFilter = showActiveServicesOnly ? service.is_active : true;
    
    return matchesSearch && isActiveFilter;
  });

  // Add service to selected services
  const addServiceToSelection = (service) => {
    const existingService = selectedServices.find(s => s.id === service.id);
    if (existingService) {
      setSelectedServices(selectedServices.map(s => 
        s.id === service.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ));
    } else {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }]);
    }
    setShowSelectedServicesModal(true);
  };

  // Remove service from selected services
  const removeServiceFromSelection = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  // Update service quantity
  const updateServiceQuantity = (serviceId, quantity) => {
    if (quantity <= 0) {
      removeServiceFromSelection(serviceId);
      return;
    }
    
    setSelectedServices(selectedServices.map(s => 
      s.id === serviceId ? { ...s, quantity } : s
    ));
  };

  // Calculate totals for currently selected (unsaved) services
  const totalCharges = selectedServices.reduce((total, service) => 
    total + (service.price * service.quantity), 0
  );

  // Helpers for saved charges persistence
  const readAllSaved = () => {
    try {
      if (typeof window === 'undefined') return {};
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  };
  const writeAllSaved = (data) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  };
  const getPatientId = (patient) => {
    // When fetched from getAdmittedPatients API, the structure has patient_id field
    // which is the actual patients table ID
    return patient?.patient_id || patient?.patient?.id || patient?.id;
  };
  const loadSavedForSelectedPatient = () => {
    if (!selectedPatient) { 
      setSavedCharges([]); 
      setDatabaseCharges(null);
      return; 
    }
    const all = readAllSaved();
    const pid = getPatientId(selectedPatient);
    setSavedCharges(all[pid] || []);
    // Also fetch database charges
    fetchDatabaseCharges(pid);
  };

  // Fetch charges already saved in the database for this patient
  const fetchDatabaseCharges = async (patientId) => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/patient-charges/bill-summary/${patientId}`);
      if (response.data.success && response.data.data.has_bill) {
        setDatabaseCharges(response.data.data);
      } else {
        setDatabaseCharges(null);
      }
    } catch (err) {
      console.error('Error fetching database charges:', err);
      setDatabaseCharges(null);
    }
  };

  useEffect(() => { loadSavedForSelectedPatient(); }, [selectedPatient]);

  // Save (stage) currently selected services for the selected patient
  const handleSaveCharges = async () => {
    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one service to save');
      return;
    }

    setSubmitting(true);
    try {
      const pid = getPatientId(selectedPatient);
      const all = readAllSaved();
      const existing = all[pid] || [];
      
      // If there are existing saved charges, merge with the last group
      let updated;
      if (existing.length > 0) {
        // Get the last group and merge services
        const lastGroup = existing[existing.length - 1];
        const mergedItems = [...lastGroup.items];
        
        // Merge new services with existing ones
        selectedServices.forEach(newService => {
          const existingItem = mergedItems.find(item => item.id === newService.id);
          if (existingItem) {
            // Add to existing quantity
            existingItem.quantity += newService.quantity;
          } else {
            // Add new service
            mergedItems.push({
              id: newService.id,
              service_name: newService.service_name,
              price: newService.price,
              quantity: newService.quantity
            });
          }
        });
        
        // Update the last group with merged items and new timestamp
        const updatedLastGroup = {
          ...lastGroup,
          saved_at: new Date().toISOString(),
          items: mergedItems
        };
        
        updated = [...existing.slice(0, -1), updatedLastGroup];
      } else {
        // Create first group
        const group = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          saved_at: new Date().toISOString(),
          items: selectedServices.map(s => ({ 
            id: s.id, 
            service_name: s.service_name, 
            price: s.price, 
            quantity: s.quantity 
          }))
        };
        updated = [group];
      }
      
      all[pid] = updated;
      writeAllSaved(all);
      setSavedCharges(updated);
      setSelectedServices([]);
      setSuccess('Charges saved for this patient. You can finalize and charge later.');
      // Open the Saved Charges modal immediately
      setShowSavedChargesModal(true);
    } catch (err) {
      console.error('Error saving charges:', err);
      setError('Failed to save charges locally.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeSavedGroup = (groupId) => {
    if (!selectedPatient) return;
    const pid = getPatientId(selectedPatient);
    const all = readAllSaved();
    const updated = (all[pid] || []).filter(g => g.id !== groupId);
    all[pid] = updated;
    writeAllSaved(all);
    setSavedCharges(updated);
  };

  // Finalize and create an actual charge from all saved groups for this patient
  const handleFinalizeCharge = async () => {
    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }
    
    // Allow finalizing with empty services (room charges only)
    // Remove the check: if (savedCharges.length === 0) return error

    setSubmitting(true);
    try {
      // Flatten and aggregate items by service id to prevent duplicate entries
      const itemsMap = {};
      if (savedCharges && savedCharges.length > 0) {
        savedCharges.forEach(g => {
          g.items.forEach(it => {
            const serviceId = parseInt(it.id);
            if (!itemsMap[serviceId]) {
              itemsMap[serviceId] = { 
                id: serviceId, 
                price: parseFloat(it.price), 
                quantity: 0 
              };
            }
            // Aggregate quantities for the same service
            itemsMap[serviceId].quantity += it.quantity;
          });
        });
      }
      
      // If no services but patient has room price, try to find or create a room charge service
      let servicesPayload = Object.values(itemsMap);
      
      // If there are no services in the payload, try to find a room accommodation charge
      if (servicesPayload.length === 0 && selectedPatient.room_price) {
        // Look for a room/accommodation service in available services
        const roomService = services.find(s => 
          s.category && 
          (s.category.toLowerCase().includes('room') || 
           s.category.toLowerCase().includes('accommodation')) &&
          parseFloat(s.price) === parseFloat(selectedPatient.room_price)
        );
        
        if (roomService) {
          // Add room service with quantity 1 (backend will calculate actual days)
          servicesPayload = [{
            id: parseInt(roomService.id),
            price: parseFloat(roomService.price),
            quantity: 1
          }];
          console.log('Automatically added room charge service:', roomService.service_name);
        } else {
          // Try to find any room/accommodation service as fallback
          const anyRoomService = services.find(s => 
            s.category && 
            (s.category.toLowerCase().includes('room') || 
             s.category.toLowerCase().includes('accommodation'))
          );
          
          if (anyRoomService) {
            servicesPayload = [{
              id: parseInt(anyRoomService.id),
              price: parseFloat(selectedPatient.room_price || anyRoomService.price),
              quantity: 1
            }];
            console.log('Using room service with patient room price:', anyRoomService.service_name);
          } else if (servicesPayload.length === 0) {
            // No services at all to charge
            setSubmitting(false);
            setError('Cannot finalize: No services to charge and no room accommodation service found. Please add services first or create a room accommodation charge in Item Charges.');
            return;
          }
        }
      }

      // When fetched from getAdmittedPatients, the structure has:
      // - id: admission id (patient_admissions.id)
      // - patient_id: actual patient id (patients.id)
      // - admission_id: also the admission id
      const patientId = selectedPatient.patient_id;
      const admissionId = selectedPatient.admission_id || selectedPatient.id;

      const chargeData = {
        patient_id: parseInt(patientId),
        admission_id: parseInt(admissionId),
        services: servicesPayload
      };

      console.log('=== FINALIZING CHARGE ===');
      console.log('Payload being sent:', JSON.stringify(chargeData, null, 2));
      console.log('Selected patient data:', selectedPatient);
      console.log('Patient ID:', patientId);
      console.log('Admission ID:', admissionId);
      console.log('Saved charges data:', savedCharges);
      console.log('Services payload:', servicesPayload);
      console.log('Birthcare ID:', birthcare_Id);
      
      // Use the correct endpoint from the backend routes
      const response = await axios.post(`/api/birthcare/${birthcare_Id}/patient-charges/charge`, chargeData);
      
      console.log('SUCCESS: Final charge created:', response.data);

      // Clear saved charges for this patient after successful charge
      const pid = getPatientId(selectedPatient);
      const all = readAllSaved();
      all[pid] = [];
      writeAllSaved(all);
      setSavedCharges([]);
      // Refresh database charges to show the new bill
      await fetchDatabaseCharges(pid);
      
      if (savedCharges && savedCharges.length > 0) {
        setSuccess('Patient successfully charged from saved charges. Bill created in database.');
      } else {
        setSuccess('Bill created successfully with room charges. Ready for payment.');
      }
    } catch (apiErr) {
      console.error('Error finalizing charge:', apiErr);
      console.error('Full error response:', apiErr.response);
      
      let errorMessage = 'Unknown error occurred';
      
      if (apiErr.response?.data) {
        console.log('Backend error data:', apiErr.response.data);
        if (apiErr.response.data.message) {
          errorMessage = apiErr.response.data.message;
        } else if (apiErr.response.data.errors) {
          // Handle Laravel validation errors
          console.log('Validation errors:', apiErr.response.data.errors);
          const errors = Object.values(apiErr.response.data.errors).flat();
          errorMessage = errors.join(', ');
        } else if (typeof apiErr.response.data === 'string') {
          errorMessage = apiErr.response.data;
        }
      } else if (apiErr.message) {
        errorMessage = apiErr.message;
      }
      
      setError(`Failed to finalize charge: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Enhanced functionality handlers
  const handleBulkChargeSuccess = (result) => {
    setSuccess(`Bulk charging completed successfully! Charged ${result.successful_count} patients.`);
    if (result.failed_count > 0) {
      console.warn('Some charges failed:', result.failed_charges);
    }
    // Refresh data if needed
    if (selectedPatient) {
      const pid = getPatientId(selectedPatient);
      fetchDatabaseCharges(pid);
    }
  };

  const handleDiscountSuccess = (result) => {
    setSuccess(`Discount applied successfully! New total: ₱${result.new_total.toLocaleString()}`);
    setShowDiscountModal(false);
    setSelectedBillForDiscount(null);
    // Refresh database charges to show the updated bill
    if (selectedPatient) {
      const pid = getPatientId(selectedPatient);
      fetchDatabaseCharges(pid);
    }
  };

  const handleApplyDiscount = (bill) => {
    setSelectedBillForDiscount(bill);
    setShowDiscountModal(true);
  };

  // Show loading state while user is being fetched or data is loading
  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading patients charges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Patient Charges</h1>
            <p className="text-gray-900 mt-2 font-medium">Select admitted patients and charge medical services</p>
            {admittedPatients === samplePatients && (
              <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#FDB3C2]/30 to-[#F891A5]/30 text-[#A41F39] border border-[#F891A5]">
                ⚠️ Using sample patient data - real admitted patients may not be available
              </div>
            )}
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
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Patient Selection Section */}
        <div className="bg-white/95 backdrop-blur-lg border border-white/30 rounded-2xl shadow-xl self-start w-full min-h-[140px] hover:shadow-2xl transition-all duration-300">
            <div className="px-4 py-3 bg-[#A41F39] rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Select Admitted Patient</h3>
                  <p className="text-xs text-white/80 mt-0.5">Choose a patient to charge medical services</p>
                </div>
              </div>
            </div>
          
            <div className="p-4">
              {!selectedPatient ? (
                /* Search and Select Interface */
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-2">
                      Search Patient
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchPatient}
                        onChange={(e) => setSearchPatient(e.target.value)}
                        placeholder="Search patients by name or room number..."
                        className="w-full rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent pl-10 pr-4 py-3 text-sm bg-white/80 backdrop-blur-sm transition-all duration-300 placeholder:text-gray-900"
                      />
                      <svg className="absolute left-3 top-3.5 h-4 w-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Dropdown List */}
                  {searchPatient.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-2">
                        Select from Results
                      </label>
                      <div className="border-2 border-[#FDB3C2] rounded-xl max-h-36 overflow-y-auto bg-white/90 backdrop-blur-sm shadow-inner">
                        {filteredPatients.length > 0 ? (
                          filteredPatients.map((patient) => (
                            <div
                              key={patient.id}
                              onClick={() => {
                                setSelectedPatient(patient);
                                setSearchPatient('');
                              }}
                              className="px-3 py-2.5 hover:bg-gradient-to-r hover:from-[#FDB3C2]/30 hover:to-[#F891A5]/30 cursor-pointer border-b border-[#FDB3C2]/30 last:border-b-0 transition-all duration-200 rounded-xl mx-1 my-0.5 hover:shadow-md"
                            >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                {(() => {
                                  const patientData = patient.patient || patient;
                                  const firstName = patientData.firstname || patientData.first_name || patient.firstname || '';
                                  const lastName = patientData.lastname || patientData.last_name || patient.lastname || '';
                                  const middleName = patientData.middlename || patientData.middle_name || patient.middlename || '';
                                  
                                  return (
                                    <h3 className="font-medium text-gray-900 text-xs truncate">
                                      {firstName} {middleName} {lastName}
                                    </h3>
                                  );
                                })()}
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                  (patient.status === 'Admitted' || patient.status === 'admitted')
                                    ? 'bg-green-100 text-gray-900'
                                    : (patient.status === 'In Labor' || patient.status === 'In-labor' || patient.status === 'in-labor')
                                    ? 'bg-yellow-100 text-gray-900'
                                    : (patient.status === 'delivered' || patient.status === 'Delivered')
                                    ? 'bg-purple-100 text-gray-900'
                                    : 'bg-blue-100 text-gray-900'
                                }`}>
                                  {patient.status === 'In Labor' ? 'In-labor' : 
                                   patient.status === 'delivered' ? 'Delivered' :
                                   patient.status || 'Admitted'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-center text-gray-500 text-xs">
                          No patients found matching "{searchPatient}"
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* Selected Patient Display */
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-[#FDB3C2]/20 to-[#F891A5]/20 border-2 border-[#E56D85]/40 rounded-2xl px-4 py-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        {(() => {
                          const patientData = selectedPatient.patient || selectedPatient;
                          const firstName = patientData.firstname || patientData.first_name || selectedPatient.firstname || '';
                          const lastName = patientData.lastname || patientData.last_name || selectedPatient.lastname || '';
                          const middleName = patientData.middlename || patientData.middle_name || selectedPatient.middlename || '';
                          
                          return (
                            <h3 className="text-sm font-bold text-gray-900 truncate">
                              {firstName} {middleName} {lastName}
                            </h3>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        (selectedPatient.status === 'Admitted' || selectedPatient.status === 'admitted')
                          ? 'bg-gradient-to-r from-green-100 to-green-200 text-gray-900 border border-green-300'
                          : (selectedPatient.status === 'In Labor' || selectedPatient.status === 'In-labor' || selectedPatient.status === 'in-labor')
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-gray-900 border border-yellow-300'
                          : (selectedPatient.status === 'delivered' || selectedPatient.status === 'Delivered')
                          ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-gray-900 border border-purple-300'
                          : 'bg-gradient-to-r from-blue-100 to-blue-200 text-gray-900 border border-blue-300'
                      }`}>
                        {selectedPatient.status === 'In Labor' ? 'In-labor' : 
                         selectedPatient.status === 'delivered' ? 'Delivered' :
                         selectedPatient.status || 'Admitted'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Room Information Card */}
                <div className="bg-gradient-to-br from-[#FDB3C2]/15 to-[#F891A5]/15 border-2 border-[#F891A5]/40 rounded-2xl px-3 py-2.5 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Room Assignment</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-900 mb-1">Room Number</p>
                      <p className="text-sm font-bold text-gray-900">{selectedPatient.room_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-900 mb-1">Room Price</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedPatient.room_price ? `₱${parseFloat(selectedPatient.room_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Change Patient Button */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setSearchPatient('');
                    }}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold text-gray-900 bg-white border-2 border-[#E56D85] rounded-xl hover:bg-gradient-to-r hover:from-[#FDB3C2]/20 hover:to-[#F891A5]/20 hover:shadow-md transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Change Patient
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Selection Section */}
        <div className="bg-white/95 backdrop-blur-lg border border-white/30 rounded-2xl shadow-xl self-start w-full min-h-[140px] hover:shadow-2xl transition-all duration-300">
          <div className="px-4 py-3 bg-[#A41F39] rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Select Medical Services</h3>
                <p className="text-xs text-white/80 mt-0.5">Add services to charge the selected patient</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="mb-3 space-y-2">
              <label className="block text-xs font-medium text-gray-900 mb-2">
                Search Services
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                  placeholder="Search services..."
                  className="w-full rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent pl-10 pr-4 py-3 text-sm bg-white/80 backdrop-blur-sm transition-all duration-300 placeholder:text-gray-900"
                />
                <svg className="absolute left-3 top-3.5 h-4 w-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {searchService.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="px-3 py-2.5 rounded-xl border-2 border-[#FDB3C2] hover:border-[#E56D85] hover:bg-gradient-to-r hover:from-[#FDB3C2]/10 hover:to-[#F891A5]/10 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{service.service_name}</h4>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <p className="font-bold text-gray-900 text-sm">₱{service.price.toLocaleString()}</p>
                      <button
                        onClick={() => addServiceToSelection(service)}
                        disabled={!selectedPatient}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#E56D85] to-[#BF3853] hover:shadow-lg hover:shadow-[#BF3853]/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E56D85] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
                      >
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}

            {searchService.length > 0 && filteredServices.length === 0 && (
              <div className="text-center py-6 text-gray-900">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#FDB3C2]/30 to-[#F891A5]/30 rounded-2xl mb-3 border border-[#F891A5]">
                  <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">No Services Available</h3>
                <p className="text-xs text-gray-900 mb-2">Services need to be created first in Item Charges navigation</p>
                <div className="text-xs text-gray-900 bg-[#FDB3C2]/10 rounded-lg px-3 py-2 inline-block">
                  Go to Item Charges → Create medical services → Then return here to charge patients
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Services Modal */}
      <Transition appear show={showSelectedServicesModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowSelectedServicesModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl shadow-[#BF3853]/10 transition-all">
                  <div className="px-5 py-4 bg-[#A41F39] relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5"></div>
                    <div className="relative z-10">
                      <Dialog.Title as="h3" className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Selected Services to Save
                      </Dialog.Title>
                      <p className="text-white mt-1 text-xs font-medium">Save these services as pending charges for the selected patient</p>
                    </div>
                  </div>

                  <div className="p-5 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2 mb-4">
                      {selectedServices.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-3 bg-gradient-to-br from-[#FDB3C2]/10 to-[#F891A5]/10 rounded-xl border border-[#F891A5]/30 hover:border-[#E56D85]/50 hover:shadow-md hover:shadow-[#E56D85]/10 transition-all duration-200">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">{service.service_name}</h4>
                            <p className="text-xs text-gray-900 mt-0.5">₱{service.price.toLocaleString()} each</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-white/60 rounded-full px-1 py-0.5 shadow-sm">
                              <button
                                onClick={() => updateServiceQuantity(service.id, service.quantity - 1)}
                                className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F891A5] to-[#E56D85] flex items-center justify-center text-white hover:from-[#E56D85] hover:to-[#BF3853] transition-all duration-200 shadow-sm hover:shadow-md font-bold text-base"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-bold text-gray-900 text-sm">{service.quantity}</span>
                              <button
                                onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}
                                className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F891A5] to-[#E56D85] flex items-center justify-center text-white hover:from-[#E56D85] hover:to-[#BF3853] transition-all duration-200 shadow-sm hover:shadow-md font-bold text-base"
                              >
                                +
                              </button>
                            </div>
                            
                            <div className="text-right min-w-20">
                              <p className="font-bold text-gray-900 text-sm">₱{(service.price * service.quantity).toLocaleString()}</p>
                            </div>
                            
                            <button
                              onClick={() => removeServiceFromSelection(service.id)}
                              className="ml-1 text-gray-900 hover:text-gray-900 hover:bg-[#FDB3C2]/20 p-1.5 rounded-lg transition-all duration-200"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#E56D85]/20 pt-4">
                      <div className="flex justify-between items-center mb-3 bg-gradient-to-r from-[#E56D85]/10 to-[#BF3853]/10 p-3 rounded-xl border border-[#E56D85]/30">
                        <span className="text-sm font-bold text-gray-900">Total (to save):</span>
                        <span className="text-xl font-bold text-gray-900">₱{totalCharges.toLocaleString()}</span>
                      </div>
                      
                      {selectedPatient && (
                        <div className="p-3 bg-gradient-to-br from-[#FDB3C2]/20 to-[#F891A5]/20 rounded-xl border border-[#F891A5]/40">
                          {(() => {
                            const patientData = selectedPatient.patient || selectedPatient;
                            const firstName = patientData.firstname || patientData.first_name || '';
                            const lastName = patientData.lastname || patientData.last_name || '';
                            
                            return (
                              <p className="text-xs text-gray-900 font-medium">
                                <span className="font-bold text-gray-900">Saving for:</span> {firstName} {lastName}
                              </p>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#E56D85]/20 px-5 py-4 bg-gradient-to-br from-[#FDB3C2]/10 to-white flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        handleSaveCharges();
                        setShowSelectedServicesModal(false);
                      }}
                      disabled={!selectedPatient || submitting}
                      className="bg-[#A41F39] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-[#A41F39]/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Pending Charges
                        </>
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Database Charges (already finalized) - Compact Rose Theme */}
      {selectedPatient && databaseCharges && (
        <div className="mt-6 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl shadow-[#BF3853]/10">
          <div className="px-5 py-3 bg-[#A41F39] border-b border-[#A41F39]/20 rounded-t-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Patient Charges
            </h2>
          </div>
          <div className="p-5">
            {/* Bill Summary - Compact */}
            <div className="bg-gradient-to-br from-[#FDB3C2]/20 to-[#F891A5]/20 border border-[#E56D85]/40 rounded-xl p-4 mb-4 shadow-md">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-900 font-medium">Bill Number:</span>
                  <span className="ml-2 font-bold text-gray-900">{databaseCharges.bill_number}</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    databaseCharges.status === 'paid' 
                      ? 'bg-gradient-to-r from-green-100 to-green-200 text-gray-900 border border-green-300'
                      : databaseCharges.status === 'partially_paid'
                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-gray-900 border border-yellow-300'
                      : 'bg-gradient-to-r from-blue-100 to-blue-200 text-gray-900 border border-blue-300'
                  }`}>
                    {databaseCharges.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">Total Amount:</span>
                  <span className="ml-2 font-bold text-gray-900">₱{parseFloat(databaseCharges.total_amount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">Balance:</span>
                  <span className="ml-2 font-bold text-gray-900">₱{parseFloat(databaseCharges.balance_amount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">Items:</span>
                  <span className="ml-2 font-bold text-gray-900">{databaseCharges.items_count} items</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">Bill Date:</span>
                  <span className="ml-2 font-bold text-gray-900">{new Date(databaseCharges.bill_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Individual Charged Services - Compact */}
            {databaseCharges.bill_items && databaseCharges.bill_items.length > 0 && (() => {
              // Aggregate duplicate services by service_name
              const aggregatedItems = {};
              databaseCharges.bill_items.forEach(item => {
                // Use service_name as the key to group identical services
                const key = item.service_name;
                if (aggregatedItems[key]) {
                  // Add to existing item
                  aggregatedItems[key].quantity += item.quantity;
                  aggregatedItems[key].total_price = parseFloat(aggregatedItems[key].total_price) + parseFloat(item.total_price);
                } else {
                  // Create new aggregated item
                  aggregatedItems[key] = {
                    ...item,
                    quantity: item.quantity,
                    total_price: parseFloat(item.total_price)
                  };
                }
              });
              
              const aggregatedArray = Object.values(aggregatedItems);
              
              return (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Charged Services Breakdown
                  </h3>
                  <div className="space-y-2">
                    {aggregatedArray.map((item, index) => (
                    <div key={item.id || index} className="bg-gradient-to-br from-[#FDB3C2]/10 to-[#F891A5]/10 border border-[#F891A5]/30 rounded-xl p-3 hover:border-[#E56D85]/50 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm">{item.service_name}</h4>
                          {item.description && (
                            <p className="text-xs text-gray-900 mt-0.5">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-900">
                            <span className="bg-white/60 px-1.5 py-0.5 rounded">Qty: <span className="font-bold text-gray-900">{item.quantity}</span></span>
                            <span className="bg-white/60 px-1.5 py-0.5 rounded">Unit: <span className="font-bold text-gray-900">₱{parseFloat(item.unit_price).toLocaleString()}</span></span>
                            <span className="bg-white/60 px-1.5 py-0.5 rounded"><span className="font-bold text-gray-900">{new Date(item.created_at).toLocaleDateString()}</span></span>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-bold text-gray-900 text-sm">₱{parseFloat(item.total_price).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total Summary - Compact */}
                <div className="border-t border-[#E56D85]/30 mt-4 pt-4">
                  <div className="flex justify-between items-center bg-gradient-to-r from-[#E56D85]/10 to-[#BF3853]/10 p-3 rounded-xl border border-[#E56D85]/30">
                    <span className="text-sm font-bold text-gray-900">Total Bill Amount:</span>
                    <span className="text-lg font-bold text-gray-900">₱{parseFloat(databaseCharges.total_amount).toLocaleString()}</span>
                  </div>
                  {parseFloat(databaseCharges.balance_amount) > 0 && (
                    <div className="flex justify-between items-center mt-3 bg-gradient-to-r from-[#BF3853]/10 to-[#A41F39]/10 p-3 rounded-xl border border-[#BF3853]/30">
                      <span className="text-xs font-bold text-gray-900">Outstanding Balance:</span>
                      <span className="text-base font-bold text-gray-900">₱{parseFloat(databaseCharges.balance_amount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
            })()}
            
            {/* No items found message - Compact */}
            {(!databaseCharges.bill_items || databaseCharges.bill_items.length === 0) && (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#FDB3C2]/30 to-[#F891A5]/30 rounded-xl mb-2 border border-[#F891A5]">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-gray-900 text-sm font-semibold">No service breakdown available</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finalize Room Charges Only - when no services added yet */}
      {selectedPatient && savedCharges.length === 0 && !databaseCharges && selectedPatient.room_price && (
        <div className="mt-8 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl shadow-[#BF3853]/10">
          <div className="px-5 py-3 bg-[#A41F39] border-b border-[#A41F39]/20 rounded-t-3xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ready to Finalize Charges
            </h2>
            <p className="text-xs text-white mt-0.5 font-medium">Finalize room accommodation charges for this patient</p>
          </div>
          <div className="p-8">
            <div className="bg-gradient-to-br from-[#FDB3C2]/20 to-[#F891A5]/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <h3 className="text-sm font-bold text-gray-900">Room Charges</h3>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Room: <span className="font-semibold">{selectedPatient.room_number}</span></span>
                <span className="font-bold text-gray-900">₱{parseFloat(selectedPatient.room_price).toLocaleString()} /day</span>
              </div>
              
              <p className="text-xs text-gray-700 mt-2">
                Room charges will be calculated from admission date to discharge date.
                {!selectedPatient.discharge_date && ' Currently ongoing - charges will continue to accumulate until discharge.'}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Saved Charges Modal - Rose Theme */}
      <Transition appear show={showSavedChargesModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowSavedChargesModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl shadow-[#BF3853]/10 transition-all">
                  <div className="px-5 py-3 bg-[#A41F39] border-b border-[#A41F39]/20">
                    <Dialog.Title as="h3" className="text-base font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved Charges for this Patient
                    </Dialog.Title>
                  </div>

                  <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                    {savedCharges.map(group => (
                      <div key={group.id} className="border-2 border-[#F891A5]/30 rounded-xl p-4 bg-gradient-to-br from-[#FDB3C2]/10 to-[#F891A5]/10 hover:border-[#E56D85]/50 transition-all duration-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-gray-900">
                            Saved on: <span className="font-bold text-gray-900">{new Date(group.saved_at).toLocaleString()}</span>
                          </div>
                          <button 
                            onClick={() => removeSavedGroup(group.id)} 
                            className="text-gray-900 hover:text-white hover:bg-gray-900 text-xs font-bold px-3 py-1 rounded-lg border border-gray-900 transition-all duration-200 hover:shadow-md"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          {group.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-white/60 rounded-lg px-3 py-2">
                              <span className="text-gray-900 font-medium">{it.service_name} × {it.quantity}</span>
                              <span className="font-bold text-gray-900">₱{(it.price * it.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-[#E56D85]/20 px-5 py-4 bg-gradient-to-br from-[#FDB3C2]/10 to-white flex items-center justify-end gap-3">
                    <button
                      onClick={() => setShowSavedChargesModal(false)}
                      className="px-5 py-2 border-2 border-[#E56D85] text-gray-900 rounded-xl font-bold text-sm hover:bg-gradient-to-r hover:from-[#FDB3C2]/20 hover:to-[#F891A5]/20 transition-all duration-200 hover:shadow-md"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        handleFinalizeCharge();
                        setShowSavedChargesModal(false);
                      }}
                      disabled={submitting}
                      className="bg-[#A41F39] text-white px-6 py-2 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-[#A41F39]/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Finalize and Charge Patient
                        </>
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      {/* Enhanced Functionality Modals */}
      <BulkChargingModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        birthcareId={birthcare_Id}
        admittedPatients={admittedPatients}
        services={services}
        onSuccess={handleBulkChargeSuccess}
      />
      
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => {
          setShowDiscountModal(false);
          setSelectedBillForDiscount(null);
        }}
        birthcareId={birthcare_Id}
        bill={selectedBillForDiscount}
        onSuccess={handleDiscountSuccess}
      />
    </div>
  );
}
