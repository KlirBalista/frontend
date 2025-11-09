"use client";
import { useAuth } from "@/hooks/auth";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Search,
  UserPlus,
  Edit,
  Trash2,
  FileText,
  Edit3,
  Edit3Icon
} from "lucide-react";
import axios from '@/lib/axios';
import PatientChartModal from '@/components/PatientChartModal';
import CustomDialog from '@/components/CustomDialog';

const PatientChartPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  const router = useRouter();
  
  const [patientCharts, setPatientCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  // Fetch all patient charts
  const fetchPatientCharts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [chartsResponse, admissionsResponse] = await Promise.all([
        axios.get(`/api/birthcare/${birthcare_Id}/patient-charts`),
        axios.get(`/api/birthcare/${birthcare_Id}/patient-admissions`)
      ]);
      
      const charts = chartsResponse.data.data || chartsResponse.data || [];
      const admissions = admissionsResponse.data.data || admissionsResponse.data || [];
      
      const transformedCharts = charts.map(chart => {
        const patientNameFromForm = chart.patient_info?.patientName;
        const patientNameFromDB = `${chart.patient?.first_name || ''} ${chart.patient?.middle_name ? chart.patient?.middle_name + ' ' : ''}${chart.patient?.last_name || ''}`.trim();
        const finalPatientName = patientNameFromForm || patientNameFromDB || 'Unknown Patient';
        
        const admission = admissions.find(adm => adm.patient_id === chart.patient_id);
        const admissionStatus = admission ? admission.status : 'Unknown';
        
        return {
          id: chart.id,
          patientName: finalPatientName,
          createdDate: chart.created_at
            ? new Date(chart.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'N/A',
          status: admissionStatus,
          patient_id: chart.patient_id
        };
      });
      
      setPatientCharts(transformedCharts.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)));
    } catch (err) {
      console.error('Error fetching patient charts:', err);
      setError('Failed to load patient charts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPatientCharts();
    }
  }, [user, birthcare_Id]);

  const handleCreateChart = () => {
    setEditingChart(null);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingChart(null);
  };
  
  const handleSubmitChart = async (formData) => {
    try {
      // Transform flat form data into structured format that backend expects
      const structuredData = {
        patient_id: formData.patient_id,
        patient_info: {
          patientId: formData.patient_id,
          patientName: formData.name,
          age: formData.age,
          address: formData.address,
          contactNumber: formData.contactNumber,
          gravida: formData.gravida,
          para: formData.para,
          edd: formData.edd,
          roomNumber: formData.roomNumber,
          bedNumber: formData.bedNumber,
          admissionDateTime: formData.admissionDateTime,
          attendingMidwife: formData.attendingMidwife
        },
        medical_history: {
          allergies: formData.allergies,
          pastIllnesses: formData.pastIllnesses,
          previousPregnancies: formData.previousPregnancies,
          lmp: formData.lmp,
          prenatalCheckups: formData.prenatalCheckups,
          supplements: formData.supplements
        },
        admission_assessment: {
          bloodPressure: formData.bloodPressure,
          heartRate: formData.heartRate,
          respiratoryRate: formData.respiratoryRate,
          temperature: formData.temperature,
          fetalHeartRate: formData.fetalHeartRate,
          cervicalDilatation: formData.cervicalDilatation,
          membranes: formData.membranes,
          presentingPart: formData.presentingPart,
          admissionDiagnosis: formData.admissionDiagnosis
        },
        postpartum_info: {
          deliveryDateTime: formData.deliveryDateTime,
          deliveryType: formData.deliveryType,
          perinealCondition: formData.perinealCondition,
          estimatedBloodLoss: formData.estimatedBloodLoss,
          fundus: formData.fundus,
          lochia: formData.lochia,
          postpartumBP: formData.postpartumBP,
          postpartumPulse: formData.postpartumPulse,
          postpartumTemp: formData.postpartumTemp,
          painLevel: formData.painLevel,
          breastfeedingInitiated: formData.breastfeedingInitiated
        },
        baby_info: {
          babySex: formData.babySex,
          birthWeight: formData.birthWeight,
          apgarScores: formData.apgarScores,
          initialCry: formData.initialCry,
          cordCare: formData.cordCare,
          vitaminK: formData.vitaminK,
          eyeOintment: formData.eyeOintment,
          babyBreastfeeding: formData.babyBreastfeeding,
          complications: formData.complications
        },
        discharge_summary: {
          finalDiagnosis: formData.finalDiagnosis,
          motherCondition: formData.motherCondition,
          babyCondition: formData.babyCondition,
          dischargeInstructions: formData.dischargeInstructions,
          dischargeMidwife: formData.dischargeMidwife,
          dischargeDateTime: formData.dischargeDateTime
        }
      };
      
      console.log('💾 Submitting structured data:', structuredData);
      
      if (editingChart) {
        // Update existing chart
        await axios.put(`/api/birthcare/${birthcare_Id}/patient-charts/${editingChart.id}`, structuredData);
        setShowModal(false);
        setEditingChart(null);
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Patient chart updated successfully!',
          onConfirm: () => {
            setDialog({ ...dialog, isOpen: false });
            fetchPatientCharts();
          }
        });
      } else {
        // Create new chart
        await axios.post(`/api/birthcare/${birthcare_Id}/patient-charts`, structuredData);
        setShowModal(false);
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Patient chart created successfully!',
          onConfirm: () => {
            setDialog({ ...dialog, isOpen: false });
            fetchPatientCharts();
          }
        });
      }
    } catch (error) {
      console.error('Failed to save chart:', error);
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to ${editingChart ? 'update' : 'create'} chart: ` + error.message,
        onConfirm: () => setDialog({ ...dialog, isOpen: false })
      });
    }
  };
  
  const handleEditChart = async (chart) => {
    try {
      // Fetch the full chart data
      console.log('🔄 Fetching chart data for ID:', chart.id);
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/patient-charts/${chart.id}`);
      const chartData = response.data.data || response.data;
      console.log('📥 Received chart data:', chartData);
      
      setEditingChart(chartData);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to fetch chart details:', error);
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load chart details: ' + error.message,
        onConfirm: () => setDialog({ ...dialog, isOpen: false })
      });
    }
  };

  const handleDeleteChart = (chart) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete the patient chart for "${chart.patientName}"?`,
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setDialog({ ...dialog, isOpen: false });
        try {
          await axios.delete(`/api/birthcare/${birthcare_Id}/patient-charts/${chart.id}`);
          setDialog({
            isOpen: true,
            type: 'success',
            title: 'Deleted!',
            message: 'Patient chart deleted successfully!',
            onConfirm: () => {
              setDialog({ ...dialog, isOpen: false });
              fetchPatientCharts();
            }
          });
        } catch (error) {
          console.error('Delete failed:', error);
          setDialog({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to delete chart: ' + error.message,
            onConfirm: () => setDialog({ ...dialog, isOpen: false })
          });
        }
      }
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'admitted':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in labor':
        return 'bg-red-100 text-red-800';
      case 'discharged':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Filter charts based on search
  const filteredCharts = patientCharts.filter(chart =>
    chart.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      !user.permissions?.includes("manage_patient_chart"))
  ) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
      <CustomDialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        showCancel={dialog.showCancel}
      />
      
      <PatientChartModal 
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitChart}
        editData={editingChart}
        isEditMode={!!editingChart}
      />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">PATIENT CHART</h1>
                <p className="text-sm text-gray-900 mt-1 font-medium">Manage and View All Patient Charts</p>
              </div>
              <button
                onClick={handleCreateChart}
                className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
              >
                <UserPlus size={20} />
                <span>Create Chart</span>
              </button>
            </div>
          </div>

        {/* Search Bar */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent transition-all duration-200 bg-white"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[#BF3853] font-medium">
            {filteredCharts.length} {filteredCharts.length === 1 ? 'chart' : 'charts'}
          </p>
          <p className="text-sm text-gray-600">
            Page 1 of 1
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
              <p className="mt-4 text-gray-700 font-semibold">Loading patient charts...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">NO.</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">PATIENT NAME</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">DATE CREATED</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">STATUS</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCharts.length > 0 ? (
                    filteredCharts.map((chart, index) => (
                      <tr key={chart.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-center text-sm text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                          {chart.patientName}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">
                          {chart.createdDate}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(chart.status)}`}>
                            {chart.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEditChart(chart)}
                              className="p-2 bg-gradient-to-r from-[#E56D85] to-[#BF3853] hover:from-[#BF3853] hover:to-[#A41F39] text-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-lg"
                              title="Edit Chart"
                            >
                              <Edit3Icon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChart(chart)}
                              className="p-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#BF3853] text-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-lg"
                              title="Delete Chart"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-semibold text-gray-700">No Patient Charts</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchTerm ? 'No charts match your search.' : 'No patient charts have been created yet.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientChartPage;
