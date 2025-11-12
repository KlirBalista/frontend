'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import styles from './map.module.css';

// Custom styles for facility pins
const pinStyles = `
  .custom-facility-pin {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }
  
  .leaflet-div-icon .custom-facility-pin {
    background: transparent;
    border: none;
  }
  
  @keyframes facilityPulse {
    0% { transform: translateX(-50%) scale(1); opacity: 0.6; }
    50% { transform: translateX(-50%) scale(1.3); opacity: 0.3; }
    100% { transform: translateX(-50%) scale(1.6); opacity: 0; }
  }
`;

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

// Dynamic Leaflet import
const L = dynamic(() => import('leaflet'), { ssr: false });

// Create custom cool pin icon for facilities
const createFacilityPinIcon = (facility) => {
  const isPublic = facility.is_public;
  const pinColor = isPublic ? '#10b981' : '#ec4899'; // Green for public, pink for private
  const shadowColor = isPublic ? 'rgba(16, 185, 129, 0.3)' : 'rgba(236, 72, 153, 0.3)';
  
  // Use dynamic import for Leaflet
  if (typeof window !== 'undefined') {
    const LeafletLib = require('leaflet');
    return LeafletLib.divIcon({
      className: 'custom-facility-pin',
      html: `
        <div style="position: relative; width: 35px; height: 45px; display: flex; align-items: center; justify-content: center;">
          <!-- Pin shadow -->
          <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 12px; height: 4px; background: ${shadowColor}; border-radius: 50%; blur: 2px;"></div>
          <!-- Pin body -->
          <svg width="35" height="45" viewBox="0 0 35 45" style="drop-shadow: 0 4px 8px rgba(0,0,0,0.15);">
            <defs>
              <linearGradient id="pinGradient-${facility.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="${pinColor}"/>
                <stop offset="100%" stop-color="${pinColor}dd"/>
              </linearGradient>
              <filter id="glow-${facility.id}">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
            </defs>
            <!-- Pin shape -->
            <path d="M17.5 3C11.7 3 7 7.7 7 13.5c0 8.8 10.5 25.5 10.5 25.5s10.5-16.7 10.5-25.5C28 7.7 23.3 3 17.5 3z" 
                  fill="url(#pinGradient-${facility.id})" 
                  stroke="white" 
                  stroke-width="2"
                  filter="url(#glow-${facility.id})"/>
            <!-- Medical cross icon -->
            <g transform="translate(17.5, 13.5)">
              <rect x="-1.5" y="-6" width="3" height="12" fill="white" rx="1.5"/>
              <rect x="-6" y="-1.5" width="12" height="3" fill="white" rx="1.5"/>
            </g>
          </svg>
          <!-- Pulse animation ring -->
          <div style="
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 20px;
            border: 2px solid ${pinColor};
            border-radius: 50%;
            animation: facilityPulse 2s infinite;
            opacity: 0.6;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); opacity: 0.6; }
            50% { transform: translateX(-50%) scale(1.3); opacity: 0.3; }
            100% { transform: translateX(-50%) scale(1.6); opacity: 0; }
          }
        </style>
      `,
      iconSize: [35, 45],
      iconAnchor: [17, 42],
      popupAnchor: [0, -42]
    });
  }
  return null;
};

const MapPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const params = useParams();
  const birthcare_id = params.birthcare_Id;
  
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [error, setError] = useState(null);
  const [showPatientSearchModal, setShowPatientSearchModal] = useState(false);
  const [patientSearchName, setPatientSearchName] = useState('');
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientSearchResults, setPatientSearchResults] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showPatientNotFoundDialog, setShowPatientNotFoundDialog] = useState(false);
  const [patientNotFoundMessage, setPatientNotFoundMessage] = useState('');
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  
  // Davao City center coordinates for initial map view
  const davaoCityCoords = {
    lat: 7.0731,
    lng: 125.6128,
    zoom: 12
  };


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
      !user.permissions?.includes("manage_map"))
  ) {
    return <div>Unauthorized</div>;
  }

  // Fetch all registered facilities from the system (real data only)
  const fetchRegisteredFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API call to fetch real facilities from birthcares table
      const response = await axios.get('/api/birthcares');
      
      if (response.data) {
        let facilitiesData = [];
        
        // Handle different response structures
        const data = response.data.success ? response.data.data : response.data;
        
        if (Array.isArray(data)) {
          facilitiesData = data
            .filter(facility => facility.latitude && facility.longitude && facility.name) // Only include facilities with valid coordinates and name
            .map(facility => ({
              id: facility.id,
              name: facility.name,
              lat: parseFloat(facility.latitude),
              lng: parseFloat(facility.longitude),
              address: facility.address || 'No address provided',
              phone: facility.phone || facility.contact_number || 'No phone provided',
              email: facility.email || facility.email_address || 'No email provided',
              status: facility.status || 'approved',
              description: facility.description || 'No description provided',
              owner: facility.user?.name || facility.owner?.name || facility.owner_name || 'Unknown',
              created_at: facility.created_at || new Date().toISOString(),
              total_staff: facility.staff?.length || facility.total_staff || facility.staff_count || 0,
              is_public: facility.is_public !== undefined ? facility.is_public : (facility.visibility !== 'private')
            }));
        }
        
        setFacilities(facilitiesData);
        
        if (facilitiesData.length === 0) {
          setError('No registered facilities found in the system.');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching registered facilities:', error);
      setError(
        error.response?.status === 404 
          ? 'API endpoint not found. Please ensure /api/birthcares endpoint is available.'
          : error.response?.status === 401
          ? 'Authentication required to access facilities data.'
          : `Failed to load registered facilities: ${error.message}`
      );
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  // Search for patients across all registered facilities (real data only)
  const searchPatients = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Ensure we're in a valid state
    if (!isClient) {
      console.warn('Client not ready for search');
      return;
    }
    
    try {
      // API call to search real patient data
      const response = await axios.get(`/api/patients/search?q=${encodeURIComponent(query)}`);
      
      if (response.data.success) {
        const results = response.data.data.map(patient => ({
          id: patient.id,
          name: `${patient.firstname} ${patient.lastname}`,
          age: patient.age || 'N/A',
          lastVisit: patient.last_visit || 'N/A',
          facility: patient.facility?.name || 'Unknown Facility',
          phone: patient.phone || 'N/A'
        }));
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    }
  };

  // Fetch consultation history for selected patient (real data only)
  const fetchConsultationHistory = async (patientId) => {
    setLoadingHistory(true);
    try {
      // API call to fetch real patient consultation history
      const response = await axios.get(`/api/patients/${patientId}/consultations`);
      
      if (response.data.success) {
        const history = response.data.data.map(consultation => ({
          id: consultation.id,
          date: consultation.consultation_date,
          facility: consultation.facility?.name || 'Unknown Facility',
          doctor: consultation.doctor || 'Unknown Doctor',
          diagnosis: consultation.diagnosis || 'No diagnosis recorded',
          notes: consultation.notes || 'No notes available',
          nextVisit: consultation.next_visit,
          weight: consultation.weight ? `${consultation.weight}kg` : 'Not recorded',
          bloodPressure: consultation.blood_pressure || 'Not recorded'
        }));
        
        setConsultationHistory(history);
      } else {
        setConsultationHistory([]);
      }
    } catch (error) {
      console.error('Error fetching consultation history:', error);
      setConsultationHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
    fetchConsultationHistory(patient.id);
    setPatientSearch('');
    setSearchResults([]);
  };

  useEffect(() => {
    setIsClient(true);
    // Fetch registered facilities when component mounts
    fetchRegisteredFacilities();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchPatients(patientSearch);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [patientSearch]);
  
  // Handle escape key for modals
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showPatientNotFoundDialog) {
          setShowPatientNotFoundDialog(false);
          setPatientNotFoundMessage('');
        }
        if (showPatientSearchModal) {
          setShowPatientSearchModal(false);
          setPatientSearchName('');
          setSelectedFacility(null);
        }
        if (showPatientModal) {
          setShowPatientModal(false);
          setSelectedPatient(null);
          setConsultationHistory([]);
        }
      }
    };

    if (showPatientSearchModal || showPatientModal || showPatientNotFoundDialog) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showPatientSearchModal, showPatientModal, showPatientNotFoundDialog]);

  // Debug logging
  console.log('Render state:', {
    loading,
    isClient,
    showPatientSearchModal,
    selectedFacility: selectedFacility?.name,
    patientSearchName
  });

  if (loading || !isClient) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading registered facilities...</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: pinStyles }} />
        <div className={`${styles.pageContainer} bg-gray-50`}>
          <div className={styles.contentWrapper}>
            {/* Header */}
            <div className={styles.headerSection}>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    Registered Facilities Map
                  </h1>
                  <p className="text-gray-600">
                    View all registered birthing facilities and search patient consultation history for referrals
                  </p>
                  {error && (
                    <div className="mt-2 flex items-center text-red-600">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className={`${styles.controlsSection} flex items-center gap-2 justify-end`}>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Active Facilities ({facilities.length})</span>
              </div>
              <button
                onClick={fetchRegisteredFacilities}
                className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs">Refresh</span>
              </button>
            </div>

            {/* Leaflet Map Container */}
            <div className={`${styles.mapSection} bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
              {/* Map Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-red-50 flex-shrink-0">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-pink-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900">Interactive Map - Davao City</h3>
                  <span className="ml-2 text-sm text-gray-600">({davaoCityCoords.lat}, {davaoCityCoords.lng})</span>
                </div>
              </div>

              {/* Leaflet Map */}
              <div className={styles.mapContainer}>
                <MapContainer
                  center={[davaoCityCoords.lat, davaoCityCoords.lng]}
                  zoom={davaoCityCoords.zoom}
                  className={styles.leafletContainer}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Registered Facilities Markers */}
                  {showFacilities && facilities.map((facility) => {
                    const customIcon = createFacilityPinIcon(facility);
                    return (
                      <Marker 
                        key={facility.id} 
                        position={[facility.lat, facility.lng]}
                        icon={customIcon}
                        eventHandlers={{
                          click: () => setSelectedFacility(facility)
                        }}
                      >
                      <Popup>
                        <div className="p-4 min-w-72">
                          <h4 className="font-semibold text-lg text-pink-600 mb-2">{facility.name}</h4>
                          <div className="space-y-2 text-sm mb-4">
                            <p className="text-gray-600">{facility.description || facility.address}</p>
                          </div>
                          <button 
                            onClick={() => {
                              console.log('Search Patient History clicked for facility:', facility.name);
                              setSelectedFacility(facility);
                              setShowPatientSearchModal(true);
                              console.log('Modal should now be visible, showPatientSearchModal:', true);
                            }}
                            className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Search Patient History
                          </button>
                        </div>
                      </Popup>
                      </Marker>
                    );
                  })}

                  {/* Service area circles for registered facilities */}
                  {showFacilities && facilities.map((facility) => (
                    <Circle
                      key={`circle-${facility.id}`}
                      center={[facility.lat, facility.lng]}
                      radius={5000}
                      pathOptions={{
                        fillColor: '#ec4899',
                        fillOpacity: 0.1,
                        color: '#ec4899',
                        weight: 2,
                        opacity: 0.4
                      }}
                    />
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

          {/* Patient Search Results */}
          {showSearchResults && patientSearchResults && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="grid grid-cols-[24px_1fr] gap-2 items-start">
                    <span className="text-xl">👥</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Patient: {patientSearchResults.name}
                      </h3>
                      {patientSearchResults.birthdate !== 'Patient not found' && patientSearchResults.birthdate !== 'Error searching patient' && patientSearchResults.birthdate !== 'Not provided' && (
                        <p className="text-gray-600">
                          Birthdate: {patientSearchResults.birthdate ? new Date(patientSearchResults.birthdate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    setPatientSearchResults(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {patientSearchResults.birthdate === 'Patient not found' ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p>No patient found with that name or ID.</p>
                </div>
              ) : patientSearchResults.birthdate === 'Error searching patient' ? (
                <div className="text-center py-8 text-red-500">
                  <svg className="h-12 w-12 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Error occurred while searching for patient.</p>
                </div>
              ) : (
                patientSearchResults.consultationHistory && patientSearchResults.consultationHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exam Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Facility Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GA
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            BP
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Weight
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes / Remarks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Provider
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {patientSearchResults.consultationHistory.map((consultation, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {consultation.exam_date ? new Date(consultation.exam_date).toLocaleDateString('en-CA') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {consultation.facility_name || 'Unknown Facility'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                              {consultation.gestational_age || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {consultation.blood_pressure || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {consultation.weight || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                              <span className="text-blue-600">
                                {consultation.notes || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {consultation.provider || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <button
                                onClick={async () => {
                                  let patient = null;
                                  
                                  // First, try to use the full patient data from search results
                                  if (patientSearchResults.fullPatientData && 
                                      patientSearchResults.fullPatientData.id === consultation.patient_id) {
                                    patient = patientSearchResults.fullPatientData;
                                  } else {
                                    // If not available, fetch from API
                                    try {
                                      const response = await axios.get(`/api/patients/${consultation.patient_id}`);
                                      patient = response.data?.data || response.data || null;
                                    } catch (error) {
                                      console.error('Error fetching patient details:', error);
                                    }
                                  }
                                  
                                  if (!patient) {
                                    // Last resort fallback: use minimal info from search result
                                    const parts = (patientSearchResults.name || '').trim().split(/\s+/);
                                    patient = {
                                      first_name: parts[0] || '',
                                      middle_name: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
                                      last_name: parts.length > 1 ? parts[parts.length - 1] : '',
                                      date_of_birth: patientSearchResults.birthdate || '',
                                      age: '',
                                      civil_status: '',
                                      address: '',
                                      contact_number: '',
                                      status: '',
                                      facility_name: '',
                                      philhealth_number: '',
                                      philhealth_category: '',
                                      philhealth_dependent_id: '',
                                      philhealth_dependent_name: '',
                                      philhealth_dependent_relation: ''
                                    };
                                  }
                                  
                                  setSelectedPatientDetails(patient);
                                  setShowPatientDetailsModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                                type="button"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No prenatal forms found for this patient.</p>
                  </div>
                )
              )}
            </div>
          )}
          
      {/* Patient Search Modal - Force render when showPatientSearchModal is true */}
      {showPatientSearchModal && (
        <div 
          id="patient-search-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              width: '100%',
              maxWidth: '400px',
              margin: '0 16px'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Search Patient</h3>
                <button
                  onClick={() => {
                    console.log('Closing modal');
                    setShowPatientSearchModal(false);
                    setPatientSearchName('');
                    setSelectedFacility(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  type="button"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Enter Patient Name:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={patientSearchName || ''}
                    onChange={(e) => setPatientSearchName(e.target.value)}
                    placeholder="Patient Name"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      const searchValue = patientSearchName?.trim();
                      if (searchValue) {
                        console.log('Searching for patient:', searchValue, 'in facility:', selectedFacility?.name);
                        setSearchingPatient(true);
                        
                        try {
                          // Search for patient using real API
                          const response = await axios.get(`/api/patients/search?query=${encodeURIComponent(searchValue)}`);
                          
                          if (response.data && response.data.length > 0) {
                            // Find patient that belongs to the selected facility
                            const patientInFacility = response.data.find(patient => 
                              patient.facility_id === selectedFacility?.id
                            );
                            
                            if (patientInFacility) {
                              // Patient exists in this facility
                              const consultationResponse = await axios.get(`/api/patients/${patientInFacility.id}/consultations`);
                              
                              const patientData = {
                                id: patientInFacility.id,
                                name: patientInFacility.name,
                                birthdate: patientInFacility.birth_date || patientInFacility.date_of_birth || 'Not provided',
                                fullPatientData: patientInFacility,
                                consultationHistory: (consultationResponse.data.consultations || []).map(c => ({
                                  ...c,
                                  patient_id: patientInFacility.id
                                }))
                              };
                              
                              setPatientSearchResults(patientData);
                              setShowSearchResults(true);
                            } else {
                              // Patient exists in system but not in this facility
                              setPatientNotFoundMessage(`Patient doesn't exist in ${selectedFacility?.name || 'this facility'}.`);
                              setShowPatientNotFoundDialog(true);
                              return; // Don't close modal, let user try again
                            }
                            
                          } else {
                            // No patient found in entire system
                            setPatientNotFoundMessage(`Patient doesn't exist in ${selectedFacility?.name || 'this facility'}.`);
                            setShowPatientNotFoundDialog(true);
                            return; // Don't close modal, let user try again
                          }
                          
                        } catch (error) {
                          console.error('Error searching for patient:', error);
                          // Show error result
                          setPatientNotFoundMessage('Error occurred while searching for patient. Please try again.');
                          setShowPatientNotFoundDialog(true);
                          return; // Don't close modal, let user try again
                        } finally {
                          setSearchingPatient(false);
                        }
                        
                        // Close the modal only if patient was found
                        setShowPatientSearchModal(false);
                        setPatientSearchName('');
                        setSelectedFacility(null);
                      }
                    }}
                    disabled={!patientSearchName?.trim() || searchingPatient}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: (patientSearchName?.trim() && !searchingPatient) ? '#ec4899' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (patientSearchName?.trim() && !searchingPatient) ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    type="button"
                  >
                    {searchingPatient ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
              
              {selectedFacility && (
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  <p>Searching in: <strong>{selectedFacility.name}</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Consultation History Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-red-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedPatient.name}</h3>
                  <p className="text-sm text-gray-600">
                    Age: {selectedPatient.age} | Phone: {selectedPatient.phone}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPatientModal(false);
                    setSelectedPatient(null);
                    setConsultationHistory([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Consultation History</h4>
              
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E56D85]"></div>
                  <span className="ml-3 text-[#A41F39] font-medium">Loading consultaion history...</span>
                </div>
              ) : consultationHistory.length > 0 ? (
                <div className="space-y-4">
                  {consultationHistory.map((consultation) => (
                    <div key={consultation.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-semibold text-gray-900">{consultation.facility}</h5>
                          <p className="text-sm text-gray-600">{consultation.date} | {consultation.doctor}</p>
                        </div>
                        <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs font-medium">
                          {consultation.diagnosis}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Weight:</span>
                          <span className="ml-2 text-sm text-gray-600">{consultation.weight}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Blood Pressure:</span>
                          <span className="ml-2 text-sm text-gray-600">{consultation.bloodPressure}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700 block mb-1">Notes:</span>
                        <p className="text-sm text-gray-600 bg-white p-2 rounded border">{consultation.notes}</p>
                      </div>
                      
                      {consultation.nextVisit && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Next Visit:</span>
                          <span className="ml-2 text-sm text-green-600 font-medium">{consultation.nextVisit}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <svg className="h-8 w-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No consultation history available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Last visit: {selectedPatient.lastVisit} at {selectedPatient.facility}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPatientModal(false);
                      setSelectedPatient(null);
                      setConsultationHistory([]);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close
                  </button>
                  <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors">
                    Create Referral
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Patient Not Found Dialog */}
      {showPatientNotFoundDialog && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              width: '100%',
              maxWidth: '400px',
              margin: '0 16px'
            }}
          >
            {/* Dialog Header */}
            <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                {/* Warning Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3cd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <svg width="24" height="24" fill="#f59e0b" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Patient Not Found</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                {patientNotFoundMessage}
              </p>
            </div>

            {/* Dialog Actions */}
            <div style={{ padding: '16px 24px 24px 24px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowPatientNotFoundDialog(false);
                  setPatientNotFoundMessage('');
                }}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#ec4899',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  minWidth: '80px'
                }}
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Patient Details Modal */}
      {showPatientDetailsModal && selectedPatientDetails && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '16px',
            overflowY: 'auto'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              width: '100%',
              maxWidth: '768px',
              margin: '16px auto',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '10px 16px', background: 'linear-gradient(to right, #BF3853, #A41F39)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>Patient Details</h3>
              <button
                onClick={() => {
                  setShowPatientDetailsModal(false);
                  setSelectedPatientDetails(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '16px', display: 'grid', gap: '12px' }}>
              {/* Basic Information */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #BF3853' }}>Basic Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</p>
                    <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>
                      {selectedPatientDetails.first_name} {selectedPatientDetails.middle_name} {selectedPatientDetails.last_name}
                    </p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date of Birth</p>
                    <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>
                      {selectedPatientDetails.date_of_birth ? selectedPatientDetails.date_of_birth.split('T')[0] : (selectedPatientDetails.birth_date ? selectedPatientDetails.birth_date.split('T')[0] : 'N/A')}
                    </p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Age</p>
                    <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.age || 'N/A'}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Civil Status</p>
                    <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.civil_status || 'N/A'}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px', gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</p>
                    <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #BF3853' }}>Contact Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Number</p>
                    <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.contact_number || 'N/A'}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                    <p style={{ fontSize: '12px', margin: 0 }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: '700',
                        borderRadius: '9999px',
                        backgroundColor: selectedPatientDetails.status === 'Active' ? '#dcfce7' : '#dbeafe',
                        color: selectedPatientDetails.status === 'Active' ? '#166534' : '#1e40af'
                      }}>
                        {selectedPatientDetails.status || 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Facility Information */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #BF3853' }}>Facility Information</h4>
                <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                  <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Facility Name</p>
                  <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.facility_name || 'N/A'}</p>
                </div>
              </div>

              {/* PhilHealth Information */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #BF3853' }}>PhilHealth Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PhilHealth Number</p>
                    <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.philhealth_number || 'N/A'}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PhilHealth Category</p>
                    <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.philhealth_category || 'N/A'}</p>
                  </div>
                </div>

                {/* Principal Member Information - Show only for Indirect members */}
                {selectedPatientDetails.philhealth_category === 'Indirect' && (
                  <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Principal Member's Information</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Principal Member's PhilHealth No.</p>
                        <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.philhealth_dependent_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Principal Member's Name</p>
                        <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.philhealth_dependent_name || 'N/A'}</p>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Relationship to Principal Member</p>
                        <p style={{ fontSize: '12px', color: '#111827', fontWeight: '600' }}>{selectedPatientDetails.philhealth_dependent_relation || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '10px 16px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPatientDetailsModal(false);
                  setSelectedPatientDetails(null);
                }}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
    );
  } catch (error) {
    console.error('Error rendering MapPage:', error);
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Map Loading Error</h1>
          <p className="text-gray-600 mb-4">There was an error loading the map. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default MapPage;