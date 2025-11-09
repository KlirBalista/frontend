'use client';

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import PatientSearch from './PatientSearch';
import StatementOfAccount from './StatementOfAccount';
import axios from '@/lib/axios';

const PaymentDashboard = ({ birthcareId }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showSOA, setShowSOA] = useState(false);
  const [patientsWithBilling, setPatientsWithBilling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiErrors, setApiErrors] = useState([]);

  // Fetch patients with their billing information
  const fetchPatientsWithBilling = async () => {
    try {
      setLoading(true);
      setApiErrors([]); // Clear previous errors
      const errors = [];
      
      // Try to get patients with billing status from dedicated endpoint
      let patientsData = [];
      
      try {
        const response = await axios.get(`/api/birthcare/${birthcareId}/payments/patients`);
        if (response.data.success && response.data.data) {
          patientsData = response.data.data.map(patient => ({
            ...patient,
            // Ensure consistent naming for frontend
            first_name: patient.first_name || patient.firstname,
            last_name: patient.last_name || patient.lastname,
            middle_name: patient.middle_name || patient.middlename
          }));
          console.log('Fetched patients billing data from payments endpoint:', patientsData.length, 'patients');
          console.log('Sample patient data:', patientsData[0]);

          // Enhance each patient with accurate totals from SOA endpoint to ensure parity
          try {
            const enhanced = await Promise.all(patientsData.map(async (p) => {
              try {
                const soaRes = await axios.get(`/api/birthcare/${birthcareId}/payments/soa`, { params: { patient_id: p.id } });
                const totals = soaRes?.data?.data?.totals || {};
                return {
                  ...p,
                  current_charges: Number(totals.current_charges ?? p.current_charges ?? p.total_charges ?? 0),
                  current_payments: Number(totals.current_payments ?? p.current_payments ?? p.total_payments ?? 0),
                  outstanding_balance: Number(
                    totals.outstanding_balance ?? totals.active_balance ?? ((totals.current_charges ?? 0) - (totals.current_payments ?? 0))
                  ),
                };
              } catch (e) {
                // If SOA request fails for a patient, keep original data
                return p;
              }
            }));
            patientsData = enhanced;
          } catch (e) {
            console.warn('Failed to enhance patients with SOA totals:', e);
          }
        }
      } catch (endpointError) {
        const error = {
          endpoint: 'payments/patients',
          message: endpointError.message,
          status: endpointError.response?.status,
          data: endpointError.response?.data
        };
        errors.push(error);
        console.log('Payments endpoint not available, trying alternative approaches...', error);
      }
      
      // If dedicated endpoint fails, log the issue but don't try complex fallbacks
      if (patientsData.length === 0) {
        console.log('No patient data returned from payments/patients endpoint');
        // The backend should handle returning patients with proper billing information
        // If no data is returned, it likely means no patients are admitted or have billing records
      }
      
      // If we still don't have real data, show empty state
      if (patientsData.length === 0) {
        console.log('No real patient data found in database');
        patientsData = [];
      }
      
      setPatientsWithBilling(patientsData);
      setApiErrors(errors);
      
    } catch (error) {
      console.error('Error in fetchPatientsWithBilling:', error);
      setPatientsWithBilling([]);
      setApiErrors([...errors, { endpoint: 'main', message: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPatientsWithBilling();
  }, [birthcareId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const handleViewSOA = async (patient) => {
    // Show the SOA in modal
    setSelectedPatient(patient);
    setShowSOA(true);
  };

  const handleCloseSOA = () => {
    setShowSOA(false);
    setSelectedPatient(null);
    // Refresh the patient list to show updated payment status
    fetchPatientsWithBilling();
  };

  return (
    <div className="max-w-full mx-auto p-3">
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-900 mt-2 font-medium">Search for patients and manage their billing statements</p>
        </div>
      </div>

      {/* Patient Search Section */}
      <div className="bg-white/95 backdrop-blur-lg border-0 border-[#E56D85]/30 rounded-3xl shadow-2xl shadow-[#BF3853]/10">
        <div className="px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border-b-2 border-[#A41F39]/20 rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Patient Search & Statement of Account </h2>
        </div>
        
        <div className="p-6">
          <PatientSearch 
            birthcareId={birthcareId}
            onPatientSelect={handleViewSOA}
          />
        </div>
      </div>

      {/* Patient Payment Status List */}
      <div className="mt-8 bg-white/95 backdrop-blur-lg border-0 border-[#E56D85]/30 rounded-3xl shadow-2xl shadow-[#BF3853]/10">
        <div className="px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border-b-2 border-[#A41F39]/20 rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"> Patient Payment Status </h2>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
              <p className="mt-4 text-gray-700 font-semibold">Loading patient payment data...</p>
            </div>
          ) : (
            <>
              {/* API Debugging Panel - Remove this in production */}
              {apiErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-red-800 font-medium mb-2">API Debugging Information:</h3>
                  {apiErrors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      <strong>{error.endpoint}:</strong> {error.message} 
                      {error.status && `(Status: ${error.status})`}
                    </div>
                  ))}
                  <div className="mt-2 text-xs text-red-600">
                    Check browser console for detailed error information.
                  </div>
                </div>
              )}
              
              {patientsWithBilling.length > 0 ? (
                <>
                  {/* Summary Stats - Compact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white border-1 border-gray-100 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-gray-900">Fully Paid</p>
                          <p className="text-xl font-bold text-green-800">
                            {patientsWithBilling.filter(p => p.payment_status === 'paid').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border-1 border-gray-100 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#F891A5] to-[#E56D85] rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-gray-900">Pending Payment</p>
                          <p className="text-xl font-bold text-green-800">
                            {patientsWithBilling.filter(p => p.payment_status === 'pending').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border-1 border-gray-100 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-gray-900">Partial Payment</p>
                          <p className="text-xl font-bold text-green-800">
                            {patientsWithBilling.filter(p => p.payment_status === 'partial').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border-1 border-gray-100 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-gray-900">Total Patients</p>
                          <p className="text-xl font-bold text-green-800">{patientsWithBilling.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient List */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-2 divide-[#E56D85]/20">
                      <thead className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] border-b-2 border-[#A41F39]/20 rounded-t-3xl">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Patient</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Total Charges</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Payments</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#FDB3C2]/30">
                        {patientsWithBilling.map((patient) => (
                          <tr key={patient.id} className="hover:bg-gradient-to-r hover:from-[#FDB3C2]/10 hover:to-[#F891A5]/10 transition-all duration-200">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-bold text-gray=900">
                                  {patient.first_name} {patient.middle_name} {patient.last_name}
                                </div>
                                <div className="text-sm text-gray-900 font-medium">
                                  Admitted: {new Date(patient.admission_date).toLocaleDateString()}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-700">
                              {formatCurrency(patient.current_charges || patient.total_charges)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-700">
                              {formatCurrency(patient.current_payments || patient.total_payments)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold">
                              <span className="text-green-700">
                                {formatCurrency(patient.outstanding_balance)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-4 py-2 border-0 text-sm font-bold ${
                                patient.payment_status === 'paid'
                                  ? 'bg-white text-gray-900'
                                  : patient.payment_status === 'pending'
                                  ? 'bg-white text-gray-900'
                                  : patient.payment_status === 'partial'
                                  ? 'bg-white text-gray-900'
                                  : 'bg-white text-gray-900'
                              }`}>
                                {patient.payment_status === 'paid' 
                                  ? 'Fully Paid' 
                                  : patient.payment_status === 'pending'
                                  ? 'Pending Payment'
                                  : patient.payment_status === 'partial'
                                  ? 'Partially Paid'
                                  : 'Unknown Status'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold">
                              <button
                                onClick={() => handleViewSOA({
                                  id: patient.id,
                                  first_name: patient.first_name,
                                  last_name: patient.last_name,
                                  middle_name: patient.middle_name
                                })}
                                className="inline-flex items-center px-4 py-2 bg-[#A41F39] hover:bg-[#A41F39] text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                              >
                                View Statement
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No Patient Data</h3>
                  <p className="text-xs text-gray-500">No patients with billing information found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Statement of Account Modal */}
      {showSOA && selectedPatient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={handleCloseSOA}>
          <div className="flex min-h-screen items-center justify-center p-4">
              {/* SOA Content */}
              <div className="max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <StatementOfAccount 
                  patient={selectedPatient}
                  birthcareId={birthcareId}
                  onBack={handleCloseSOA}
                  isModal={true}
                />
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;
