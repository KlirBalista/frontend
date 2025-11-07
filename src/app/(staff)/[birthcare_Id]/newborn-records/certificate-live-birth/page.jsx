'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth'
import { ChevronDown } from 'lucide-react'
import CustomDialog from '@/components/CustomDialog'

export default function CertificateLiveBirthPage() {
    const { user } = useAuth({ middleware: "auth" })
    const { birthcare_Id } = useParams()
    const searchParams = useSearchParams()
    const patientId = searchParams.get('patientId')
    const admissionId = searchParams.get('admissionId')

    const [formData, setFormData] = useState({
        certificate_number: '',
        // Child Information
        child_full_name: '',
        child_sex: '',
        birth_date: '',
        birth_time: '',
        birth_place: '',
        birth_city: '',
        birth_state: '',
        birth_country: 'Philippines',
        
        // Birth Details
        birth_weight: '',
        birth_length: '',
        gestational_age: '',
        birth_type: '',
        delivery_method: '',
        premature: false,
        complications: false,
        
        // Mother's Information
        mother_maiden_name: '',
        mother_current_name: '',
        mother_dob: '',
        mother_age: '',
        mother_birthplace: '',
        mother_nationality: '',
        mother_occupation: '',
        mother_address: '',
        
        // Father's Information
        father_name: '',
        father_dob: '',
        father_age: '',
        father_birthplace: '',
        father_nationality: '',
        father_occupation: '',
        father_address: '',
        
        // Marriage Information
        marriage_date: '',
        marriage_place: '',
        legitimate: false,
        acknowledged: false,
        
        // Medical Attendant
        attendant_name: '',
        attendant_title: '',
        attendant_license: '',
        facility_name: '',
        facility_address: '',
        
        // Informant
        informant_name: '',
        informant_relationship: '',
        informant_address: '',

        // Registration Details
        registration_date: '',
        registrar_name: '',
        registration_number: ''
    })

    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [facility, setFacility] = useState(null)
    const [loadingFacility, setLoadingFacility] = useState(true)
    const [showSuccess, setShowSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [showError, setShowError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    // Patient selection state
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [patients, setPatients] = useState([])
    const [filteredPatients, setFilteredPatients] = useState([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [loadingPatients, setLoadingPatients] = useState(false)

    // Fetch facility data
    useEffect(() => {
        const fetchFacility = async () => {
            try {
                console.log('Fetching facility data for:', birthcare_Id)
                const response = await axios.get(`/api/birthcare/${birthcare_Id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
                })
                console.log('Facility response:', response.data)
                // Handle multiple possible response shapes
                const facilityData = response.data.data || response.data
                setFacility(facilityData)
                console.log('Set facility data:', facilityData)
                
                // Update form data with facility info
                setFormData(prev => ({
                    ...prev,
                    birth_place: facilityData.name || '',
                    birth_city: facilityData.city || '',
                    birth_state: facilityData.state || 'Philippines',
                    facility_name: facilityData.name || '',
                    facility_address: facilityData.address || ''
                }))
            } catch (error) {
                console.error("Error fetching facility:", error)
            } finally {
                setLoadingFacility(false)
            }
        }

        if (birthcare_Id) {
            fetchFacility()
            generateCertificateNumber()
        }
    }, [birthcare_Id])

    // Fetch patients for dropdown
    useEffect(() => {
        const fetchPatients = async () => {
            setLoadingPatients(true)
            try {
                const response = await axios.get(`/api/birthcare/${birthcare_Id}/patients`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
                })
                const patientsData = response.data?.data || response.data || []
                setPatients(patientsData)
                setFilteredPatients(patientsData)
            } catch (error) {
                console.error('Error fetching patients:', error)
            } finally {
                setLoadingPatients(false)
            }
        }
        if (birthcare_Id) fetchPatients()
    }, [birthcare_Id])

    // Auto-select from query param
    useEffect(() => {
        if (!patientId || patients.length === 0) return
        const match = patients.find(p => String(p.id) === String(patientId))
        if (match) {
            const fullName = `${match.first_name || ''} ${match.middle_name || ''} ${match.last_name || ''}`.trim()
            setSelectedPatient(match)
            setSearchTerm(fullName)
        }
    }, [patientId, patients])

    // Filter patients by search term
    useEffect(() => {
        if (!searchTerm) {
            setFilteredPatients(patients)
        } else {
            const term = searchTerm.toLowerCase()
            setFilteredPatients(
                patients.filter(p =>
                    `${p.first_name || ''} ${p.middle_name || ''} ${p.last_name || ''}`
                        .toLowerCase()
                        .includes(term)
                )
            )
        }
    }, [searchTerm, patients])

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest?.('.patient-dropdown')) setShowDropdown(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

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
            !user.permissions?.includes("manage_certificate_live_birth"))
    ) {
        return <div>Unauthorized</div>
    }

    const generateCertificateNumber = () => {
        const timestamp = new Date().getTime().toString().slice(-8)
        const random = Math.random().toString(36).substring(2, 6).toUpperCase()
        const registrationTimestamp = new Date().getTime().toString().slice(-8)
        const registrationRandom = Math.random().toString(36).substring(2, 6).toUpperCase()
        setFormData(prev => ({
            ...prev,
            certificate_number: `CLB-${timestamp}-${random}`,
            registration_number: `REG-${registrationTimestamp}-${registrationRandom}`
        }))
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }))
        }
    }

    const validateForm = () => {
        const requiredFields = [
            'child_full_name', 'child_sex', 'birth_date', 'birth_time',
            'birth_place', 'mother_maiden_name', 'mother_current_name',
            'registration_number', 'registrar_name'
        ]
        
        const newErrors = {}
        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                newErrors[field] = 'This field is required'
            }
        })
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Removed unused generatePDFFromHTML function

    const handleSave = async () => {
        if (!validateForm()) return
        if (!selectedPatient?.id) {
            setErrorMessage('Please select a patient before saving to Patient Documents.')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
            return
        }

        setIsLoading(true)
        try {
            // Use jsPDF directly like other forms in the system
            const doc = new jsPDF('p', 'mm', 'a4')
            const pageWidth = doc.internal.pageSize.getWidth()
            const margin = 20
            
            // Helper function to draw field with underline
            const drawField = (x, y, width, label, value) => {
                doc.setFontSize(9)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(0, 0, 0)
                doc.text(`${label}:`, x, y)
                
                const labelWidth = doc.getTextWidth(`${label}: `)
                doc.line(x + labelWidth, y + 1, x + width, y + 1)
                
                if (value && value !== '') {
                    doc.text(String(value), x + labelWidth + 2, y - 1)
                }
            }
            
            const drawTwoColumns = (yPos, leftLabel, leftValue, rightLabel, rightValue) => {
                const colWidth = 80
                drawField(margin, yPos, colWidth, leftLabel, leftValue)
                drawField(margin + 90, yPos, colWidth, rightLabel, rightValue)
                return yPos + 8
            }
            
            const drawFullWidth = (yPos, label, value) => {
                drawField(margin, yPos, pageWidth - (margin * 2), label, value)
                return yPos + 8
            }
            
            const drawSectionHeader = (title, yPos) => {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(0, 0, 0)
                doc.text(title, margin, yPos)
                doc.setLineWidth(0.5)
                doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)
                return yPos + 10
            }
            
            // Official Header - Matching pdfGenerator.js style
            let yPos = 20
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 0, 0)
            doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' })
            yPos += 6
            
            doc.setFontSize(12)
            doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPos, { align: 'center' })
            yPos += 6
            
            const facilityName = facility?.name?.toUpperCase() || 'BIRTH CARE FACILITY'
            doc.setFontSize(10)
            doc.text(facilityName, pageWidth / 2, yPos, { align: 'center' })
            yPos += 5
            
            const address = facility?.description || facility?.address || 'Health Care Services'
            doc.setFontSize(8)
            doc.text(address, pageWidth / 2, yPos, { align: 'center' })
            yPos += 12
            
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('CERTIFICATE OF LIVE BIRTH', pageWidth / 2, yPos, { align: 'center' })
            yPos += 15
            
            // Certificate Number
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.text(`Certificate No: ${formData.certificate_number}`, pageWidth - margin, yPos, { align: 'right' })
            yPos += 10
            
            // CHILD INFORMATION
            yPos = drawSectionHeader('CHILD INFORMATION', yPos)
            yPos = drawFullWidth(yPos, 'Full Name of Child', formData.child_full_name)
            yPos = drawTwoColumns(yPos, 'Sex', formData.child_sex, 'Type of Birth', formData.birth_type)
            yPos = drawTwoColumns(yPos, 'Date of Birth', formData.birth_date, 'Time of Birth', formData.birth_time)
            yPos = drawFullWidth(yPos, 'Place of Birth', `${formData.birth_place}, ${formData.birth_city}, ${formData.birth_state}`)
            yPos += 5
            
            // PARENTS' INFORMATION
            yPos = drawSectionHeader("PARENTS' INFORMATION", yPos)
            yPos = drawTwoColumns(yPos, "Mother's Current Name", formData.mother_current_name, "Mother's Maiden Name", formData.mother_maiden_name)
            yPos = drawTwoColumns(yPos, "Mother's Date of Birth", formData.mother_dob, "Mother's Address", formData.mother_address)
            yPos += 3
            yPos = drawTwoColumns(yPos, "Father's Full Name", formData.father_name, "Father's Date of Birth", formData.father_dob)
            yPos = drawFullWidth(yPos, "Father's Address", formData.father_address)
            yPos += 5
            
            // REGISTRATION DETAILS
            yPos = drawSectionHeader('REGISTRATION DETAILS', yPos)
            yPos = drawTwoColumns(yPos, 'Registration Date', formData.registration_date, 'Registration Number', formData.registration_number)
            yPos = drawFullWidth(yPos, "Registrar's Name", formData.registrar_name)
            yPos += 15
            
            // Signatures
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            
            // Left signature line
            const leftLineStart = margin
            const leftLineEnd = margin + 70
            doc.line(leftLineStart, yPos, leftLineEnd, yPos)
            
            // Right signature line
            const rightLineStart = pageWidth - margin - 70
            const rightLineEnd = pageWidth - margin
            doc.line(rightLineStart, yPos, rightLineEnd, yPos)
            
            yPos += 5
            
            // Text below lines (centered)
            doc.text('Attending Physician/Midwife', (leftLineStart + leftLineEnd) / 2, yPos, { align: 'center' })
            doc.text('Civil Registrar', (rightLineStart + rightLineEnd) / 2, yPos, { align: 'center' })
            
            yPos += 4
            doc.setFontSize(8)
            doc.text('Name and Signature', (leftLineStart + leftLineEnd) / 2, yPos, { align: 'center' })
            doc.text('Name and Signature', (rightLineStart + rightLineEnd) / 2, yPos, { align: 'center' })
            
            // Convert PDF to blob and base64
            const pdfBlob = doc.output('blob')
            const base64PDF = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1] // Remove data:application/pdf;base64, prefix
                    resolve(base64)
                }
                reader.readAsDataURL(pdfBlob)
            })
            
            // Generate document title
            const childName = formData.child_full_name 
                ? formData.child_full_name.replace(/\s+/g, '_')
                : 'Certificate'
            const title = `Certificate_Live_Birth_${childName}_${formData.birth_date || new Date().toISOString().split('T')[0]}`
            
            // Prepare document data
            const documentData = {
                title: title,
                file_name: `${title}.pdf`,
                document_type: 'certificate_live_birth',
                file_content: base64PDF,
                metadata: {
                    certificate_number: formData.certificate_number,
                    registration_number: formData.registration_number,
                    registration_date: formData.registration_date,
                    registrar_name: formData.registrar_name,
                    child_name: formData.child_full_name,
                    birth_date: formData.birth_date,
                    birth_time: formData.birth_time,
                    sex: formData.child_sex,
                    birth_type: formData.birth_type,
                    mother_name: formData.mother_current_name || formData.mother_maiden_name,
                    father_name: formData.father_name,
                    birth_place: `${formData.birth_place}${formData.birth_city ? ', ' + formData.birth_city : ''}${formData.birth_state ? ', ' + formData.birth_state : ''}${formData.birth_country ? ', ' + formData.birth_country : ''}`,
                    generated_at: new Date().toISOString(),
                    form_data: formData
                }
            }
            
            // Save to patient documents
            const response = await axios.post(
                `/api/birthcare/${birthcare_Id}/patient-documents/from-data`, 
                {
                    patient_id: selectedPatient.id,
                    title: documentData.title,
                    document_type: documentData.document_type,
                    content: documentData.file_content,
                    metadata: documentData.metadata,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            )
            
            if (response.status === 201 || response.status === 200) {
                setSuccessMessage('Certificate of Live Birth saved successfully to patient documents!')
                setShowSuccess(true)
                
                // Hide success message after 3 seconds
                setTimeout(() => {
                    setShowSuccess(false)
                }, 3000)
            } else {
                throw new Error('Failed to save document')
            }
        } catch (error) {
            console.error('Error saving certificate:', error)
            let errorMsg = 'Error saving certificate. Please try again.'
            
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors
                const errorMessages = Object.values(errors).flat().join('\n')
                errorMsg = `Validation errors:\n${errorMessages}`
            } else if (error.response?.data?.message) {
                errorMsg = `Error: ${error.response.data.message}`
            } else if (error.message) {
                errorMsg = error.message
            }
            
            setErrorMessage(errorMsg)
            setShowError(true)
            
            // Auto-hide error message after 5 seconds
            setTimeout(() => {
                setShowError(false)
            }, 5000)
        } finally {
            setIsLoading(false)
        }
    }
    
    const handlePrint = () => {
        // Ensure printable area exists
        const printArea = document.getElementById('print-area')
        if (!printArea) {
            setErrorMessage('Printable area not found. Please reload the page and try again.')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
            return
        }

        // Generate certificate title for printing
        const childName = formData.child_full_name || 'Certificate'
        const printTitle = `Certificate_of_Live_Birth_${childName.replace(/\s+/g, '_')}`

        // Close dropdowns/overlays that might block printing
        setShowDropdown(false)

        // Update document title for print job name
        const originalTitle = document.title
        document.title = printTitle

        try {
            // Give the browser a moment to apply any style changes before printing
            requestAnimationFrame(() => {
                setTimeout(() => {
                    window.print()
                    // Restore original title after print
                    document.title = originalTitle
                }, 50)
            })
        } catch (err) {
            // Restore title and show error
            document.title = originalTitle
            setErrorMessage('Failed to open the print dialog. Please try again or export as PDF instead.')
            setShowError(true)
            setTimeout(() => setShowError(false), 3000)
        }
    }

    if (loadingFacility) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading facility information...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
            {/* Success Dialog */}
            <CustomDialog
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title="Success!"
                message={successMessage}
                type="success"
                confirmText="OK"
            />

            {/* Error Dialog */}
            <CustomDialog
                isOpen={showError}
                onClose={() => setShowError(false)}
                title="Error"
                message={errorMessage}
                type="error"
                confirmText="OK"
            />

            <div id="print-area" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">
                {/* Header Section */}
                <div className="mb-8 print:hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">CERTIFICATE OF LIVE BIRTH</h1>
                            <p className="text-sm text-gray-900 mt-1 font-medium">Generate and record official birth certificates for newborns</p>
                        </div>
                    </div>
                </div>

                {/* Print-only header */}
                <div className="hidden print:block bg-white rounded-xl shadow-sm border border-gray-200 mb-6 print:shadow-none print:border-black print:rounded-none">
                    <div className="p-8 text-center border-b border-gray-200 print:p-4 print:border-black">
                        <h1 className="text-lg font-bold text-gray-900 mb-1 print:text-black">
                            {facility?.name?.toUpperCase() || 'BIRTH CARE FACILITY'}
                        </h1>
                        <p className="text-sm text-gray-600 mb-4 print:text-black">
                            {facility?.description || 'Loading facility address...'}
                        </p>
                        <div className="border-t border-b border-gray-300 py-3 print:border-black">
                            <h2 className="text-xl font-bold text-gray-900 print:text-black">CERTIFICATE OF LIVE BIRTH</h2>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="space-y-6">
                    {/* Section 1: Patient Search */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">Patient Selection</h2>
                        <div className="patient-dropdown">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true) }}
                                    onFocus={() => setShowDropdown(true)}
                                    placeholder="Search and select patient..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                />
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                {showDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {loadingPatients ? (
                                            <div className="p-4 text-center text-gray-500">Loading patients...</div>
                                        ) : filteredPatients.length > 0 ? (
                                            filteredPatients.map((p) => {
                                                const full = `${p.first_name || ''} ${p.middle_name || ''} ${p.last_name || ''}`.trim()
                                                return (
                                                    <div key={p.id} onClick={() => { setSelectedPatient(p); setSearchTerm(full); setShowDropdown(false) }} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                                                        <div className="font-medium text-gray-900">{full}</div>
                                                        <div className="text-sm text-gray-500">ID: {p.id} • {p.phone || 'No phone'}</div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">{searchTerm ? 'No patients found' : 'Start typing to search patients'}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                        {/* Print-only version with actual values */}
                        <div className="hidden print:block" id="print-certificate-content">
                            <div className="space-y-4">
                                {/* Certificate Number */}
                                <div className="text-right mb-4">
                                    <span className="font-semibold">Certificate No: {formData.certificate_number}</span>
                                </div>

                                {/* Child Information */}
                                <div>
                                    <h3 className="text-lg font-medium mb-4 border-b border-black pb-1">Child Information</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="col-span-4">
                                                <div className="flex">
                                                    <span className="font-semibold w-32">Full Name:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.child_full_name || '_'.repeat(40)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-20">Sex:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.child_sex || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-24">Birth Date:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.birth_date || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-24">Birth Time:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.birth_time || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-32">Place of Birth:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.birth_place || '_'.repeat(25)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-24">City:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.birth_city || '_'.repeat(20)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-24">State:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.birth_state || '_'.repeat(20)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-24">Type of Birth:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.birth_type || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Parents Information */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-medium mb-4 border-b border-black pb-1">Parents' Information</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-32">Mother's Name (Current):</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.mother_current_name || '_'.repeat(25)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-32">Mother's Maiden Name:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.mother_maiden_name || '_'.repeat(25)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-24">Mother's DOB:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.mother_dob || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-24">Mother's Place:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.mother_birthplace || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-20">Occupation:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.mother_occupation || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex">
                                                <span className="font-semibold w-32">Mother's Address:</span>
                                                <span className="border-b border-black flex-1 pl-2">{formData.mother_address || '_'.repeat(50)}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-32">Father's Name:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.father_name || '_'.repeat(25)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-24">Father's DOB:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.father_dob || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-28">Father's Place:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.father_birthplace || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-20">Occupation:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.father_occupation || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-28">Father's Address:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.father_address || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Registration Details */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-medium mb-4 border-b border-black pb-1">Birth Registration Details</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-28">Registration Date:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.registration_date || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-32">Registrar's Name:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.registrar_name || '_'.repeat(20)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex">
                                                    <span className="font-semibold w-24">Reg. Number:</span>
                                                    <span className="border-b border-black flex-1 pl-2">{formData.registration_number || '_'.repeat(15)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6 mt-6">
                                            <div className="col-span-2"></div>
                                            <div>
                                                <div className="border-2 border-black h-20 flex items-center justify-center font-semibold text-sm bg-gray-50">
                                                    OFFICIAL SEAL / STAMP
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* Section 2: Child Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:hidden" id="certificate-content">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Child Information</h2>
                            <div className="text-right">
                                <label className="mr-2 text-sm font-medium text-gray-700">Certificate No:</label>
                                <input 
                                    type="text" 
                                    value={formData.certificate_number}
                                    readOnly
                                    className="inline-block w-56 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed text-sm"
                                />
                            </div>
                        </div>
                        <div>
                                    <div className="space-y-6 print:space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Full Name of Child *
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={formData.child_full_name}
                                                    onChange={(e) => handleInputChange('child_full_name', e.target.value)}
                                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${errors.child_full_name ? 'border-red-500' : 'border-gray-200'}`}
                                                    placeholder="Enter child's full name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Birth</label>
                                                <select
                                                    value={formData.birth_type}
                                                    onChange={(e) => handleInputChange('birth_type', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                >
                                                    <option value="">Select type</option>
                                                    <option value="Single">Single</option>
                                                    <option value="Twin">Twins</option>
                                                    <option value="Triplet">Triplets</option>
                                                    <option value="Multiple">Other Multiple</option>
                                                </select>
                                            </div>
                                        </div>
                            
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Sex *
                                                </label>
                                                <select 
                                                    value={formData.child_sex}
                                                    onChange={(e) => handleInputChange('child_sex', e.target.value)}
                                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${errors.child_sex ? 'border-red-500' : 'border-gray-200'}`}
                                                    required
                                                >
                                                    <option value="">Select sex</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Intersex">Intersex</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Date of Birth *
                                                </label>
                                                <input 
                                                    type="date" 
                                                    value={formData.birth_date}
                                                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${errors.birth_date ? 'border-red-500' : 'border-gray-200'}`}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Time of Birth *
                                                </label>
                                                <input 
                                                    type="time" 
                                                    value={formData.birth_time}
                                                    onChange={(e) => handleInputChange('birth_time', e.target.value)}
                                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${errors.birth_time ? 'border-red-500' : 'border-gray-200'}`}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Place of Birth (Hospital/Facility) *
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={formData.birth_place}
                                                    onChange={(e) => handleInputChange('birth_place', e.target.value)}
                                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${errors.birth_place ? 'border-red-500' : 'border-gray-200'}`}
                                                    placeholder="Enter birth facility"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    City/Municipality
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={formData.birth_city}
                                                    onChange={(e) => handleInputChange('birth_city', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                    placeholder="Enter city/municipality"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    State/Province
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={formData.birth_state}
                                                    onChange={(e) => handleInputChange('birth_state', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                    placeholder="Enter state/province"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Country
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={formData.birth_country}
                                                    onChange={(e) => handleInputChange('birth_country', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
                                                    placeholder="Enter country"
                                                />
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                </div>

                    {/* Section 3: Parents' Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:hidden">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">Parents' Information</h2>
                        <div className="space-y-8">

                                            {/* Mother */}
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Full Name (Current) *</label>
                                                        <input
                                                            type="text"
                                                            value={formData.mother_current_name}
                                                            onChange={(e) => handleInputChange('mother_current_name', e.target.value)}
                                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${errors.mother_current_name ? 'border-red-500' : 'border-gray-200'}`}
                                                            placeholder="e.g. Maria Carmen Cruz"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Maiden Name *</label>
                                                        <input
                                                            type="text"
                                                            value={formData.mother_maiden_name}
                                                            onChange={(e) => handleInputChange('mother_maiden_name', e.target.value)}
                                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${errors.mother_maiden_name ? 'border-red-500' : 'border-gray-200'}`}
                                                            placeholder="e.g. Maria Carmen Santos"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Date of Birth</label>
                                                        <input type="date" value={formData.mother_dob} onChange={(e)=>handleInputChange('mother_dob', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Place of Birth</label>
                                                        <input type="text" value={formData.mother_birthplace} onChange={(e)=>handleInputChange('mother_birthplace', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                                                        <input type="text" value={formData.mother_occupation} onChange={(e)=>handleInputChange('mother_occupation', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Address</label>
                                                    <input type="text" value={formData.mother_address} onChange={(e)=>handleInputChange('mother_address', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                </div>
                                            </div>

                                            {/* Father */}
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Father's Full Name</label>
                                                        <input type="text" value={formData.father_name} onChange={(e)=>handleInputChange('father_name', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Father's Date of Birth</label>
                                                        <input type="date" value={formData.father_dob} onChange={(e)=>handleInputChange('father_dob', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Father's Place of Birth</label>
                                                        <input type="text" value={formData.father_birthplace} onChange={(e)=>handleInputChange('father_birthplace', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                                                        <input type="text" value={formData.father_occupation} onChange={(e)=>handleInputChange('father_occupation', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Father's Address</label>
                                                        <input type="text" value={formData.father_address} onChange={(e)=>handleInputChange('father_address', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                    {/* Section 4: Birth Registration Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:hidden">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">Birth Registration Details</h2>
                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Registration</label>
                                                    <input type="date" value={formData.registration_date} onChange={(e)=>handleInputChange('registration_date', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Registrar's Name/Signature *</label>
                                                    <input type="text" value={formData.registrar_name} onChange={(e)=>handleInputChange('registrar_name', e.target.value)} className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${errors.registrar_name ? 'border-red-500' : 'border-gray-200'}`} placeholder="Registrar's name" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
                                                    <input type="text" value={formData.registration_number} readOnly className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed" placeholder="e.g. REG-2025-001234" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="md:col-span-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Official Seal / Stamp</label>
                                                    <div className="border-2 border-dashed border-gray-400 rounded-lg h-32 flex items-center justify-center text-gray-500">SEAL / STAMP</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:hidden">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isLoading || !selectedPatient}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving Certificate...
                                    </>
                                ) : (
                                    'Save to Patient Documents'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    /* Hide all non-essential elements */
                    .no-print { display: none !important; }
                    
                    /* Optimized Legal page setup for single page */
                    @page { 
                        size: legal portrait; 
                        margin: 12mm 10mm 10mm 10mm;
                    }
                    
                    /* Body and document setup */
                    html, body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        font-family: 'Times New Roman', serif !important;
                        font-size: 9px !important;
                        line-height: 1.2 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                    }
                    
                    /* Hide everything except the print area */
                    body * { 
                        visibility: hidden !important; 
                        background: transparent !important;
                    }
                    
                    /* Show header + certificate content together */
                    #print-area, 
                    #print-area * { 
                        visibility: visible !important; 
                    }
                    
                    /* Professional document container */
                    #print-area { 
                        position: static !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        transform: none !important;
                        height: 100vh !important;
                        overflow: hidden !important;
                    }
                    
                    /* Compact header styling */
                    #print-area .bg-white.rounded-xl.shadow-sm {
                        background: white !important;
                        border: 2px solid black !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        margin-bottom: 8px !important;
                        padding: 8px !important;
                    }
                    
                    /* Compact header text styling */
                    #print-area h1 {
                        font-size: 12px !important;
                        font-weight: bold !important;
                        color: black !important;
                        text-align: center !important;
                        margin: 0 0 4px 0 !important;
                        letter-spacing: 0.5px !important;
                    }
                    
                    #print-area h2 {
                        font-size: 14px !important;
                        font-weight: bold !important;
                        color: black !important;
                        text-align: center !important;
                        margin: 4px 0 !important;
                        letter-spacing: 1px !important;
                    }
                    
                    /* Compact form container styling */
                    #print-area .bg-white.rounded-xl.shadow-sm.border.border-gray-200 {
                        background: white !important;
                        border: 2px solid black !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        padding: 12px !important;
                        height: calc(100vh - 80px) !important;
                        overflow: hidden !important;
                    }
                    
                    /* Show form values properly in print */
                    #print-area input,
                    #print-area select,
                    #print-area textarea {
                        background: white !important;
                        border: none !important;
                        border-bottom: 1px solid black !important;
                        color: black !important;
                        font-size: 10px !important;
                        font-family: 'Times New Roman', serif !important;
                        padding: 2px 4px 1px 0 !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        -webkit-appearance: none !important;
                        appearance: none !important;
                        min-height: 16px !important;
                        height: 18px !important;
                        line-height: 1.2 !important;
                        display: inline-block !important;
                        width: auto !important;
                        min-width: 200px !important;
                    }
                    
                    /* Ensure input values are visible */
                    #print-area input[type="text"],
                    #print-area input[type="date"],
                    #print-area input[type="time"],
                    #print-area select {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color: black !important;
                        opacity: 1 !important;
                    }
                    
                    /* Compact labels styling */
                    #print-area label {
                        color: black !important;
                        background: transparent !important;
                        font-weight: bold !important;
                        font-size: 7px !important;
                        font-family: 'Times New Roman', serif !important;
                        text-transform: uppercase !important;
                        margin-bottom: 1px !important;
                        display: block !important;
                        line-height: 1.1 !important;
                    }
                    
                    /* Compact section headings */
                    #print-area h3 {
                        color: black !important;
                        background: #f5f5f5 !important;
                        font-weight: bold !important;
                        font-size: 10px !important;
                        font-family: 'Times New Roman', serif !important;
                        text-transform: uppercase !important;
                        padding: 4px 8px !important;
                        margin: 10px 0 8px 0 !important;
                        border: 1px solid black !important;
                        text-align: center !important;
                        letter-spacing: 0.5px !important;
                        line-height: 1.1 !important;
                    }
                    
                    /* Compact certificate number styling */
                    #print-area .text-right {
                        text-align: right !important;
                        margin-bottom: 10px !important;
                        font-weight: bold !important;
                        font-size: 9px !important;
                    }
                    
                    /* Compact grid layouts */
                    #print-area .grid {
                        display: table !important;
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    
                    #print-area .grid > div {
                        display: table-cell !important;
                        vertical-align: top !important;
                        padding: 0 6px 0 0 !important;
                        width: auto !important;
                    }
                    
                    /* Compact spacing */
                    #print-area .space-y-6 > * + * {
                        margin-top: 8px !important;
                    }
                    
                    #print-area .space-y-3 > * + * {
                        margin-top: 6px !important;
                    }
                    
                    #print-area .space-y-8 > * + * {
                        margin-top: 10px !important;
                    }
                    
                    #print-area .mt-8 {
                        margin-top: 10px !important;
                    }
                    
                    #print-area .mb-6 {
                        margin-bottom: 6px !important;
                    }
                    
                    #print-area .mb-4 {
                        margin-bottom: 4px !important;
                    }
                    
                    #print-area .mb-2 {
                        margin-bottom: 2px !important;
                    }
                    
                    /* Hide native input icons */
                    #print-area input[type="date"]::-webkit-calendar-picker-indicator,
                    #print-area input[type="time"]::-webkit-calendar-picker-indicator,
                    #print-area input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                        display: none !important;
                        -webkit-appearance: none !important;
                    }
                    
                    #print-area input[type="date"],
                    #print-area input[type="time"],
                    #print-area input[type="datetime-local"] {
                        background-image: none !important;
                    }
                    
                    /* Number spinners */
                    #print-area input[type=number]::-webkit-inner-spin-button,
                    #print-area input[type=number]::-webkit-outer-spin-button {
                        -webkit-appearance: none !important;
                        margin: 0 !important;
                    }
                    
                    #print-area input[type=number] {
                        -moz-appearance: textfield !important;
                    }
                    
                    /* Facility header dividers */
                    #print-area .border-t {
                        border-top: 1px solid black !important;
                    }
                    
                    #print-area .border-b {
                        border-bottom: 1px solid black !important;
                    }
                    
                    /* Compact table-like layout for form fields */
                    #print-area .md\:grid-cols-2 {
                        display: table !important;
                        width: 100% !important;
                    }
                    
                    #print-area .md\:grid-cols-3 {
                        display: table !important;
                        width: 100% !important;
                    }
                    
                    #print-area .md\:grid-cols-2 > div,
                    #print-area .md\:grid-cols-3 > div {
                        display: table-cell !important;
                        padding-right: 8px !important;
                        vertical-align: top !important;
                    }
                    
                    /* Compact seal/stamp area */
                    #print-area .border-dashed {
                        border: 2px solid black !important;
                        background: #f9f9f9 !important;
                        text-align: center !important;
                        font-weight: bold !important;
                        color: black !important;
                        height: 60px !important;
                        font-size: 8px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    
                    /* Force single page layout */
                    #print-area .flex-1 {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    
                    /* Ensure content fits in single page */
                    #certificate-content {
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        page-break-inside: avoid !important;
                    }
                    
                    /* Add print media query fallback for browsers that don't respect complex CSS */
                    @media print {
                        * {
                            color: black !important;
                            background: white !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        
                        .no-print,
                        .print\\:hidden {
                            display: none !important;
                        }
                        
                        body {
                            font-family: 'Times New Roman', serif !important;
                            font-size: 12px !important;
                        }
                        
                        input {
                            border: none !important;
                            border-bottom: 1px solid black !important;
                            background: transparent !important;
                        }
                    }
                }
            `}</style>
        </div>
)}
