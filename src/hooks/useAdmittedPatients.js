import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/hooks/auth';

// Sample data for fallback when API is unavailable
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

export const useAdmittedPatients = (birthcare_Id, searchTerm = '') => {
  const { user } = useAuth();
  const [admittedPatients, setAdmittedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdmittedPatients = async () => {
    if (!user) return;
    
    // Get authentication token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    try {
      console.log('Fetching admitted patients with auth headers...');
      
      // Try different endpoints in order of preference
      let response;
      let admittedPatients = [];
      
      try {
        console.log('Trying fully-paid-patients discharge endpoint...');
        const searchParams = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
        response = await axios.get(`/api/birthcare/${birthcare_Id}/discharge/fully-paid-patients${searchParams}`, { headers });
        
        if (response.data.success && response.data.data) {
          admittedPatients = response.data.data;
          console.log('Successfully fetched', admittedPatients.length, 'fully paid patients from discharge API');
          setAdmittedPatients(admittedPatients);
          setError(null);
          return;
        }
      } catch (fullyPaidError) {
        console.log('Fully paid patients endpoint failed:', fullyPaidError.response?.status, fullyPaidError.response?.statusText);
      }
      
      try {
        console.log('Trying patient-charges admitted-patients endpoint as fallback...');
        response = await axios.get(`/api/birthcare/${birthcare_Id}/patient-charges/admitted-patients`, { headers });
        
        if (response.data.success && response.data.data) {
          admittedPatients = response.data.data;
          console.log('Successfully fetched', admittedPatients.length, 'admitted patients from patient charges API (fallback)');
          setAdmittedPatients(admittedPatients);
          setError('⚠️ Showing all admitted patients. Fully paid filter not available.');
          return;
        }
      } catch (chargesError) {
        console.log('Patient charges endpoint failed:', chargesError.response?.status, chargesError.response?.statusText);
      }
      
      try {
        console.log('Trying patient-admissions endpoint...');
        response = await axios.get(`/api/birthcare/${birthcare_Id}/patient-admissions`, { headers });
        
        if (response.data && response.data.data) {
          const admissionsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
          
          // Filter for currently admitted patients
          admittedPatients = admissionsData
            .filter(admission => {
              const status = admission.status ? admission.status.toLowerCase() : '';
              return status === 'admitted' || status === 'in-labor' || status === 'delivered';
            })
            .map(admission => ({
              id: admission.patient_id || admission.patient?.id || admission.id,
              first_name: admission.patient?.first_name || admission.first_name,
              middle_name: admission.patient?.middle_name || admission.middle_name, 
              last_name: admission.patient?.last_name || admission.last_name,
              firstname: admission.patient?.first_name || admission.first_name,
              middlename: admission.patient?.middle_name || admission.middle_name,
              lastname: admission.patient?.last_name || admission.last_name,
              admission_date: admission.admission_date,
              room_number: admission.room?.name || admission.bed?.bed_number || admission.room_number || 'N/A',
              status: admission.status,
              latest_admission: admission
            }));
          
          if (admittedPatients.length > 0) {
            console.log('Successfully fetched', admittedPatients.length, 'admitted patients from patient-admissions API');
            setAdmittedPatients(admittedPatients);
            setError(null);
            return;
          }
        }
      } catch (admissionError) {
        console.log('Patient admissions endpoint failed:', admissionError.response?.status, admissionError.response?.statusText);
      }
      
      try {
        console.log('Trying patients endpoint as fallback...');
        response = await axios.get(`/api/birthcare/${birthcare_Id}/patients`, { headers });
        
        if (response.data && response.data.data) {
          const patientsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
          
          // Use all patients as potential candidates (API might not have admission status)
          admittedPatients = patientsData.map(patient => ({
            id: patient.id,
            first_name: patient.first_name,
            middle_name: patient.middle_name, 
            last_name: patient.last_name,
            firstname: patient.first_name,
            middlename: patient.middle_name,
            lastname: patient.last_name,
            admission_date: patient.admission_date || new Date().toISOString().split('T')[0],
            room_number: patient.room_number || 'N/A',
            status: 'admitted',
            latest_admission: null
          }));
          
          if (admittedPatients.length > 0) {
            console.log('Using', admittedPatients.length, 'patients from patients API as fallback');
            setAdmittedPatients(admittedPatients);
            setError('⚠️ Using patients list as fallback. Some admission details may be limited.');
            return;
          }
        }
      } catch (patientsError) {
        console.log('Patients endpoint also failed:', patientsError.response?.status, patientsError.response?.statusText);
      }
      
      throw new Error('No admitted patients found from any endpoint');
      
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
        
        // Filter for admitted patients
        const admittedPatients = allData.filter(item => {
          // Check various possible status fields
          return item.status === 'Admitted' || 
                 item.status === 'admitted' || 
                 item.admission_status === 'admitted' ||
                 item.admission_status === 'Admitted' ||
                 (item.discharge_date === null || item.discharge_date === undefined) &&
                 (item.admission_date !== null && item.admission_date !== undefined)
        });
        
        if (admittedPatients.length > 0) {
          console.log('Found', admittedPatients.length, 'admitted patients from alternative endpoint');
          setAdmittedPatients(admittedPatients);
          setError('⚠️ Using alternative data source for admitted patients. Some features may be limited.');
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

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      if (user && birthcare_Id) {
        setLoading(true);
        await fetchAdmittedPatients();
        setLoading(false);
      }
    };

    initializeData();
  }, [user, birthcare_Id, searchTerm]);

  return {
    admittedPatients,
    loading,
    error,
    refetch: fetchAdmittedPatients
  };
};
