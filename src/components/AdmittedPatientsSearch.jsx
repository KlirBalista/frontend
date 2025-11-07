import React, { useState, useEffect } from 'react';

const AdmittedPatientsSearch = ({ 
  patients = [], 
  onPatientSelect, 
  selectedPatient = null, 
  onClear,
  placeholder = "Search by name, phone, or ID...",
  disabled = false,
  showViewSOAButton = false,
  onViewSOA = null 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter patients based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPatients(patients);
      setShowDropdown(false);
      return;
    }
    const q = searchTerm.toLowerCase();
    const filtered = patients.filter(p => {
      // Handle both direct patient data and admission data with nested patient
      const patientData = p.patient || p;
      const firstName = patientData.firstname || patientData.first_name || p.firstname || '';
      const lastName = patientData.lastname || patientData.last_name || p.lastname || '';
      const middleName = patientData.middlename || patientData.middle_name || p.middlename || '';
      const fullName = `${firstName} ${middleName} ${lastName}`.toLowerCase();
      const roomNumber = p.room_number || p.room?.room_number || '';
      const contactNumber = patientData.contact_number || p.contact_number || p.phone || '';
      
      return fullName.includes(q) || 
             roomNumber.toString().toLowerCase().includes(q) ||
             contactNumber.includes(q) ||
             (p.id + '').includes(q);
    });
    
    setFilteredPatients(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchTerm, patients]);

  // Update search term when selected patient changes
  useEffect(() => {
    if (selectedPatient) {
      const patientData = selectedPatient.patient || selectedPatient;
      const firstName = patientData.firstname || patientData.first_name || '';
      const lastName = patientData.lastname || patientData.last_name || '';
      setSearchTerm(`${firstName} ${lastName}`);
      setShowDropdown(false);
    } else {
      setSearchTerm('');
    }
  }, [selectedPatient]);

  const handlePatientSelect = (patient) => {
    onPatientSelect(patient);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    setShowDropdown(false);
    if (onClear) onClear();
  };

  const getPatientDisplayInfo = (patient) => {
    const patientData = patient.patient || patient;
    const firstName = patientData.firstname || patientData.first_name || '';
    const lastName = patientData.lastname || patientData.last_name || '';
    const middleName = patientData.middlename || patientData.middle_name || '';
    const age = patientData.age || patient.age || '';
    const roomNumber = patient.room_number || patient.room?.room_number || 'N/A';
    const roomType = patient.room_type || patient.room?.room_type || 'N/A';
    const admissionDate = patient.admission_date || patient.admitted_at || '';
    const contactNumber = patientData.contact_number || patient.contact_number || patient.phone || 'No phone';
    
    return {
      fullName: `${firstName} ${middleName} ${lastName}`.trim(),
      age,
      roomNumber,
      roomType,
      admissionDate,
      contactNumber,
      id: patientData.id || patient.patient_id || patient.id
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Admitted Patients
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-4 py-3 pr-10 text-sm"
          />
          {selectedPatient && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {showDropdown && searchTerm && filteredPatients.length > 0 && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-10">
              {filteredPatients.slice(0, 8).map(patient => {
                const info = getPatientDisplayInfo(patient);
                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handlePatientSelect(patient)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{info.fullName}</div>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          (patient.status === 'Admitted' || patient.status === 'admitted')
                            ? 'bg-green-100 text-green-700'
                            : (patient.status === 'In-labor' || patient.status === 'in-labor')
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {patient.status === 'In-labor' ? 'In-labor' : patient.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Patient Display - Rose Theme */}
      {selectedPatient && (
        <div className="bg-gradient-to-br from-[#FDB3C2]/20 to-[#F891A5]/20 border-2 border-[#E56D85]/40 rounded-xl px-4 py-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-[#E56D85] to-[#BF3853] rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {(() => {
                  const info = getPatientDisplayInfo(selectedPatient);
                  return (
                    <h3 className="text-sm font-bold text-[#A41F39] truncate">
                      {info.fullName}
                    </h3>
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                (selectedPatient.status === 'Admitted' || selectedPatient.status === 'admitted')
                  ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300'
                  : (selectedPatient.status === 'In-labor' || selectedPatient.status === 'in-labor')
                  ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300'
                  : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300'
              }`}>
                {selectedPatient.status === 'In-labor' ? 'In-labor' : selectedPatient.status || 'Active'}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-[#BF3853] hover:text-white hover:bg-[#BF3853] p-1 rounded-lg transition-all duration-200"
                title="Clear selection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Rose Theme */}
      {showViewSOAButton && onViewSOA && (
        <div className="flex justify-center">
          <button
            onClick={onViewSOA}
            disabled={!selectedPatient}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
              selectedPatient 
                ? 'bg-gradient-to-r from-[#E56D85] to-[#A41F39] text-white hover:shadow-xl hover:shadow-[#BF3853]/30 hover:scale-105' 
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {selectedPatient && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
            {selectedPatient ? 'View Statement of Account' : 'Select Patient to View SOA'}
          </button>
        </div>
      )}

      {/* No Search Results */}
      {searchTerm.length > 0 && filteredPatients.length === 0 && (
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">
            No patients found matching "{searchTerm}"
          </div>
        </div>
      )}

      {/* Search Instructions */}
      {!selectedPatient && searchTerm.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">Search for a Patient</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">Start typing a patient's name, room number, or contact information to find them</p>
        </div>
      )}
    </div>
  );
};

export default AdmittedPatientsSearch;
