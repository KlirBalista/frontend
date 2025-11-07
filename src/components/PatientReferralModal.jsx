"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import axios from "@/lib/axios";

const PatientReferralModal = ({ isOpen, onClose, onSubmit, birthcare_Id, editData = null }) => {
  const [formData, setFormData] = useState({
    patient_id: "",
    referring_facility: "",
    referring_physician: "",
    referring_physician_contact: "",
    receiving_facility: "",
    receiving_physician: "",
    receiving_physician_contact: "",
    referral_date: new Date().toISOString().split('T')[0],
    referral_time: "12:00",
    urgency_level: "routine",
    reason_for_referral: "",
    clinical_summary: "",
    current_diagnosis: "",
    relevant_history: "",
    current_medications: "",
    allergies: "",
    vital_signs: "",
    laboratory_results: "",
    imaging_results: "",
    treatment_provided: "",
    patient_condition: "",
    transportation_mode: "ambulance",
    accompanies_patient: "",
    special_instructions: "",
    equipment_required: "",
    isolation_precautions: "",
    anticipated_care_level: "",
    expected_duration: "",
    insurance_information: "",
    family_contact_name: "",
    family_contact_phone: "",
    family_contact_relationship: "",
    status: "pending",
    notes: ""
  });

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [facilityName, setFacilityName] = useState("");

  // Midwives for referring physician dropdown
  const [midwives, setMidwives] = useState([]);
  const [referringPhysicianSearch, setReferringPhysicianSearch] = useState('');
  const [showPhysicianDropdown, setShowPhysicianDropdown] = useState(false);

  // Fetch patients for dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}/patients`);
        const patientsData = response.data.data || response.data || [];
        setPatients(patientsData);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    };

    if (isOpen && birthcare_Id) {
      fetchPatients();
    }
  }, [isOpen, birthcare_Id]);

  // Fetch facility information to auto-populate referring facility
  useEffect(() => {
    const fetchFacilityInfo = async () => {
      try {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}`);
        const facilityData = response.data.data || response.data || {};
        const name = facilityData.name || "";
        setFacilityName(name);
        
        // Auto-populate referring_facility if not in edit mode
        if (!editData) {
          setFormData(prev => ({
            ...prev,
            referring_facility: name
          }));
        }
      } catch (err) {
        console.error("Error fetching facility info:", err);
      }
    };

    if (isOpen && birthcare_Id) {
      fetchFacilityInfo();
    }
  }, [isOpen, birthcare_Id, editData]);

  // Fetch midwives for referring physician dropdown
  useEffect(() => {
    const fetchMidwives = async () => {
      try {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}/staff`);
        const staff = response.data || [];
        const mids = staff.filter(s => s.role_name && s.role_name.toLowerCase().includes('midwife'));
        setMidwives(mids);
      } catch (err) {
        console.error('Error fetching midwives:', err);
      }
    };
    if (isOpen && birthcare_Id) {
      fetchMidwives();
    }
  }, [isOpen, birthcare_Id]);

  // Populate form if editing
  useEffect(() => {
    if (editData) {
      const patientName = editData.patient 
        ? `${editData.patient.first_name} ${editData.patient.middle_name || ''} ${editData.patient.last_name}`.trim()
        : '';
      
      setSearchTerm(patientName);
      setReferringPhysicianSearch(editData.referring_physician || '');
      setFormData({
        patient_id: editData.patient_id || "",
        referring_facility: editData.referring_facility || "",
        referring_physician: editData.referring_physician || "",
        referring_physician_contact: editData.referring_physician_contact || "",
        receiving_facility: editData.receiving_facility || "",
        receiving_physician: editData.receiving_physician || "",
        receiving_physician_contact: editData.receiving_physician_contact || "",
        referral_date: editData.referral_date ? new Date(editData.referral_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        referral_time: editData.referral_time || "12:00",
        urgency_level: editData.urgency_level || "routine",
        reason_for_referral: editData.reason_for_referral || "",
        clinical_summary: editData.clinical_summary || "",
        current_diagnosis: editData.current_diagnosis || "",
        relevant_history: editData.relevant_history || "",
        current_medications: editData.current_medications || "",
        allergies: editData.allergies || "",
        vital_signs: editData.vital_signs || "",
        laboratory_results: editData.laboratory_results || "",
        imaging_results: editData.imaging_results || "",
        treatment_provided: editData.treatment_provided || "",
        patient_condition: editData.patient_condition || "",
        transportation_mode: editData.transportation_mode || "ambulance",
        accompanies_patient: editData.accompanies_patient || "",
        special_instructions: editData.special_instructions || "",
        equipment_required: editData.equipment_required || "",
        isolation_precautions: editData.isolation_precautions || "",
        anticipated_care_level: editData.anticipated_care_level || "",
        expected_duration: editData.expected_duration || "",
        insurance_information: editData.insurance_information || "",
        family_contact_name: editData.family_contact_name || "",
        family_contact_phone: editData.family_contact_phone || "",
        family_contact_relationship: editData.family_contact_relationship || "",
        status: editData.status || "pending",
        notes: editData.notes || ""
      });
    } else {
      // Reset form for new referral
      setSearchTerm('');
      setReferringPhysicianSearch('');
      setFormData({
        patient_id: "",
        referring_facility: facilityName,
        referring_physician: "",
        referring_physician_contact: "",
        receiving_facility: "",
        receiving_physician: "",
        receiving_physician_contact: "",
        referral_date: new Date().toISOString().split('T')[0],
        referral_time: "12:00",
        urgency_level: "routine",
        reason_for_referral: "",
        clinical_summary: "",
        current_diagnosis: "",
        relevant_history: "",
        current_medications: "",
        allergies: "",
        vital_signs: "",
        laboratory_results: "",
        imaging_results: "",
        treatment_provided: "",
        patient_condition: "",
        transportation_mode: "ambulance",
        accompanies_patient: "",
        special_instructions: "",
        equipment_required: "",
        isolation_precautions: "",
        anticipated_care_level: "",
        expected_duration: "",
        insurance_information: "",
        family_contact_name: "",
        family_contact_phone: "",
        family_contact_relationship: "",
        status: "pending",
        notes: ""
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePatientSelect = (patient) => {
    setSearchTerm(`${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.trim());
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id
    }));
    setShowDropdown(false);
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const filteredMidwives = midwives.filter(mw => mw.name?.toLowerCase().includes(referringPhysicianSearch.toLowerCase()));

  const handleReferringPhysicianSelect = (mw) => {
    setReferringPhysicianSearch(mw.name);
    setFormData(prev => ({ ...prev, referring_physician: mw.name }));
    setShowPhysicianDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    console.log('Form Data on Submit:', formData);

    // Validation
    if (!formData.patient_id) {
      setError("Please select a patient from the dropdown list");
      return;
    }

    if (!formData.referring_facility || !formData.receiving_facility) {
      setError("Please fill in both referring and receiving facilities");
      return;
    }

    if (!formData.referring_physician) {
      setError("Please provide the referring physician name");
      return;
    }

    if (!formData.reason_for_referral) {
      setError("Please provide a reason for referral");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save referral");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        
        {/* Modal panel */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
            <h2 className="text-xl font-semibold">{editData ? 'Edit Referral' : 'Create Patient Referral'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Form Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
            <form id="referral-form" onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Referral Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{color: '#A41F39'}}>Referral Information</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Patient Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Patient Selection with Search */}
                      <div className="md:col-span-2 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        {/* Hidden input to store patient_id */}
                        <input type="hidden" name="patient_id" value={formData.patient_id} required />
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setShowDropdown(true);
                              // Clear patient_id if user types after selecting
                              if (formData.patient_id) {
                                setFormData(prev => ({ ...prev, patient_id: '' }));
                              }
                            }}
                            onFocus={() => !editData && setShowDropdown(true)}
                            placeholder="Search patient..."
                            className={`w-full pl-10 pr-3 py-2 border ${formData.patient_id ? 'border-green-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853] ${editData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={editData}
                          />
                          {formData.patient_id && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {showDropdown && searchTerm && !editData && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredPatients.length > 0 ? (
                              filteredPatients.map(patient => (
                                <div
                                  key={patient.id}
                                  onClick={() => handlePatientSelect(patient)}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">
                                    {patient.first_name} {patient.middle_name || ''} {patient.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Age: {patient.age || 'N/A'} | Contact: {patient.contact_number || 'N/A'}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500 text-sm">No patients found</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Facilities */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Referring Facility <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="referring_facility"
                          value={formData.referring_facility}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853] bg-gray-50"
                          placeholder="Enter referring facility name"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Receiving Facility <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="receiving_facility"
                          value={formData.receiving_facility}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Enter receiving facility name"
                        />
                      </div>
                      {/* Physicians */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Referring Physician <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            name="referring_physician"
                            value={referringPhysicianSearch}
                            onChange={(e) => {
                              setReferringPhysicianSearch(e.target.value);
                              setFormData(prev => ({ ...prev, referring_physician: e.target.value }));
                              setShowPhysicianDropdown(true);
                            }}
                            onFocus={() => setShowPhysicianDropdown(true)}
                            required
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                            placeholder="Doctor or staff name"
                          />
                        </div>
                        {showPhysicianDropdown && referringPhysicianSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredMidwives.length > 0 ? (
                              filteredMidwives.map(mw => (
                                <div
                                  key={mw.id}
                                  onClick={() => handleReferringPhysicianSelect(mw)}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{mw.name}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500 text-sm">No midwives found</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Receiving Physician
                        </label>
                        <input
                          type="text"
                          name="receiving_physician"
                          value={formData.receiving_physician}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Receiving doctor name (optional)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Referral Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="referral_date"
                          value={formData.referral_date}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Referral Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          name="referral_time"
                          value={formData.referral_time}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Urgency Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="urgency_level"
                          value={formData.urgency_level}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                        >
                          <option value="routine">Routine</option>
                          <option value="urgent">Urgent</option>
                          <option value="emergency">Emergency</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transportation Mode <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="transportation_mode"
                          value={formData.transportation_mode}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                        >
                          <option value="ambulance">Ambulance</option>
                          <option value="private_transport">Private Transport</option>
                          <option value="helicopter">Helicopter</option>
                          <option value="wheelchair">Wheelchair</option>
                          <option value="stretcher">Stretcher</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Referral Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Referral <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="reason_for_referral"
                          value={formData.reason_for_referral}
                          onChange={handleChange}
                          required
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Enter reason for referral"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Summary</label>
                        <textarea
                          name="clinical_summary"
                          value={formData.clinical_summary}
                          onChange={handleChange}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Brief clinical summary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Diagnosis</label>
                        <textarea
                          name="current_diagnosis"
                          value={formData.current_diagnosis}
                          onChange={handleChange}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Enter current diagnosis if available"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                        <textarea
                          name="relevant_history"
                          value={formData.relevant_history}
                          onChange={handleChange}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Relevant medical history"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
                        <textarea
                          name="current_medications"
                          value={formData.current_medications}
                          onChange={handleChange}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Current medications"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                        <textarea
                          name="allergies"
                          value={formData.allergies}
                          onChange={handleChange}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Known allergies"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Family Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Family Contact Name</label>
                        <input
                          type="text"
                          name="family_contact_name"
                          value={formData.family_contact_name}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Family member name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Family Contact Phone</label>
                        <input
                          type="tel"
                          name="family_contact_phone"
                          value={formData.family_contact_phone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                        <input
                          type="text"
                          name="family_contact_relationship"
                          value={formData.family_contact_relationship}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="e.g., Spouse, Parent, Child"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853]"
                          placeholder="Any additional notes or information"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          {/* Footer Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="referral-form"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editData ? 'Update Patient Referral' : 'Save Patient Referral'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientReferralModal;
