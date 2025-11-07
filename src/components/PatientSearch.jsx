import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';
import axios from '@/lib/axios';

const PatientSearch = ({ birthcareId, onPatientSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchAdmittedPatients();
  }, [birthcareId]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = patients.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        patient.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredPatients([]);
      setShowDropdown(false);
    }
  }, [searchTerm, patients]);

  const fetchAdmittedPatients = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcareId}/payments/patients`);
      if (response.data.success) {
        setPatients(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm(`${patient.first_name} ${patient.last_name}`);
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleViewStatement = async () => {
    if (selectedPatient && onPatientSelect) {
      // Call scheduler to ensure room accommodation charges are calculated
      try {
        await axios.post(`/api/birthcare/${birthcareId}/payments/trigger-room-charges`, {
          patient_id: selectedPatient.id
        });
        
        console.log('Room accommodation charges have been updated for patient:', selectedPatient.id);
      } catch (error) {
        console.warn('Failed to trigger room charge scheduler, proceeding with existing data:', error.message);
        // Don't block the SOA display if scheduler fails - just warn
      }
      
      // Proceed to show the statement
      onPatientSelect(selectedPatient);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Admitted Patients
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name..."
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {selectedPatient && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={handleClearSelection}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Search Dropdown */}
        {showDropdown && !selectedPatient && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Room: {patient.room_number} | Status: {patient.status}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {patient.admission_date}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                <p className="text-sm">No patients found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Patient Display - Redesigned Compact Panel */}
      {selectedPatient && (
        <div className="bg-white border-2 border-[#FDB3C2]/40 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#E56D85] to-[#BF3853] rounded-full flex items-center justify-center shadow-md">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-[#A41F39] leading-tight">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h3>
                  <div className="flex items-center text-xs text-[#BF3853] font-medium mt-0.5">
                    <span>Room: {selectedPatient.room_number || 'N/A'}</span>
                    <span className="mx-2">•</span>
                    <span>Status: {selectedPatient.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-[#BF3853]">
                  {selectedPatient.admission_date ? new Date(selectedPatient.admission_date).toLocaleDateString() : '2025-10-23'}
                </span>
                <button
                  onClick={handleViewStatement}
                  className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-[#E56D85] to-[#A41F39] border border-transparent rounded-lg text-xs font-bold text-white hover:shadow-lg hover:shadow-[#BF3853]/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E56D85] transition-all duration-200">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  View Statement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Patients Message */}
      {!loading && patients.length === 0 && (
        <div className="text-center py-8">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No admitted patients</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are currently no admitted patients in the system.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading patients...</p>
        </div>
      )}

      {/* Helper Text */}
      {!selectedPatient && !loading && patients.length > 0 && (
        <p className="text-xs text-gray-400">
          {patients.length > 0 && `No patients found matching "${searchTerm}"`}
        </p>
      )}
    </div>
  );
};

export default PatientSearch;