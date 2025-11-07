import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, UserIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const SearchablePatientSelect = ({ 
  patients = [], 
  value, 
  onChange, 
  placeholder = "Select a patient...", 
  className = "",
  required = false,
  disabled = false,
  onOpen,
  focusRingColor = "focus:ring-[#BF3853]",
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Helpers to safely access varying API field names
  const getId = (p) => {
    const raw = p?.id ?? p?.patient_id ?? p?.patientId ?? p?.user_id;
    return raw != null ? String(raw) : '';
  };
  const getFirstName = (p) => p?.first_name || p?.firstname || p?.firstName || p?.name?.first || '';
  const getMiddleName = (p) => p?.middle_name || p?.middlename || p?.middleName || p?.name?.middle || '';
  const getLastName = (p) => p?.last_name || p?.lastname || p?.lastName || p?.name?.last || '';
  const getCivilStatus = (p) => p?.civil_status || p?.civilStatus || p?.marital_status || '';
  const getAge = (p) => p?.age ?? p?.patient_age ?? '';
  const getContact = (p) => p?.contact_number || p?.phone || p?.phone_number || p?.contact || '';

  const buildFullName = (p) => `${getFirstName(p)} ${getMiddleName(p)} ${getLastName(p)}`.trim();

  // Find selected patient
  const selectedPatient = patients.find(patient => getId(patient) === (value != null ? String(value) : ''));

  // Filter patients based on search term
  useEffect(() => {
    
    if (searchTerm.trim()) {
      const filtered = patients.filter(patient => {
        const fullName = buildFullName(patient).toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        const matches = fullName.includes(searchLower) ||
               getFirstName(patient).toLowerCase().includes(searchLower) ||
               getLastName(patient).toLowerCase().includes(searchLower) ||
               getMiddleName(patient).toLowerCase().includes(searchLower) ||
               String(getAge(patient)).includes(searchTerm);
        
        return matches;
      });
      
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    onChange(getId(patient));
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear selection
  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    if (typeof onOpen === 'function') {
      onOpen();
    }
    if (selectedPatient) {
      setSearchTerm('');
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPatients.length === 1) {
        handlePatientSelect(filteredPatients[0]);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (selectedPatient ? buildFullName(selectedPatient) : '')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-2 pr-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent ${focusRingColor} ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
          }`}
          autoComplete="off"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {selectedPatient && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 mr-1 text-gray-400 hover:text-gray-600 rounded"
              title="Clear selection"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              const next = !isOpen;
              setIsOpen(next);
              if (next && typeof onOpen === 'function') onOpen();
            }}
            className={`p-2 text-gray-400 ${!disabled ? 'hover:text-gray-600' : 'cursor-not-allowed'}`}
            disabled={disabled}
          >
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search header when dropdown is open */}
          {searchTerm && (
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center text-sm text-gray-600">
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Searching for: "{searchTerm}"
              </div>
            </div>
          )}

          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <button
                key={getId(patient) || Math.random()}
                type="button"
                onClick={() => handlePatientSelect(patient)}
                className={`w-full px-3 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0 ${
                  selectedPatient?.id === patient.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedPatient?.id === patient.id ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <UserIcon className={`w-4 h-4 ${
                      selectedPatient?.id === patient.id ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {buildFullName(patient)}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              <MagnifyingGlassIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {searchTerm 
                  ? `No patients found matching "${searchTerm}"`
                  : 'No patients available'
                }
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default SearchablePatientSelect;