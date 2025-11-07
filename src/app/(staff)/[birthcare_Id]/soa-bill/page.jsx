"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export default function SOABillPage() {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  
  // State management
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientBills, setPatientBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [generatingBill, setGeneratingBill] = useState(false);
  
  // SOA Configuration
  const [soaConfig, setSoaConfig] = useState({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    includeUnpaid: true,
    includePaid: false,
    includePartiallyPaid: true
  });
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch patients from database
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching patients from database...');
      console.log('Birthcare ID:', birthcare_Id);
      console.log('API URL:', `${API_BASE_URL}/birthcare/${birthcare_Id}/patients`);
      
      const response = await fetch(`${API_BASE_URL}/birthcare/${birthcare_Id}/patients`, {
        headers: getAuthHeaders(),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `Failed to fetch patients (${response.status})`);
      }

      const data = await response.json();
      console.log('Full API Response:', data);
      
      // Handle both paginated and direct data formats
      const patientData = data.data || data || [];
      
      console.log(`Successfully fetched ${patientData.length} patients from database:`, patientData);
      
      // Map patient data to ensure consistent field names
      const mappedPatients = patientData.map(patient => ({
        ...patient,
        phone: patient.contact_number || patient.phone,
        email: patient.email || null,
        address: patient.address || null
      }));
      
      setPatients(mappedPatients);
      
      if (mappedPatients.length === 0) {
        setError('No patients found in the database. Please add patients first by going to Patient List → Patient Registration.');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(`Unable to load patients from database: ${err.message}. Please check if patients have been added to the system.`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient bills
  const fetchPatientBills = async (patientId) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        patient_id: patientId,
        date_from: soaConfig.dateFrom,
        date_to: soaConfig.dateTo,
      });

      const response = await fetch(`${API_BASE_URL}/birthcare/${birthcare_Id}/payments?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch patient bills');

      const data = await response.json();
      let bills = data.data.data || [];
      
      // Filter bills based on status configuration
      bills = bills.filter(bill => {
        if (soaConfig.includeUnpaid && ['sent', 'overdue'].includes(bill.status)) return true;
        if (soaConfig.includePaid && bill.status === 'paid') return true;
        if (soaConfig.includePartiallyPaid && bill.status === 'partial') return true;
        return false;
      });
      
      setPatientBills(bills);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter patients based on search with enhanced search criteria
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPatients(patients);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = patients.filter(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const phone = patient.phone || '';
        const email = patient.email || '';
        const address = patient.address || '';
        
        return (
          fullName.includes(searchLower) ||
          phone.includes(searchTerm) ||
          email.toLowerCase().includes(searchLower) ||
          address.toLowerCase().includes(searchLower) ||
          patient.first_name.toLowerCase().includes(searchLower) ||
          patient.last_name.toLowerCase().includes(searchLower)
        );
      });
      setFilteredPatients(filtered);
    }
  }, [patients, searchTerm]);

  useEffect(() => {
    if (birthcare_Id) {
      fetchPatients();
    }
  }, [birthcare_Id]);

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
      !user.permissions?.includes("manage_soa_bill"))
  ) {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientBills(selectedPatient.id);
    }
  }, [selectedPatient, soaConfig]);

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setPatientBills([]);
    setSoaData(null);
    if (patient && patient.id) {
      fetchSOAData(patient.id);
    }
  };

  // Add sample patients for testing
  const addSamplePatients = async () => {
    const samplePatients = [
      {
        facility_name: "Sample Birth Care Center",
        first_name: "Maria",
        middle_name: "Santos",
        last_name: "Cruz",
        date_of_birth: "1995-03-15",
        age: 28,
        civil_status: "Married",
        address: "123 Barangay Street, Manila, Philippines",
        contact_number: "09123456789",
        philhealth_number: "123456789012",
        status: "Active"
      },
      {
        facility_name: "Sample Birth Care Center", 
        first_name: "Ana",
        middle_name: "Garcia",
        last_name: "Reyes",
        date_of_birth: "1992-08-22",
        age: 31,
        civil_status: "Single",
        address: "456 Poblacion Ave, Quezon City, Philippines",
        contact_number: "09987654321",
        philhealth_number: "987654321098",
        status: "Active"
      },
      {
        facility_name: "Sample Birth Care Center",
        first_name: "Carmen",
        middle_name: "Flores",
        last_name: "Lopez",
        date_of_birth: "1990-12-10",
        age: 33,
        civil_status: "Married",
        address: "789 Main Street, Makati, Philippines",
        contact_number: "09111222333",
        philhealth_number: "111222333444",
        status: "Active"
      }
    ];

    setLoading(true);
    try {
      for (const patient of samplePatients) {
        const response = await fetch(`${API_BASE_URL}/birthcare/${birthcare_Id}/patients`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(patient)
        });
        
        if (!response.ok) {
          console.error('Failed to create patient:', await response.text());
        }
      }
      
      setSuccess('Sample patients added successfully!');
      await fetchPatients(); // Refresh the patient list
    } catch (err) {
      console.error('Error adding sample patients:', err);
      setError('Failed to add sample patients: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // SOA data state
  const [soaData, setSoaData] = useState(null);
  const [loadingSOA, setLoadingSOA] = useState(false);

  // Fetch real SOA data
  const fetchSOAData = async (patientId) => {
    try {
      setLoadingSOA(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        patient_id: patientId,
        admission_id: selectedPatient.admission_id || ''
      });
      
      const response = await fetch(`${API_BASE_URL}/birthcare/${birthcare_Id}/payments/soa?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch SOA data');

      const data = await response.json();
      
      if (data.success) {
        setSoaData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch SOA data');
      }
    } catch (err) {
      setError('Failed to fetch SOA data: ' + err.message);
      setSoaData(null);
    } finally {
      setLoadingSOA(false);
    }
  };

  // Generate SOA PDF
  const handleGeneratePDF = async () => {
    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }

    setGeneratingBill(true);
    setError(null);
    
    try {
      // Generate PDF using the backend endpoint
      const queryParams = new URLSearchParams({
        patient_id: selectedPatient.id,
        admission_id: selectedPatient.admission_id || ''
      });
      
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/birthcare/${birthcare_Id}/payments/soa/pdf?${queryParams}&token=${token}`;
      
      // Try to fetch the PDF first to check if it generates successfully
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.status} ${response.statusText}`);
      }
      
      // If successful, download the PDF
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `SOA_${selectedPatient.first_name}_${selectedPatient.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setSuccess(`SOA PDF downloaded successfully for ${selectedPatient.first_name} ${selectedPatient.last_name}`);
      
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate SOA PDF. ' + err.message + ' Please try using the Print SOA button instead.');
    } finally {
      setGeneratingBill(false);
    }
  };

  // Generate SOA/Bill (legacy function - keeping for compatibility)
  const handleGenerateBill = async () => {
    if (!selectedPatient || patientBills.length === 0) {
      setError('Please select a patient with outstanding bills');
      return;
    }

    setGeneratingBill(true);
    try {
      // Here you would typically call an API endpoint to generate the SOA/Bill
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setSuccess(`SOA/Bill generated successfully for ${selectedPatient.first_name} ${selectedPatient.last_name}`);
      
    } catch (err) {
      setError('Failed to generate SOA/Bill');
    } finally {
      setGeneratingBill(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const total = patientBills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0);
    const paid = patientBills.reduce((sum, bill) => sum + parseFloat(bill.paid_amount || 0), 0);
    const balance = patientBills.reduce((sum, bill) => sum + parseFloat(bill.balance_amount || 0), 0);
    
    return { total, paid, balance };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totals = calculateTotals();

  return (
    <>
      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          body { 
            font-size: 12px;
            line-height: 1.2;
            margin: 0;
            padding: 0;
          }
          .print-hide {
            display: none !important;
          }
          .print-show {
            display: block !important;
          }
          .max-w-7xl {
            max-width: none;
            margin: 0;
            padding: 0;
          }
          .grid {
            display: block !important;
          }
          .lg\\:col-span-1, .lg\\:col-span-2 {
            grid-column: auto !important;
          }
          .shadow-sm, .border, .rounded-lg {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          #soa-content {
            padding: 10px !important;
            font-size: 11px;
          }
          .fees-table {
            font-size: 9px !important;
          }
          .fees-table th, .fees-table td {
            padding: 2px !important;
            border: 1px solid #000 !important;
          }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 print-hide">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#E56D85] to-[#A41F39] bg-clip-text text-transparent">Statement of Account (SOA) / Bill Generator</h1>
        <p className="text-[#BF3853] mt-2 font-medium">Generate comprehensive billing statements for patients from database</p>
        {patients.length > 0 && (
          <div className="mt-3 inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-[#FDB3C2]/30 to-[#F891A5]/30 text-[#A41F39] border border-[#F891A5] font-semibold">
            📊 {patients.length} patient{patients.length !== 1 ? 's' : ''} loaded from database
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-6 bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 border-2 border-[#E56D85]/50 text-[#A41F39] rounded-2xl print-hide shadow-lg shadow-[#E56D85]/10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-[#BF3853]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-6 bg-gradient-to-r from-[#BF3853]/10 to-[#A41F39]/10 border-2 border-[#BF3853]/50 text-[#A41F39] rounded-2xl print-hide shadow-lg shadow-[#BF3853]/10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-[#BF3853]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Patient Selection & Configuration */}
        <div className="lg:col-span-1 space-y-6 print-hide">
          {/* Patient Search & Selection */}
          <div className="bg-white/95 backdrop-blur-lg border-2 border-[#E56D85]/30 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#A41F39] flex items-center gap-2">
                <svg className="w-5 h-5 text-[#BF3853]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Select Patient
              </h2>
              <button
                onClick={fetchPatients}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border-2 border-[#E56D85] rounded-xl text-xs font-bold text-[#BF3853] bg-white hover:bg-gradient-to-r hover:from-[#FDB3C2]/20 hover:to-[#F891A5]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {/* Search */}
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-bold text-[#A41F39] mb-2">
                Search Patients
              </label>
              <input
                type="text"
                id="search"
                className="w-full px-4 py-3 border-2 border-[#FDB3C2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853]/20 focus:border-[#BF3853] transition-all duration-300 placeholder:text-[#BF3853]/50"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Patient List */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Fetching patients from database...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-900 mt-2">No patients found in database</p>
                  <p className="text-xs text-gray-500 mb-4">Add patients to the database to generate SOA</p>
                  
                  {patients.length === 0 && (
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={addSamplePatients}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            📄 Add Sample Patients
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-400">Or go to Patient List → Patient Registration</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-2 px-2">
                    <p className="text-xs text-gray-500">{filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found in database</p>
                  </div>
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                        selectedPatient?.id === patient.id
                          ? 'bg-gradient-to-br from-[#FDB3C2]/30 to-[#F891A5]/30 border-[#E56D85] shadow-lg shadow-[#E56D85]/20'
                          : 'bg-white border-[#FDB3C2] hover:bg-gradient-to-r hover:from-[#FDB3C2]/10 hover:to-[#F891A5]/10 hover:border-[#E56D85]'
                      }`}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#F891A5] to-[#E56D85] flex items-center justify-center shadow-md">
                                <span className="text-sm font-bold text-white">
                                  {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="font-bold text-sm text-[#A41F39]">
                                {patient.first_name} {patient.last_name}
                              </div>
                              <div className="text-xs text-[#BF3853] mt-1 font-medium">
                                ID: {patient.id} • {patient.phone || 'No phone'}
                              </div>
                              {patient.email && (
                                <div className="text-xs text-[#BF3853]/70">
                                  {patient.email}
                                </div>
                              )}
                              {patient.address && (
                                <div className="text-xs text-[#BF3853]/70 truncate mt-1">
                                  📍 {patient.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedPatient?.id === patient.id && (
                          <div className="flex-shrink-0 ml-2">
                            <svg className="h-5 w-5 text-[#BF3853]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* SOA Configuration */}
          <div className="bg-white/95 backdrop-blur-lg border-2 border-[#E56D85]/30 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-[#A41F39] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#BF3853]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              SOA Configuration
            </h2>
            
            {/* Date Range */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#A41F39] mb-2">Date From</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border-2 border-[#FDB3C2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853]/20 focus:border-[#BF3853] transition-all duration-300"
                  value={soaConfig.dateFrom}
                  onChange={(e) => setSoaConfig({...soaConfig, dateFrom: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[#A41F39] mb-2">Date To</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border-2 border-[#FDB3C2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853]/20 focus:border-[#BF3853] transition-all duration-300"
                  value={soaConfig.dateTo}
                  onChange={(e) => setSoaConfig({...soaConfig, dateTo: e.target.value})}
                />
              </div>
            </div>

            {/* Include Options */}
            <div className="mt-6 space-y-3">
              <p className="text-sm font-bold text-[#A41F39] mb-3">Include Bills:</p>
              
              <label className="flex items-center p-3 bg-gradient-to-r from-[#FDB3C2]/10 to-[#F891A5]/10 rounded-xl border border-[#F891A5]/30 hover:border-[#E56D85]/50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded-lg border-[#E56D85] text-[#BF3853] focus:ring-[#BF3853] w-5 h-5"
                  checked={soaConfig.includeUnpaid}
                  onChange={(e) => setSoaConfig({...soaConfig, includeUnpaid: e.target.checked})}
                />
                <span className="ml-3 text-sm font-semibold text-[#A41F39]">Unpaid Bills</span>
              </label>
              
              <label className="flex items-center p-3 bg-gradient-to-r from-[#FDB3C2]/10 to-[#F891A5]/10 rounded-xl border border-[#F891A5]/30 hover:border-[#E56D85]/50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded-lg border-[#E56D85] text-[#BF3853] focus:ring-[#BF3853] w-5 h-5"
                  checked={soaConfig.includePartiallyPaid}
                  onChange={(e) => setSoaConfig({...soaConfig, includePartiallyPaid: e.target.checked})}
                />
                <span className="ml-3 text-sm font-semibold text-[#A41F39]">Partially Paid Bills</span>
              </label>
              
              <label className="flex items-center p-3 bg-gradient-to-r from-[#FDB3C2]/10 to-[#F891A5]/10 rounded-xl border border-[#F891A5]/30 hover:border-[#E56D85]/50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded-lg border-[#E56D85] text-[#BF3853] focus:ring-[#BF3853] w-5 h-5"
                  checked={soaConfig.includePaid}
                  onChange={(e) => setSoaConfig({...soaConfig, includePaid: e.target.checked})}
                />
                <span className="ml-3 text-sm font-semibold text-[#A41F39]">Paid Bills</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Panel - SOA Preview & Generation */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* SOA Header */}
            <div className="p-6 border-b border-gray-200 print-hide">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Statement of Account</h2>
                  {selectedPatient ? (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-lg font-medium text-blue-600">
                              {selectedPatient.first_name.charAt(0)}{selectedPatient.last_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {selectedPatient.first_name} {selectedPatient.last_name}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ID: {selectedPatient.id}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{selectedPatient.phone || 'No phone number'}</span>
                            </div>
                            {selectedPatient.email && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="truncate">{selectedPatient.email}</span>
                              </div>
                            )}
                            {selectedPatient.address && (
                              <div className="flex items-start sm:col-span-2">
                                <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-xs">{selectedPatient.address}</span>
                              </div>
                            )}
                            <div className="flex items-center sm:col-span-2">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v6h6v-6M8 11V8a2 2 0 012-2h4a2 2 0 012 2v3" />
                              </svg>
                              <span>Statement Period: <strong>{formatDate(soaConfig.dateFrom)}</strong> to <strong>{formatDate(soaConfig.dateTo)}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-sm text-yellow-800">Please select a patient from the database to generate SOA</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Generate Bill Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.print()}
                    disabled={!selectedPatient || !soaData}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                      selectedPatient && soaData
                        ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print SOA
                  </button>
                  
                  <button
                    onClick={handleGeneratePDF}
                    disabled={!selectedPatient || generatingBill}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                      selectedPatient && !generatingBill
                        ? 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {generatingBill ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* SOA Content */}
            <div className="p-6 bg-white" id="soa-content">
              {!selectedPatient ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No patient selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select a patient from the list to view SOA</p>
                </div>
              ) : loadingSOA ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">Loading Statement of Account...</p>
                </div>
              ) : soaData ? (
                <div className="max-w-4xl mx-auto">
                  {/* SOA Header */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">🏥</span>
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-gray-600">Republic of the Philippines</div>
                        <div className="text-lg font-bold text-gray-900">CITY GOVERNMENT OF DAVAO</div>
                        <div className="text-sm font-bold text-blue-600">BUHANGIN MEDICAL CENTER</div>
                        <div className="text-xs text-gray-500">Ground Floor, Door 2, Gimenes Building, Kilometer 5, Buhangin, Davao City</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center ml-auto">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mt-4">STATEMENT OF ACCOUNT</h2>
                  </div>

                  {/* Patient Information */}
                  <div className="border border-gray-300 rounded-lg p-4 mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-3">Patient Information</div>
                    <div className="text-lg font-bold text-gray-900 mb-2">{soaData.patient?.full_name || 'N/A'}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>Patient ID: {soaData.patient?.id || 'N/A'}</div>
                      <div>Age: {soaData.patient?.age || 'N/A'} years old</div>
                      <div>Room: {soaData.admission?.room_number || 'N/A'} (Room)</div>
                    </div>
                  </div>

                  {/* Statement Information */}
                  <div className="border border-gray-300 rounded-lg p-4 mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-3">Statement Information</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>SOA Number: <span className="font-medium">{soaData.soa_number || 'N/A'}</span></div>
                      <div>Date Generated: <span className="font-medium">{soaData.soa_date || new Date().toLocaleDateString()}</span></div>
                      <div>
                        Status: 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          soaData.totals?.outstanding_balance > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {soaData.totals?.outstanding_balance > 0 ? 'Balance Remaining' : 'Paid'}
                        </span>
                      </div>
                      <div>Admission Date: <span className="font-medium">{soaData.admission?.admission_date || 'N/A'}</span></div>
                    </div>
                  </div>

                  {/* Itemized Charges */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <span className="text-blue-600 mr-2">📋</span>
                      <h3 className="text-lg font-bold text-gray-900">Itemized Charges</h3>
                    </div>
                    
                    {/* Data Integrity Warning */}
                    {soaData.itemized_charges && soaData.itemized_charges.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> This SOA shows charges exactly as they were entered in the Patient Charges system. 
                            If you see discrepancies, please check the Patient Charges page for the most current data.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">SERVICE/ITEM</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-700">QTY</th>
                            <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-700">UNIT PRICE</th>
                            <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-700">TOTAL</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-700">DATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {soaData.itemized_charges && soaData.itemized_charges.length > 0 ? (
                            soaData.itemized_charges
                              .sort((a, b) => {
                                const dateA = new Date(a.date || a.created_at || a.charge_date || 0);
                                const dateB = new Date(b.date || b.created_at || b.charge_date || 0);
                                return dateA - dateB; // Sort in chronological order (oldest first)
                              })
                              .map((charge, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 px-4 py-2">
                                  <div className="font-medium">{charge.service_name || 'Medical Service'}</div>
                                  {charge.description && (
                                    <div className="text-xs text-gray-500 italic">{charge.description}</div>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{charge.quantity || 1}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right font-medium">₱{(charge.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right font-bold">₱{(charge.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{charge.date ? new Date(charge.date).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                <div className="font-medium mb-2">No Charges Found</div>
                                <div className="text-sm">No charges have been added to this patient through the Patient Charges system.</div>
                                <div className="text-sm mt-1">Please add charges in the Patient Charges page to see them reflected here.</div>
                              </td>
                            </tr>
                          )}
                          
                          {/* Total Row */}
                          <tr className="bg-gray-100 font-bold">
                            <td colSpan="3" className="border border-gray-300 px-4 py-2 text-right">TOTAL AMOUNT:</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">₱{(soaData.totals?.current_charges || 8000).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="border border-gray-300 px-4 py-2"></td>
                          </tr>
                          
                          {soaData.totals?.current_payments > 0 && (
                            <>
                              <tr className="bg-gray-50">
                                <td colSpan="3" className="border border-gray-300 px-4 py-2 text-right">TOTAL PAID:</td>
                                <td className="border border-gray-300 px-4 py-2 text-right font-medium">₱{soaData.totals.current_payments.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                              </tr>
                              <tr className="bg-yellow-100 font-bold">
                                <td colSpan="3" className="border border-gray-300 px-4 py-2 text-right">BALANCE REMAINING:</td>
                                <td className="border border-gray-300 px-4 py-2 text-right text-red-600">₱{(soaData.totals?.outstanding_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment History */}
                  {soaData.payment_history && soaData.payment_history.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center mb-4">
                        <span className="text-green-600 mr-2">💰</span>
                        <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">PAYMENT DATE</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">METHOD</th>
                              <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-700">AMOUNT</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">REFERENCE</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">BILL #</th>
                            </tr>
                          </thead>
                          <tbody>
                            {soaData.payment_history.map((payment, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 px-4 py-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                <td className="border border-gray-300 px-4 py-2">{payment.payment_method_label || payment.payment_method?.toUpperCase()}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right font-medium">₱{payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="border border-gray-300 px-4 py-2">{payment.reference_number || 'N/A'}</td>
                                <td className="border border-gray-300 px-4 py-2">{payment.bill_number || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <span className="text-purple-600 mr-2">📊</span>
                      <h3 className="text-lg font-bold text-gray-900">Summary</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">₱{(soaData.totals?.current_charges || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <div className="text-sm text-gray-500">Total Charges</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">₱{(soaData.totals?.current_payments || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <div className="text-sm text-gray-500">Total Payments</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          soaData.totals?.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ₱{(soaData.totals?.outstanding_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-500">Outstanding Balance</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No SOA data available</h3>
                  <p className="mt-1 text-sm text-gray-500">Unable to load statement of account for this patient</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}