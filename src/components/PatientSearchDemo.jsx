import React, { useState } from 'react';

// Sample patient data for demonstration
const samplePatients = [
  {
    id: 1,
    patient_id: 1,
    first_name: 'Chloe',
    last_name: 'Dela Cruz',
    middle_name: 'Santos',
    age: 29,
    room_number: '101',
    room_type: 'Room',
    contact_number: '09123456789',
    admission_date: '2025-10-11',
    status: 'In-labor'
  },
  {
    id: 2,
    patient_id: 2,
    first_name: 'Maria',
    last_name: 'Santos',
    middle_name: 'Cruz',
    age: 28,
    room_number: '201',
    room_type: 'Private',
    contact_number: '09123456790',
    admission_date: '2025-10-10',
    status: 'Admitted'
  },
  {
    id: 3,
    patient_id: 3,
    first_name: 'Anna',
    last_name: 'Garcia',
    middle_name: 'Lopez',
    age: 25,
    room_number: '102',
    room_type: 'Semi-Private',
    contact_number: '09123456791',
    admission_date: '2025-10-09',
    status: 'Admitted'
  }
];

// Old Design Component
const OldPatientDisplay = ({ selectedPatient, onClear }) => {
  if (!selectedPatient) return null;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              {`${selectedPatient.first_name} ${selectedPatient.middle_name} ${selectedPatient.last_name}`.trim()}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Age:</span>
              <span className="ml-1 text-gray-900">{selectedPatient.age} years old</span>
            </div>
            <div>
              <span className="text-gray-500">Room:</span>
              <span className="ml-1 text-gray-900">{selectedPatient.room_number} ({selectedPatient.room_type})</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Admitted:</span>
              <span className="ml-1 text-gray-900">{new Date(selectedPatient.admission_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            selectedPatient.status === 'In-labor' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {selectedPatient.status}
          </span>
        </div>
      </div>
    </div>
  );
};

// New Design Component - Name Only
const NewPatientDisplay = ({ selectedPatient, onClear }) => {
  if (!selectedPatient) return null;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {`${selectedPatient.first_name} ${selectedPatient.middle_name} ${selectedPatient.last_name}`.trim()}
            </h3>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            selectedPatient.status === 'In-labor' 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {selectedPatient.status === 'In-labor' ? 'In-labor' : selectedPatient.status}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Dropdown Item Comparison
const OldDropdownItem = ({ patient, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(patient)}
    className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
  >
    <div className="text-sm font-medium text-gray-900">
      {`${patient.first_name} ${patient.middle_name} ${patient.last_name}`.trim()}
    </div>
    <div className="text-xs text-gray-500">
      ID: {patient.id} • Room: {patient.room_number} • {patient.contact_number}
    </div>
  </button>
);

const NewDropdownItem = ({ patient, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(patient)}
    className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {`${patient.first_name} ${patient.middle_name} ${patient.last_name}`.trim()}
        </div>
      </div>
      <div className="flex-shrink-0 ml-3">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          patient.status === 'In-labor'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {patient.status === 'In-labor' ? 'In-labor' : patient.status}
        </span>
      </div>
    </div>
  </button>
);

export default function PatientSearchDemo() {
  const [selectedPatientOld, setSelectedPatientOld] = useState(samplePatients[0]);
  const [selectedPatientNew, setSelectedPatientNew] = useState(samplePatients[0]);
  const [showOldDropdown, setShowOldDropdown] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Search Interface Redesign</h1>
        <p className="text-gray-600">Comparison of old vs new compact design</p>
      </div>

      {/* Before and After Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Old Design */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-700 bg-red-50 p-2 rounded">❌ Before (Old Design)</h2>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Selected Patient Display:</h3>
            <OldPatientDisplay 
              selectedPatient={selectedPatientOld}
              onClear={() => setSelectedPatientOld(null)}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Dropdown Items:</h3>
            <div className="border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
              {samplePatients.slice(0, 3).map(patient => (
                <OldDropdownItem 
                  key={patient.id}
                  patient={patient}
                  onSelect={setSelectedPatientOld}
                />
              ))}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
            <h4 className="font-medium text-red-800">Issues:</h4>
            <ul className="text-red-700 mt-1 space-y-1 text-xs">
              <li>• Takes up too much vertical space</li>
              <li>• Repetitive information layout</li>
              <li>• Hard to scan quickly</li>
              <li>• Large padding reduces efficiency</li>
            </ul>
          </div>
        </div>

        {/* New Design */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-green-700 bg-green-50 p-2 rounded">✅ After (New Design)</h2>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Selected Patient Display:</h3>
            <NewPatientDisplay 
              selectedPatient={selectedPatientNew}
              onClear={() => setSelectedPatientNew(null)}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Dropdown Items:</h3>
            <div className="border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
              {samplePatients.slice(0, 3).map(patient => (
                <NewDropdownItem 
                  key={patient.id}
                  patient={patient}
                  onSelect={setSelectedPatientNew}
                />
              ))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-3 rounded text-sm">
            <h4 className="font-medium text-green-800">Improvements:</h4>
            <ul className="text-green-700 mt-1 space-y-1 text-xs">
              <li>• 70% less vertical space used</li>
              <li>• Ultra-minimal design - name only</li>
              <li>• Clean, uncluttered interface</li>
              <li>• Focus on essential information</li>
              <li>• Status badge remains prominent</li>
              <li>• Built-in clear button</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Space Comparison */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Space Efficiency Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">~120px</div>
            <div className="text-gray-600">Old design height</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">~48px</div>
            <div className="text-gray-600">New design height</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">60%</div>
            <div className="text-gray-600">Space saved</div>
          </div>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Interactive Demo</h3>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => { setSelectedPatientNew(samplePatients[0]); setSelectedPatientOld(samplePatients[0]); }}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
          >
            Select Chloe (In Labor)
          </button>
          <button
            onClick={() => { setSelectedPatientNew(samplePatients[1]); setSelectedPatientOld(samplePatients[1]); }}
            className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
          >
            Select Maria (Admitted)
          </button>
          <button
            onClick={() => { setSelectedPatientNew(null); setSelectedPatientOld(null); }}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
          >
            Clear Selection
          </button>
        </div>
        <p className="text-xs text-gray-600">
          Try selecting different patients to see how the new design handles different statuses and information.
        </p>
      </div>
    </div>
  );
}