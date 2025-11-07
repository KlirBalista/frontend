"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { CheckCircle, X } from "lucide-react";
import CustomDialog from "@/components/CustomDialog";

const PatientAdmissionModal = ({ isOpen, onClose, birthcare_Id, onAdmissionCreated }) => {
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Staff dropdown states
  const [physicianSearchTerm, setPhysicianSearchTerm] = useState('');
  const [nurseSearchTerm, setNurseSearchTerm] = useState('');
  const [showPhysicianDropdown, setShowPhysicianDropdown] = useState(false);
  const [showNurseDropdown, setShowNurseDropdown] = useState(false);
  const [filteredMidwives, setFilteredMidwives] = useState([]);
  const [filteredNurses, setFilteredNurses] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    admission_date: new Date().toISOString().split('T')[0],
    admission_time: new Date().toTimeString().slice(0, 5),
    admission_type: "regular",
    chief_complaint: "",
    reason_for_admission: "",
    medical_history: "",
    allergies: "",
    current_medications: "",
    vital_signs_temperature: "",
    vital_signs_blood_pressure: "",
    vital_signs_heart_rate: "",
    vital_signs_respiratory_rate: "",
    vital_signs_oxygen_saturation: "",
    weight: "",
    height: "",
    attending_physician: "",
    primary_nurse: "",
    room_id: "",
    bed_id: "",
    ward_section: "",
    admission_source: "",
    insurance_information: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    patient_belongings: "",
    special_dietary_requirements: "",
    mobility_assistance_needed: false,
    fall_risk_assessment: "low",
    isolation_precautions: "",
    patient_orientation_completed: false,
    family_notification_completed: false,
    advance_directives: "",
    discharge_planning_needs: "",
    physical_examination: "",
    initial_diagnosis: "",
    treatment_plan: "",
    status: "in-labor",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch patients for dropdown
  const fetchPatients = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/patients?all=true`
      );
      const patientsData = response.data.data || response.data;
      setPatients(patientsData);
      setFilteredPatients(patientsData);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rooms for dropdown
  const fetchRooms = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/rooms`
      );
      const roomsData = response.data.data || response.data;
      setRooms(roomsData);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };

  // Fetch staff for dropdowns
  const fetchStaff = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/staff`
      );
      const staffData = response.data.data || response.data || [];
      setStaff(staffData);
      
      // Filter midwives and nurses
      const midwives = staffData.filter(s => 
        s.role?.role_name?.toLowerCase().includes('midwife') || 
        s.role_name?.toLowerCase().includes('midwife')
      );
      const nurses = staffData.filter(s => 
        s.role?.role_name?.toLowerCase().includes('nurse') || 
        s.role_name?.toLowerCase().includes('nurse')
      );
      
      setFilteredMidwives(midwives);
      setFilteredNurses(nurses);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };
  
  // Fetch beds for selected room
  const fetchBeds = async (roomId) => {
    if (!roomId) {
      setBeds([]);
      return;
    }
    
    setLoadingRooms(true);
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/rooms/${roomId}/beds`
      );
      const bedsData = response.data.data || response.data;
      setBeds(bedsData);
    } catch (err) {
      console.error("Failed to fetch beds:", err);
      setBeds([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isOpen && birthcare_Id) {
      fetchPatients();
      fetchRooms();
      fetchStaff();
    }
  }, [isOpen, birthcare_Id]);

  // Search functionality
  useEffect(() => {
    if (patients.length > 0) {
      const filtered = patients.filter((patient) => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const phoneNumber = patient.phone_number || '';
        return (
          fullName.includes(searchTerm.toLowerCase()) ||
          phoneNumber.includes(searchTerm)
        );
      });
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);
  
  // Filter midwives based on search
  useEffect(() => {
    if (staff.length > 0) {
      const midwives = staff.filter(s => 
        (s.role?.role_name?.toLowerCase().includes('midwife') || 
        s.role_name?.toLowerCase().includes('midwife')) &&
        `${s.user?.firstname || ''} ${s.user?.lastname || ''}`.toLowerCase().includes(physicianSearchTerm.toLowerCase())
      );
      setFilteredMidwives(midwives);
    }
  }, [physicianSearchTerm, staff]);
  
  // Filter nurses based on search
  useEffect(() => {
    if (staff.length > 0) {
      const nurses = staff.filter(s => 
        (s.role?.role_name?.toLowerCase().includes('nurse') || 
        s.role_name?.toLowerCase().includes('nurse')) &&
        `${s.user?.firstname || ''} ${s.user?.lastname || ''}`.toLowerCase().includes(nurseSearchTerm.toLowerCase())
      );
      setFilteredNurses(nurses);
    }
  }, [nurseSearchTerm, staff]);

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      ...formData,
      patient_id: patient.patient_id || patient.id,
    });
    setSearchTerm(`${patient.first_name} ${patient.last_name}`);
    setShowPatientDropdown(false);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'room_id') {
      setFormData(prev => ({
        ...prev,
        room_id: value,
        bed_id: ""
      }));
      fetchBeds(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (!formData.patient_id) {
      setErrorMessage('Please select a patient before submitting the form.');
      setShowError(true);
      setSubmitting(false);
      return;
    }
    
    try {
      const response = await axios.post(`/api/birthcare/${birthcare_Id}/patient-admissions`, formData);
      
      if (response.status === 201 || response.status === 200) {
        setSuccessMessage('Patient admission created successfully!');
        setShowSuccess(true);
      }
      
    } catch (error) {
      console.error('Error creating admission:', error);
      
      let errorMsg = 'Error creating admission. Please try again.';
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        errorMsg = `Validation errors:\n${errorMessages}`;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      setErrorMessage(errorMsg);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPhysicianSearchTerm('');
    setNurseSearchTerm('');
    setFormData({
      patient_id: "",
      admission_date: new Date().toISOString().split('T')[0],
      admission_time: new Date().toTimeString().slice(0, 5),
      admission_type: "regular",
      chief_complaint: "",
      reason_for_admission: "",
      medical_history: "",
      allergies: "",
      current_medications: "",
      vital_signs_temperature: "",
      vital_signs_blood_pressure: "",
      vital_signs_heart_rate: "",
      vital_signs_respiratory_rate: "",
      vital_signs_oxygen_saturation: "",
      weight: "",
      height: "",
      attending_physician: "",
      primary_nurse: "",
      room_id: "",
      bed_id: "",
      ward_section: "",
      admission_source: "",
      insurance_information: "",
      emergency_contact_name: "",
      emergency_contact_relationship: "",
      emergency_contact_phone: "",
      patient_belongings: "",
      special_dietary_requirements: "",
      mobility_assistance_needed: false,
      fall_risk_assessment: "low",
      isolation_precautions: "",
      patient_orientation_completed: false,
      family_notification_completed: false,
      advance_directives: "",
      discharge_planning_needs: "",
      physical_examination: "",
      initial_diagnosis: "",
      treatment_plan: "",
      status: "in-labor",
      notes: "",
    });
    setSelectedPatient(null);
    setSearchTerm('');
    setBeds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Admit Patient</h2>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-8">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Patient Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    placeholder="Search patients by name..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                    required={!selectedPatient}
                  />
                </div>
                
                {/* Dropdown List */}
                {showPatientDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient, index) => (
                        <div
                          key={patient.patient_id || patient.id || `patient-${index}`}
                          onClick={() => handlePatientSelect(patient)}
                          className="px-4 py-2 hover:bg-rose-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <p className="font-medium text-gray-900">
                            {`${patient.first_name} ${patient.middle_name || ""} ${patient.last_name}`.trim()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No patients found
                      </div>
                    )}
                  </div>
                )}
                
                
                {/* Click outside to close dropdown */}
                {showPatientDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowPatientDropdown(false)}
                  ></div>
                )}
              </div>

              {/* Admission Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Admission Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admission Date *
                    </label>
                    <input
                      type="date"
                      name="admission_date"
                      value={formData.admission_date}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admission Time *
                    </label>
                    <input
                      type="time"
                      name="admission_time"
                      value={formData.admission_time}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admission Type *
                    </label>
                    <select
                      name="admission_type"
                      value={formData.admission_type}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                    >
                      <option value="regular">Regular</option>
                      <option value="emergency">Emergency</option>
                      <option value="referral">Referral</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Room & Bed Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Room & Bed Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attending Midwife
                    </label>
                    <input
                      type="text"
                      value={physicianSearchTerm}
                      onChange={(e) => {
                        setPhysicianSearchTerm(e.target.value);
                        setShowPhysicianDropdown(true);
                      }}
                      onFocus={() => setShowPhysicianDropdown(true)}
                      placeholder="Search midwife..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                    />
                    
                    {/* Midwife Dropdown */}
                    {showPhysicianDropdown && (
                      <>
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                          {filteredMidwives.length > 0 ? (
                            filteredMidwives.map((midwife) => {
                              const name = `${midwife.user?.firstname || ''} ${midwife.user?.lastname || ''}`.trim();
                              return (
                                <div
                                  key={midwife.id}
                                  onClick={() => {
                                    setPhysicianSearchTerm(name);
                                    setFormData({ ...formData, attending_physician: name });
                                    setShowPhysicianDropdown(false);
                                  }}
                                  className="px-4 py-2 hover:bg-rose-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <p className="font-medium text-gray-900">{name}</p>
                                  <p className="text-sm text-gray-500">{midwife.role?.role_name || midwife.role_name || 'Midwife'}</p>
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-center text-sm">
                              No midwives found
                            </div>
                          )}
                        </div>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowPhysicianDropdown(false)}
                        ></div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room *
                    </label>
                    <select
                      name="room_id"
                      value={formData.room_id}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                    >
                      <option value="">-- Select a room --</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bed *
                    </label>
                    <select
                      name="bed_id"
                      value={formData.bed_id}
                      onChange={handleFormChange}
                      disabled={!formData.room_id || loadingRooms}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Select a bed --</option>
                      {beds
                        .filter(bed => !bed.is_occupied)
                        .map((bed) => (
                          <option key={bed.id} value={bed.id}>
                            Bed {bed.bed_no}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              </div>

              {/* Primary Nurse */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attending Nurse
                </label>
                <input
                  type="text"
                  value={nurseSearchTerm}
                  onChange={(e) => {
                    setNurseSearchTerm(e.target.value);
                    setShowNurseDropdown(true);
                  }}
                  onFocus={() => setShowNurseDropdown(true)}
                  placeholder="Search nurse..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                />
                
                {/* Nurse Dropdown */}
                {showNurseDropdown && (
                  <>
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {filteredNurses.length > 0 ? (
                        filteredNurses.map((nurse) => {
                          const name = `${nurse.user?.firstname || ''} ${nurse.user?.lastname || ''}`.trim();
                          return (
                            <div
                              key={nurse.id}
                              onClick={() => {
                                setNurseSearchTerm(name);
                                setFormData({ ...formData, primary_nurse: name });
                                setShowNurseDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-rose-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <p className="font-medium text-gray-900">{name}</p>
                              <p className="text-sm text-gray-500">{nurse.role?.role_name || nurse.role_name || 'Nurse'}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center text-sm">
                          No nurses found
                        </div>
                      )}
                    </div>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNurseDropdown(false)}
                    ></div>
                  </>
                )}
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chief Complaint
                </label>
                <input
                  type="text"
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleFormChange}
                  placeholder="Main reason for admission"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                />
              </div>

              {/* Status (fixed) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <input
                  type="text"
                  value="In-Labor"
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
                {/* Ensure status is submitted as in-labor */}
                <input type="hidden" name="status" value="in-labor" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Any additional notes or observations"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-center gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 max-w-[200px] px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.room_id || !formData.bed_id}
                  className="flex-1 max-w-[200px] px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-xl hover:shadow-lg hover:shadow-[#BF3853]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                >
                  {submitting ? 'Creating Admission...' : 'Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAdmissionModal;
