"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";
import { generateReferralPDF, downloadReferralPDF, saveReferralPDFAsDocument } from "@/utils/pdfGenerator";
import SearchablePatientSelect from "@/components/SearchablePatientSelect";

const CreateReferralPage = () => {
  const { birthcare_Id } = useParams();
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdReferralId, setCreatedReferralId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [facilityInfo, setFacilityInfo] = useState(null);
  const pdfRef = useRef();
  const [formData, setFormData] = useState({
    patient_id: "",
    referring_facility: "",
    referring_physician: "",
    referring_physician_contact: "",
    receiving_facility: "",
    receiving_physician: "",
    receiving_physician_contact: "",
    referral_date: new Date().toISOString().split('T')[0],
    referral_time: new Date().toTimeString().slice(0, 5),
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
    notes: "",
  });

  // Fetch facility information
  const fetchFacilityInfo = async () => {
    try {
      const response = await axios.get(`/api/birthcare/${birthcare_Id}`);
      const facilityData = response.data.data || response.data;
      setFacilityInfo(facilityData);
      
      // Auto-populate referring facility name
      if (facilityData?.name) {
        setFormData(prev => ({
          ...prev,
          referring_facility: facilityData.name
        }));
      }
    } catch (err) {
      console.error("Failed to fetch facility info:", err);
    }
  };

  // Fetch patients for dropdown
  const fetchPatients = async () => {
    try {
      const response = await axios.get(
        `/api/birthcare/${birthcare_Id}/patients?all=true`
      );
      const patientsData = response.data.data || response.data;
      setPatients(patientsData);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && birthcare_Id) {
      fetchFacilityInfo();
      fetchPatients();
    }
  }, [user, birthcare_Id]);

  // Handle form input changes
  const handleFormChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Fill sample data for testing
  const fillSampleData = () => {
    const firstPatientId = patients.length > 0 ? patients[0].id : "";
    
    setFormData({
      ...formData,
      patient_id: firstPatientId,
      // Keep the current referring_facility (auto-populated from facility info)
      referring_physician: "Dr. Maria Santos",
      referring_physician_contact: "(02) 8123-4567 / maria.santos@sunshinebirth.com",
      receiving_facility: "Metro General Hospital - Maternity & Neonatal Care Unit",
      receiving_physician: "Dr. Roberto Cruz",
      receiving_physician_contact: "(02) 8987-6543 / roberto.cruz@metrogh.ph",
      urgency_level: "urgent",
      reason_for_referral: "Patient in active labor with fetal distress requiring immediate cesarean section and NICU capabilities for potential neonatal complications.",
      clinical_summary: "39-week gravid patient presents with prolonged labor (18 hours), variable fetal heart rate decelerations, and meconium-stained amniotic fluid. Patient increasingly fatigued with inadequate cervical progression despite oxytocin augmentation.",
      current_diagnosis: "Active labor with fetal distress, Prolonged second stage of labor, Meconium-stained amniotic fluid",
      relevant_history: "G2P1, Previous normal spontaneous vaginal delivery (2020), Gestational diabetes well-controlled with diet, No other significant obstetric history",
      current_medications: "Prenatal vitamins, Iron supplements 325mg daily, Insulin aspart per sliding scale (stopped 4 hours ago)",
      allergies: "Penicillin (anaphylaxis), Latex (contact dermatitis), Shellfish (urticaria)",
      vital_signs: "BP: 140/90 mmHg, HR: 110 bpm, RR: 22/min, Temp: 37.8°C, O2 Sat: 96% on room air, FHR: 110-170 bpm with variable decelerations",
      laboratory_results: "Hgb: 10.2 g/dL, Hct: 30.5%, Platelets: 180,000, Blood glucose: 120 mg/dL, Urinalysis: 2+ protein, GBS: Positive (treated)",
      imaging_results: "Ultrasound: Estimated fetal weight 3.2 kg, Vertex presentation, AFI: 8 cm (low normal), No obvious anomalies detected",
      treatment_provided: "IV hydration with LR at 125 mL/hr, Continuous fetal monitoring, Oxytocin 4mU/min (discontinued), Left lateral positioning, Oxygen 2L NC PRN",
      patient_condition: "stable_but_guarded",
      transportation_mode: "ambulance",
      accompanies_patient: "Husband (Juan Dela Cruz) and attending midwife",
      equipment_required: "Oxygen tank, Portable fetal monitor, IV pump, Emergency delivery kit",
      isolation_precautions: "Standard precautions, GBS precautions for newborn",
      anticipated_care_level: "icu",
      expected_duration: "24-48 hours postpartum, depending on delivery method and maternal-fetal outcomes",
      special_instructions: "Patient prefers natural delivery if possible but understands cesarean may be necessary. Husband present and consents to all procedures. Patient has birth plan on file - requests delayed cord clamping if infant stable. Pediatrician should be present at delivery.",
      insurance_information: "PhilHealth Member - Active, Policy #: 123456789012, Maternity coverage confirmed, No co-payment required for emergency procedures",
      family_contact_name: "Juan Dela Cruz",
      family_contact_phone: "09123456789",
      family_contact_relationship: "Spouse",
      status: "pending",
      notes: "Patient extremely anxious about potential cesarean section. Continuous reassurance provided. Interpreter not needed - patient speaks fluent English and Filipino. Religious preference: Catholic - priest available on request for emergency baptism if needed."
    });
  };

  // Save referral as document with deduplication
  const saveReferralDocument = async (referralId, referralData) => {
    try {
      // Use the deduplication-enabled function
      const pdfData = await saveReferralPDFAsDocument(referralData, patients, birthcare_Id, facilityInfo);
      
      // Save to patient documents using the from-data endpoint
      await axios.post(`/api/birthcare/${birthcare_Id}/patient-documents/from-data`, {
        patient_id: referralData.patient_id,
        title: pdfData.title, // This will now have deduplication suffix if needed
        document_type: pdfData.document_type,
        content: pdfData.base64PDF,
        metadata: pdfData.metadata,
      });
      
      console.log('Referral document saved successfully with deduplication');
    } catch (error) {
      console.error('Error saving referral document:', error);
      // Don't throw error here to avoid blocking the main flow
    }
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await axios.post(`/api/birthcare/${birthcare_Id}/referrals`, formData);
      const referralId = response.data.id || response.data.data?.id;
      setCreatedReferralId(referralId);
      
      // Save as document to patient's files
      if (referralId) {
        await saveReferralDocument(referralId, formData);
      }
      
      alert('Referral created successfully and saved to patient documents!');
      
      // Redirect to referrals list
      router.push(`/${birthcare_Id}/referrals`);
      
    } catch (error) {
      console.error('Error creating referral:', error);
      alert('Error creating referral. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      await downloadReferralPDF(formData, patients);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Handle preview
  const handlePreview = () => {
    setShowPreview(true);
  };

  if (loading && patients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-4rem)]">
          <div className="px-6 py-6 h-full flex flex-col">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Create Patient Referral</h1>
                <p className="text-gray-600 mt-1">
                  Complete the referral form to transfer patient care to another facility
                </p>
              </div>
              <button 
                type="button" 
                onClick={fillSampleData} 
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 hover:scale-105"
              >
                Fill Sample Data
              </button>
            </div>

            {/* Form */}
            <div className="flex-1">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Patient Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient *
                  </label>
                  <SearchablePatientSelect
                    patients={patients}
                    value={formData.patient_id}
                    onChange={(patientId) => setFormData(prev => ({ ...prev, patient_id: patientId || '' }))}
                    placeholder="Search and select a patient..."
                    onOpen={fetchPatients}
                    focusRingColor="focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Referral Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Referral Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referral Date *
                      </label>
                      <input
                        type="date"
                        name="referral_date"
                        value={formData.referral_date}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referral Time *
                      </label>
                      <input
                        type="time"
                        name="referral_time"
                        value={formData.referral_time}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Urgency Level *
                      </label>
                      <select
                        name="urgency_level"
                        value={formData.urgency_level}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Referring Facility Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Referring Facility</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referring Facility Name *
                      </label>
                      <input
                        type="text"
                        name="referring_facility"
                        value={formData.referring_facility}
                        onChange={handleFormChange}
                        required
                        readOnly
                        placeholder="Loading facility name..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                        title="This field is automatically populated with your registered facility name"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically populated with your registered facility name
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referring Physician *
                      </label>
                      <input
                        type="text"
                        name="referring_physician"
                        value={formData.referring_physician}
                        onChange={handleFormChange}
                        required
                        placeholder="Dr. Name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referring Physician Contact
                      </label>
                      <input
                        type="text"
                        name="referring_physician_contact"
                        value={formData.referring_physician_contact}
                        onChange={handleFormChange}
                        placeholder="Phone number, email, or other contact information"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Receiving Facility Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Receiving Facility</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receiving Facility Name *
                      </label>
                      <input
                        type="text"
                        name="receiving_facility"
                        value={formData.receiving_facility}
                        onChange={handleFormChange}
                        required
                        placeholder="Name of receiving facility"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receiving Physician
                      </label>
                      <input
                        type="text"
                        name="receiving_physician"
                        value={formData.receiving_physician}
                        onChange={handleFormChange}
                        placeholder="Dr. Name (if known)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receiving Physician Contact
                      </label>
                      <input
                        type="text"
                        name="receiving_physician_contact"
                        value={formData.receiving_physician_contact}
                        onChange={handleFormChange}
                        placeholder="Phone number, email, or other contact information"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Clinical Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Information</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Referral *
                      </label>
                      <textarea
                        name="reason_for_referral"
                        value={formData.reason_for_referral}
                        onChange={handleFormChange}
                        required
                        rows={3}
                        placeholder="Primary reason for the referral"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinical Summary
                      </label>
                      <textarea
                        name="clinical_summary"
                        value={formData.clinical_summary}
                        onChange={handleFormChange}
                        rows={4}
                        placeholder="Summary of patient's current clinical condition"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Diagnosis
                        </label>
                        <textarea
                          name="current_diagnosis"
                          value={formData.current_diagnosis}
                          onChange={handleFormChange}
                          rows={3}
                          placeholder="Current working diagnosis"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relevant Medical History
                        </label>
                        <textarea
                          name="relevant_history"
                          value={formData.relevant_history}
                          onChange={handleFormChange}
                          rows={3}
                          placeholder="Relevant past medical history"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Medications
                        </label>
                        <textarea
                          name="current_medications"
                          value={formData.current_medications}
                          onChange={handleFormChange}
                          rows={3}
                          placeholder="List of current medications and dosages"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Allergies
                        </label>
                        <textarea
                          name="allergies"
                          value={formData.allergies}
                          onChange={handleFormChange}
                          rows={3}
                          placeholder="Known allergies and adverse reactions"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        ></textarea>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Vital Signs
                      </label>
                      <textarea
                        name="vital_signs"
                        value={formData.vital_signs}
                        onChange={handleFormChange}
                        rows={2}
                        placeholder="Blood pressure, temperature, heart rate, respiratory rate, oxygen saturation"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Test Results & Treatment */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Test Results & Treatment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Laboratory Results
                      </label>
                      <textarea
                        name="laboratory_results"
                        value={formData.laboratory_results}
                        onChange={handleFormChange}
                        rows={3}
                        placeholder="Relevant lab results"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imaging Results
                      </label>
                      <textarea
                        name="imaging_results"
                        value={formData.imaging_results}
                        onChange={handleFormChange}
                        rows={3}
                        placeholder="X-ray, ultrasound, CT, MRI results"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Treatment Provided
                    </label>
                    <textarea
                      name="treatment_provided"
                      value={formData.treatment_provided}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="Treatment and interventions provided at referring facility"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>
                </div>

                {/* Transfer Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Patient Condition
                      </label>
                      <select
                        name="patient_condition"
                        value={formData.patient_condition}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select condition</option>
                        <option value="stable">Stable</option>
                        <option value="stable_but_guarded">Stable but Guarded</option>
                        <option value="critical">Critical</option>
                        <option value="unstable">Unstable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transportation Mode
                      </label>
                      <select
                        name="transportation_mode"
                        value={formData.transportation_mode}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ambulance">Ambulance</option>
                        <option value="private_transport">Private Transport</option>
                        <option value="helicopter">Helicopter</option>
                        <option value="wheelchair">Wheelchair</option>
                        <option value="stretcher">Stretcher</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accompanies Patient
                      </label>
                      <input
                        type="text"
                        name="accompanies_patient"
                        value={formData.accompanies_patient}
                        onChange={handleFormChange}
                        placeholder="Family member, nurse, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Equipment Required
                      </label>
                      <input
                        type="text"
                        name="equipment_required"
                        value={formData.equipment_required}
                        onChange={handleFormChange}
                        placeholder="Oxygen, monitors, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Isolation Precautions
                      </label>
                      <input
                        type="text"
                        name="isolation_precautions"
                        value={formData.isolation_precautions}
                        onChange={handleFormChange}
                        placeholder="Contact, droplet, airborne, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Anticipated Care Level
                      </label>
                      <select
                        name="anticipated_care_level"
                        value={formData.anticipated_care_level}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select care level</option>
                        <option value="outpatient">Outpatient</option>
                        <option value="observation">Observation</option>
                        <option value="general_ward">General Ward</option>
                        <option value="icu">ICU</option>
                        <option value="ccu">CCU</option>
                        <option value="nicu">NICU</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      name="special_instructions"
                      value={formData.special_instructions}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="Any special instructions for care or transport"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Family Contact Name
                      </label>
                      <input
                        type="text"
                        name="family_contact_name"
                        value={formData.family_contact_name}
                        onChange={handleFormChange}
                        placeholder="Next of kin or emergency contact"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        name="family_contact_phone"
                        value={formData.family_contact_phone}
                        onChange={handleFormChange}
                        placeholder="Phone number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        name="family_contact_relationship"
                        value={formData.family_contact_relationship}
                        onChange={handleFormChange}
                        placeholder="Spouse, parent, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Information
                    </label>
                    <textarea
                      name="insurance_information"
                      value={formData.insurance_information}
                      onChange={handleFormChange}
                      rows={2}
                      placeholder="Insurance provider, policy number, coverage details"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={4}
                    placeholder="Any additional information relevant to the referral"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ></textarea>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={!formData.patient_id || !formData.reason_for_referral}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 border border-transparent rounded-xl text-sm font-normal text-black hover:shadow-lg hover:shadow-gray-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      Preview PDF
                    </button>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/${birthcare_Id}/referrals`)}
                      className="px-6 py-3 bg-gray-300 hover:bg-gray-400 border border-transparent rounded-xl text-sm font-normal text-black hover:shadow-lg hover:shadow-gray-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-300 hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-gradient-to-r from-[#ff6b6b] to-[#ff5252] border border-transparent rounded-xl text-sm font-normal text-white hover:shadow-lg hover:shadow-pink-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Referral...
                        </>
                      ) : (
                        'Create & Save Referral'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Referral PDF Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div ref={pdfRef} className="bg-white p-8 max-w-2xl mx-auto">
                {/* PDF Content Preview */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-4">PATIENT REFERRAL FORM</h1>
                </div>
                
                {/* Patient Info */}
                {formData.patient_id && (
                  <div className="mb-6">
                    <h2 className="text-lg font-bold mb-2">PATIENT INFORMATION</h2>
                    <div className="text-sm">
                      <p><strong>Name:</strong> {patients.find(p => p.id == formData.patient_id)?.first_name} {patients.find(p => p.id == formData.patient_id)?.middle_name || ''} {patients.find(p => p.id == formData.patient_id)?.last_name}</p>
                      {patients.find(p => p.id == formData.patient_id)?.date_of_birth && (
                        <p><strong>Date of Birth:</strong> {patients.find(p => p.id == formData.patient_id)?.date_of_birth}</p>
                      )}
                      {patients.find(p => p.id == formData.patient_id)?.phone_number && (
                        <p><strong>Phone:</strong> {patients.find(p => p.id == formData.patient_id)?.phone_number}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Referral Information */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-2">REFERRAL INFORMATION</h2>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <p><strong>Date:</strong> {formData.referral_date}</p>
                    <p><strong>Time:</strong> {formData.referral_time}</p>
                    <p><strong>Urgency:</strong> {formData.urgency_level?.toUpperCase()}</p>
                  </div>
                </div>
                
                {/* Facilities */}
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Referring Facility:</h3>
                  <div className="text-sm ml-4">
                    <p><strong>Facility:</strong> {formData.referring_facility}</p>
                    <p><strong>Physician:</strong> {formData.referring_physician}</p>
                    {formData.referring_physician_contact && (
                      <p><strong>Contact:</strong> {formData.referring_physician_contact}</p>
                    )}
                  </div>
                  
                  <h3 className="font-bold mb-2 mt-4">Receiving Facility:</h3>
                  <div className="text-sm ml-4">
                    <p><strong>Facility:</strong> {formData.receiving_facility}</p>
                    {formData.receiving_physician && (
                      <p><strong>Physician:</strong> {formData.receiving_physician}</p>
                    )}
                    {formData.receiving_physician_contact && (
                      <p><strong>Contact:</strong> {formData.receiving_physician_contact}</p>
                    )}
                  </div>
                </div>
                
                {/* Clinical Information */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-2">CLINICAL INFORMATION</h2>
                  
                  {formData.reason_for_referral && (
                    <div className="mb-3">
                      <p className="font-bold text-sm">Reason for Referral:</p>
                      <p className="text-sm">{formData.reason_for_referral}</p>
                    </div>
                  )}
                  
                  {formData.clinical_summary && (
                    <div className="mb-3">
                      <p className="font-bold text-sm">Clinical Summary:</p>
                      <p className="text-sm">{formData.clinical_summary}</p>
                    </div>
                  )}
                  
                  {formData.current_diagnosis && (
                    <div className="mb-3">
                      <p className="font-bold text-sm">Current Diagnosis:</p>
                      <p className="text-sm">{formData.current_diagnosis}</p>
                    </div>
                  )}
                  
                  {formData.vital_signs && (
                    <div className="mb-3">
                      <p className="font-bold text-sm">Vital Signs:</p>
                      <p className="text-sm">{formData.vital_signs}</p>
                    </div>
                  )}
                </div>
                
                {/* Transfer Details */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-2">TRANSFER DETAILS</h2>
                  <div className="text-sm">
                    {formData.patient_condition && (
                      <p><strong>Patient Condition:</strong> {formData.patient_condition}</p>
                    )}
                    <p><strong>Transportation:</strong> {formData.transportation_mode}</p>
                    {formData.special_instructions && (
                      <div className="mt-2">
                        <p className="font-bold">Special Instructions:</p>
                        <p>{formData.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Contact Information */}
                {formData.family_contact_name && (
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Emergency Contact:</h3>
                    <div className="text-sm">
                      <p><strong>Name:</strong> {formData.family_contact_name}</p>
                      {formData.family_contact_phone && (
                        <p><strong>Phone:</strong> {formData.family_contact_phone}</p>
                      )}
                      {formData.family_contact_relationship && (
                        <p><strong>Relationship:</strong> {formData.family_contact_relationship}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-8">
                  <p>Generated on: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 p-4 border-t">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateReferralPage;
