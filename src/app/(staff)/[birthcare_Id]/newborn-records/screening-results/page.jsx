'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'
import { useReactToPrint } from 'react-to-print'
import { saveNewbornScreeningAsPDF, downloadNewbornScreeningPDF } from '@/utils/pdfGenerator'
import SearchablePatientSelect from '@/components/SearchablePatientSelect'
import CustomDialog from '@/components/CustomDialog'

export default function NewbornScreeningResults() {
    const { user } = useAuth({ middleware: "auth" })
    const params = useParams()
    const birthcare_Id = params.birthcare_Id
    const [templateLoaded, setTemplateLoaded] = useState(false)
    const [birthCareInfo, setBirthCareInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [patients, setPatients] = useState([])
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null })
    const printRef = useRef()
    
    // Form state
    const [formData, setFormData] = useState({
        // Child information
        childName: '',
        dateOfBirth: '',
        sex: '',
        birthWeight: '',
        gestationalAge: '',
        screeningId: '',
        
        // Mother's information
        motherName: '',
        motherAge: '',
        address: '',
        phoneNumber: '',
        
        // Sample collection information (nested structure)
        sampleCollection: {
            ageAtCollection: '',
            quality: '',
            feedingStatus: '',
            method: '',
            collectorName: '',
            laboratory: ''
        },
        
        // Tests (array of 6 screening tests)
        tests: [
            { name: 'Congenital Hypothyroidism (CH)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
            { name: 'Congenital Adrenal Hyperplasia (CAH)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
            { name: 'Galactosemia (GAL)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
            { name: 'Phenylketonuria (PKU)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
            { name: 'Glucose-6-Phosphate Dehydrogenase Deficiency (G6PD)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
            { name: 'Maple Syrup Urine Disease (MSUD)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' }
        ],
        
        // Follow-up actions (nested structure)
        followUp: {
            actions: [],
            comments: ''
        },
        
        // Signatures
        signatures: {
            sampleCollector: '',
            labTechnician: '',
            attendingPhysician: user ? `${user.firstname} ${user.lastname}` : ''
        }
    })

    // Generate unique screening ID
    const generateScreeningId = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `NBS-${year}${month}${day}-${time}-${random}`
    }

    useEffect(() => {
        fetchBirthCareInfo()
        fetchPatients()
        // Auto-generate screening ID on component mount
        setFormData(prev => ({
            ...prev,
            screeningId: generateScreeningId(),
            signatures: {
                ...prev.signatures,
                attendingPhysician: user ? `${user.firstname} ${user.lastname}` : ''
            }
        }))
    }, [user])

    if (!user) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    // Authorization check
    if (
        user.system_role_id !== 2 &&
        (user.system_role_id !== 3 ||
            !user.permissions?.includes("manage_screening_results"))
    ) {
        return <div>Unauthorized</div>
    }

    const fetchBirthCareInfo = async () => {
        try {
            const response = await axios.get(`/api/birthcare/${birthcare_Id}`)
            // Handle multiple possible response shapes
            const facilityData = response.data.data || response.data
            setBirthCareInfo(facilityData)
        } catch (error) {
            console.error('Error fetching birth care info:', error)
        } finally {
            setLoading(false)
            setTemplateLoaded(true)
        }
    }

    const fetchPatients = async () => {
        try {
            let allPatients = []
            let currentPage = 1
            let hasMorePages = true
            
            // Keep fetching pages until we have all patients
            while (hasMorePages) {
                const response = await axios.get(`/api/birthcare/${birthcare_Id}/patients`, {
                    params: {
                        page: currentPage,
                        per_page: 50 // Reasonable page size
                    }
                })
                
                const pageData = response.data.data || response.data || []
                allPatients = [...allPatients, ...pageData]
                
                // Check if there are more pages
                const totalPages = response.data.last_page || response.data.meta?.last_page || 1
                hasMorePages = currentPage < totalPages
                currentPage++
                
                // Safety break to avoid infinite loops
                if (currentPage > 10) break
            }
            
            setPatients(allPatients)
        } catch (error) {
            console.error('Error fetching patients:', error)
        }
    }

    const handlePatientSelect = (patientId) => {
        if (!patientId) {
            setSelectedPatient(null)
            setFormData(prev => ({
                ...prev,
                childName: '',
                dateOfBirth: '',
                sex: '',
                motherName: '',
                motherAge: '',
                address: '',
                phoneNumber: ''
            }))
            return
        }
        
        const patient = patients.find(p => p.id === parseInt(patientId))
        setSelectedPatient(patient)
        
        // Auto-populate form with patient data (patient is the mother)
        if (patient) {
            setFormData(prev => ({
                ...prev,
                childName: '', // Keep child's name empty - patient is the mother
                dateOfBirth: '',
                sex: '',
                motherName: `${patient.first_name} ${patient.last_name}`,
                motherAge: patient.age || '',
                address: patient.address || '',
                phoneNumber: patient.contact_number || ''
            }))
        }
    }

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleTestChange = (testIndex, field, value) => {
        setFormData(prev => ({
            ...prev,
            tests: prev.tests.map((test, index) => 
                index === testIndex ? { ...test, [field]: value } : test
            )
        }))
    }

    const handleSampleCollectionChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            sampleCollection: {
                ...prev.sampleCollection,
                [field]: value
            }
        }))
    }

    const handleFollowUpActionChange = (action, checked) => {
        setFormData(prev => {
            const actions = checked 
                ? [...prev.followUp.actions, action]
                : prev.followUp.actions.filter(a => a !== action)
            return {
                ...prev,
                followUp: {
                    ...prev.followUp,
                    actions: actions
                }
            }
        })
    }

    // Print functionality
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Newborn_Screening_${formData.childName?.replace(/\s+/g, '_') || 'Record'}_${new Date().toISOString().split('T')[0]}`,
    })

    // PDF generation and save functionality
    const generatePDF = async () => {
        if (!selectedPatient) {
            setDialog({
                isOpen: true,
                type: 'warning',
                title: 'Patient Required',
                message: 'Please select a patient first before generating the PDF.',
                onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
            })
            return
        }

        try {
            // Generate PDF and save to patient documents
            const pdfData = await saveNewbornScreeningAsPDF(
                formData,
                birthcare_Id,
                selectedPatient.id,
                birthCareInfo
            )
            
            await axios.post(`/api/birthcare/${birthcare_Id}/patient-documents/from-data`, {
                patient_id: selectedPatient.id,
                title: pdfData.title,
                document_type: pdfData.document_type,
                content: pdfData.base64PDF,
                metadata: pdfData.metadata,
            })
            
            setDialog({
                isOpen: true,
                type: 'success',
                title: 'Success!',
                message: 'Newborn screening record PDF generated and saved to patient documents successfully!',
                onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
            })
            
        } catch (error) {
            console.error('Error generating PDF:', error)
            setDialog({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Error generating PDF. Please try again.',
                onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
            })
        }
    }

    // Preview PDF function
    const handlePreviewPDF = () => {
        if (!selectedPatient) {
            setDialog({
                isOpen: true,
                type: 'warning',
                title: 'Patient Required',
                message: 'Please select a patient first before previewing the PDF.',
                onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
            })
            return
        }
        
        try {
            downloadNewbornScreeningPDF(formData, birthCareInfo)
        } catch (error) {
            console.error('Error generating PDF preview:', error)
            setDialog({
                isOpen: true,
                type: 'error',
                title: 'Preview Failed',
                message: 'Failed to generate PDF preview. Please try again.',
                onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
            })
        }
    }

    const fillSampleData = () => {
        // Sample values used only where fields are empty
        const sample = {
            childName: 'Baby Doe',
            dateOfBirth: '2024-09-20',
            sex: 'male',
            birthWeight: '3200',
            gestationalAge: '38',
            screeningId: generateScreeningId(),
            motherName: 'Jane Doe',
            motherAge: '28',
            address: 'Buhangin District, Davao City',
            phoneNumber: '09123456789',
            ageAtCollection: '48',
            sampleQuality: 'adequate',
            feedingStatus: 'breastfeeding',
            collectionMethod: 'heel-stick',
            collectorName: 'Maria Santos, RN',
            laboratory: 'Davao Medical Center Laboratory',
            tests: [
                { name: 'Congenital Hypothyroidism (CH)', sampleTaken: true,  dateCollected: '2024-09-22', timeCollected: '08:30', result: 'normal',  dateReported: '2024-09-23' },
                { name: 'Congenital Adrenal Hyperplasia (CAH)', sampleTaken: true,  dateCollected: '2024-09-22', timeCollected: '08:30', result: 'normal',  dateReported: '2024-09-23' },
                { name: 'Galactosemia (GAL)',               sampleTaken: true,  dateCollected: '2024-09-22', timeCollected: '08:30', result: 'normal',  dateReported: '2024-09-23' },
                { name: 'Phenylketonuria (PKU)',            sampleTaken: true,  dateCollected: '2024-09-22', timeCollected: '08:30', result: 'normal',  dateReported: '2024-09-23' },
                { name: 'Glucose-6-Phosphate Dehydrogenase Deficiency (G6PD)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
                { name: 'Maple Syrup Urine Disease (MSUD)',                     sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' }
            ],
            followUpActions: ['No action required - all tests normal'],
            comments: 'All screening tests completed successfully. No abnormal findings detected. Follow standard newborn care protocol.'
        }

        setFormData(prev => ({
            ...prev,
            // Child information
            childName: prev.childName || sample.childName,
            dateOfBirth: prev.dateOfBirth || sample.dateOfBirth,
            sex: prev.sex || sample.sex,
            birthWeight: prev.birthWeight || sample.birthWeight,
            gestationalAge: prev.gestationalAge || sample.gestationalAge,
            screeningId: prev.screeningId || sample.screeningId,

            // Mother's information
            motherName: prev.motherName || sample.motherName,
            motherAge: prev.motherAge || sample.motherAge,
            address: prev.address || sample.address,
            phoneNumber: prev.phoneNumber || sample.phoneNumber,

            // Sample collection information (nested structure)
            sampleCollection: {
                ageAtCollection: prev.sampleCollection.ageAtCollection || sample.ageAtCollection,
                quality: prev.sampleCollection.quality || sample.sampleQuality,
                feedingStatus: prev.sampleCollection.feedingStatus || sample.feedingStatus,
                method: prev.sampleCollection.method || sample.collectionMethod,
                collectorName: prev.sampleCollection.collectorName || sample.collectorName,
                laboratory: prev.sampleCollection.laboratory || sample.laboratory
            },

            // Tests: fill only empty fields per test
            tests: (prev.tests && prev.tests.length ? prev.tests : sample.tests).map((t, i) => {
                const s = sample.tests[i] || {}
                return {
                    name: t?.name || s.name,
                    sampleTaken: typeof t?.sampleTaken === 'boolean' ? t.sampleTaken : (s.sampleTaken ?? false),
                    dateCollected: t?.dateCollected || s.dateCollected || '',
                    timeCollected: t?.timeCollected || s.timeCollected || '',
                    result: t?.result || s.result || '',
                    dateReported: t?.dateReported || s.dateReported || ''
                }
            }),

            // Follow-up actions and comments (nested structure)
            followUp: {
                actions: (prev.followUp.actions && prev.followUp.actions.length) ? prev.followUp.actions : sample.followUpActions,
                comments: prev.followUp.comments || sample.comments
            }
        }))
    }

    return (
        <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
            <CustomDialog
                isOpen={dialog.isOpen}
                onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={dialog.onConfirm}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">NEWBORN SCREENING RESULTS</h1>
                            <p className="text-sm text-gray-900 mt-1 font-medium">Record and manage newborn screening test results</p>
                        </div>
                    </div>
                </div>

                {/* Patient Selection */}
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Select Patient Name</label>
                            <SearchablePatientSelect
                                patients={patients}
                                value={selectedPatient?.id || ''}
                                onChange={handlePatientSelect}
                                placeholder="Search and select patient..."
                                onOpen={fetchPatients}
                                className="focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={fillSampleData}
                                className="px-4 py-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] border border-transparent rounded-xl text-sm font-medium text-white hover:shadow-lg hover:shadow-[#BF3853]/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853] transition-all duration-300 hover:scale-105"
                            >
                                Fill Sample Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* Newborn Screening Form */}
                <div id="newborn-screening-form" className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="p-6">
                        {/* Form Header */}
                        <div className="mb-6 border-b border-gray-200 pb-4">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">Newborn Screening Information</h2>
                                <p className="text-gray-600 mt-1">
                                    Complete the form below to create a new screening record
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Left Column - Child Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">
                                    Child Information
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Child's Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter child's full name"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                            value={formData.childName}
                                            onChange={(e) => handleFormChange('childName', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                            <input
                                                type="date"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                value={formData.dateOfBirth}
                                                onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                                            <select
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                value={formData.sex}
                                                onChange={(e) => handleFormChange('sex', e.target.value)}
                                            >
                                                <option value="">Select Sex</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Weight (grams)</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 3250"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                value={formData.birthWeight}
                                                onChange={(e) => handleFormChange('birthWeight', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Gestational Age (weeks)</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 38"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                value={formData.gestationalAge}
                                                onChange={(e) => handleFormChange('gestationalAge', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Screening ID</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                            placeholder="Auto-generated screening ID"
                                            value={formData.screeningId}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Column - Mother's Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">
                                    Mother's Information
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter mother's full name"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                            value={formData.motherName}
                                            onChange={(e) => handleFormChange('motherName', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                            <input
                                                type="number"
                                                placeholder="Age in years"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                value={formData.motherAge}
                                                onChange={(e) => handleFormChange('motherAge', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                placeholder="Contact number"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                value={formData.phoneNumber}
                                                onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <textarea
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                            rows="3"
                                            placeholder="Complete address..."
                                            value={formData.address}
                                            onChange={(e) => handleFormChange('address', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Screening Tests Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">Newborn Screening Tests</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">
                                            Screening Test
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">
                                            Sample Taken
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">
                                            Date Collected
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">
                                            Time Collected
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-[#E56D85]/30">
                                            Result
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">
                                            Date Reported
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {formData.tests.map((test, index) => (
                                        <tr key={index} className="border-b border-white/30 hover:bg-[#FDB3C2]/10 transition-all duration-200">
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 border-r border-white/30">
                                                {test.name}
                                            </td>
                                            <td className="px-2 py-4 text-center border-r border-white/30">
                                                <input 
                                                    type="checkbox" 
                                                    checked={test.sampleTaken}
                                                    onChange={(e) => handleTestChange(index, 'sampleTaken', e.target.checked)}
                                                    className="w-4 h-4 text-[#BF3853] focus:ring-[#BF3853] border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="px-2 py-4 border-r border-white/30">
                                                <input 
                                                    type="date" 
                                                    value={test.dateCollected}
                                                    onChange={(e) => handleTestChange(index, 'dateCollected', e.target.value)}
                                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#BF3853] focus:border-transparent" 
                                                />
                                            </td>
                                            <td className="px-2 py-4 border-r border-white/30">
                                                <input 
                                                    type="time" 
                                                    value={test.timeCollected}
                                                    onChange={(e) => handleTestChange(index, 'timeCollected', e.target.value)}
                                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#BF3853] focus:border-transparent" 
                                                />
                                            </td>
                                            <td className="px-2 py-4 border-r border-white/30">
                                                <select 
                                                    value={test.result}
                                                    onChange={(e) => handleTestChange(index, 'result', e.target.value)}
                                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#BF3853] focus:border-transparent"
                                                >
                                                    <option value="">--</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="abnormal">Abnormal</option>
                                                    <option value="pending">Pending</option>
                                                    <option value="repeat">Repeat Required</option>
                                                </select>
                                            </td>
                                            <td className="px-2 py-4">
                                                <input 
                                                    type="date" 
                                                    value={test.dateReported}
                                                    onChange={(e) => handleTestChange(index, 'dateReported', e.target.value)}
                                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#BF3853] focus:border-transparent" 
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sample Collection Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">Sample Collection Information</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Age at Collection</label>
                                    <input
                                        type="text"
                                        value={formData.sampleCollection.ageAtCollection}
                                        onChange={(e) => handleSampleCollectionChange('ageAtCollection', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                        placeholder="Hours after birth"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sample Quality</label>
                                    <select 
                                        value={formData.sampleCollection.quality}
                                        onChange={(e) => handleSampleCollectionChange('quality', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                    >
                                        <option value="">Select Quality</option>
                                        <option value="adequate">Adequate</option>
                                        <option value="inadequate">Inadequate</option>
                                        <option value="contaminated">Contaminated</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Feeding Status</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input 
                                                type="radio" 
                                                name="feeding" 
                                                value="breastfeeding"
                                                checked={formData.sampleCollection.feedingStatus === 'breastfeeding'}
                                                onChange={(e) => handleSampleCollectionChange('feedingStatus', e.target.value)}
                                                className="mr-2 text-[#BF3853] focus:ring-[#BF3853]" 
                                            />
                                            Breastfeeding
                                        </label>
                                        <label className="flex items-center">
                                            <input 
                                                type="radio" 
                                                name="feeding" 
                                                value="formula"
                                                checked={formData.sampleCollection.feedingStatus === 'formula'}
                                                onChange={(e) => handleSampleCollectionChange('feedingStatus', e.target.value)}
                                                className="mr-2 text-[#BF3853] focus:ring-[#BF3853]" 
                                            />
                                            Formula Feeding
                                        </label>
                                        <label className="flex items-center">
                                            <input 
                                                type="radio" 
                                                name="feeding" 
                                                value="mixed"
                                                checked={formData.sampleCollection.feedingStatus === 'mixed'}
                                                onChange={(e) => handleSampleCollectionChange('feedingStatus', e.target.value)}
                                                className="mr-2 text-[#BF3853] focus:ring-[#BF3853]" 
                                            />
                                            Mixed Feeding
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Collection Method</label>
                                    <select 
                                        value={formData.sampleCollection.method}
                                        onChange={(e) => handleSampleCollectionChange('method', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                    >
                                        <option value="">Select Method</option>
                                        <option value="heel-stick">Heel Stick</option>
                                        <option value="venipuncture">Venipuncture</option>
                                        <option value="cord-blood">Cord Blood</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Collector's Name</label>
                                    <input
                                        type="text"
                                        value={formData.sampleCollection.collectorName}
                                        onChange={(e) => handleSampleCollectionChange('collectorName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                        placeholder="Name of sample collector"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Laboratory</label>
                                    <input
                                        type="text"
                                        value={formData.sampleCollection.laboratory}
                                        onChange={(e) => handleSampleCollectionChange('laboratory', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                        placeholder="Laboratory name"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Follow-up Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-2">Follow-up Actions</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Action Required</label>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.followUp.actions.includes('no-action')}
                                            onChange={(e) => handleFollowUpActionChange('no-action', e.target.checked)}
                                            className="w-4 h-4 text-[#BF3853] focus:ring-[#BF3853] border-gray-300 rounded mr-3" 
                                        />
                                        No action required - all tests normal
                                    </label>
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.followUp.actions.includes('repeat-screening')}
                                            onChange={(e) => handleFollowUpActionChange('repeat-screening', e.target.checked)}
                                            className="w-4 h-4 text-[#BF3853] focus:ring-[#BF3853] border-gray-300 rounded mr-3" 
                                        />
                                        Repeat screening recommended
                                    </label>
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.followUp.actions.includes('refer-specialist')}
                                            onChange={(e) => handleFollowUpActionChange('refer-specialist', e.target.checked)}
                                            className="w-4 h-4 text-[#BF3853] focus:ring-[#BF3853] border-gray-300 rounded mr-3" 
                                        />
                                        Refer to specialist for further evaluation
                                    </label>
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.followUp.actions.includes('immediate-treatment')}
                                            onChange={(e) => handleFollowUpActionChange('immediate-treatment', e.target.checked)}
                                            className="w-4 h-4 text-[#BF3853] focus:ring-[#BF3853] border-gray-300 rounded mr-3" 
                                        />
                                        Start immediate treatment
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Comments</label>
                                <textarea
                                    rows={4}
                                    value={formData.followUp.comments}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        followUp: {
                                            ...prev.followUp,
                                            comments: e.target.value
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                    placeholder="Additional notes, recommendations, or observations..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signature Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6">
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <div className="text-center">
                                        <input
                                            type="text"
                                            value={formData.signatures?.sampleCollector || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                signatures: {
                                                    ...prev.signatures,
                                                    sampleCollector: e.target.value
                                                }
                                            }))}
                                            className="w-64 mb-2 h-8 mx-auto border-b border-gray-400 focus:outline-none focus:border-[#BF3853] text-center"
                                            placeholder="Enter name"
                                        />
                                        <p className="text-xs text-gray-500">Sample Collector</p>
                                        <p className="text-xs text-gray-500">Name and Signature</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-center">
                                        <input
                                            type="text"
                                            value={formData.signatures?.labTechnician || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                signatures: {
                                                    ...prev.signatures,
                                                    labTechnician: e.target.value
                                                }
                                            }))}
                                            className="w-64 mb-2 h-8 mx-auto border-b border-gray-400 focus:outline-none focus:border-[#BF3853] text-center"
                                            placeholder="Enter name"
                                        />
                                        <p className="text-xs text-gray-500">Laboratory Technician</p>
                                        <p className="text-xs text-gray-500">Name and Signature</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-center">
                                        <input
                                            type="text"
                                            value={formData.signatures?.attendingPhysician || ''}
                                            readOnly
                                            className="w-64 mb-2 h-8 mx-auto border-b border-gray-400 bg-gray-50 text-center text-gray-700 cursor-not-allowed"
                                            placeholder="Auto-filled"
                                        />
                                        <p className="text-xs text-gray-500">Attending Physician</p>
                                        <p className="text-xs text-gray-500">Name and Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handlePreviewPDF}
                                disabled={!selectedPatient}
                                className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="flex items-center">
                                    Preview PDF
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={generatePDF}
                                disabled={!selectedPatient}
                                className="px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:from-[#A41F39] hover:to-[#8B1D36] border border-transparent rounded-lg text-sm font-semibold text-white hover:shadow-lg hover:shadow-[#BF3853]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="flex items-center">
                                    Save to Documents
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
