"use client";

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export default function BulkChargingModal({ 
    isOpen, 
    onClose, 
    birthcareId, 
    admittedPatients, 
    services,
    onSuccess 
}) {
    const [selectedPatients, setSelectedPatients] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchPatient, setSearchPatient] = useState('');
    const [searchService, setSearchService] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setSelectedPatients([]);
            setSelectedServices([]);
            setNotes('');
            setSearchPatient('');
            setSearchService('');
        }
    }, [isOpen]);

    const filteredPatients = admittedPatients.filter(patient => {
        const patientData = patient.patient || patient;
        const firstName = patientData.firstname || patientData.first_name || '';
        const lastName = patientData.lastname || patientData.last_name || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        const roomNumber = patient.room_number || '';
        
        return fullName.includes(searchPatient.toLowerCase()) || 
               roomNumber.toString().includes(searchPatient.toLowerCase());
    });

    const filteredServices = services.filter(service => 
        service.service_name.toLowerCase().includes(searchService.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchService.toLowerCase()))
    );

    const togglePatientSelection = (patient) => {
        const patientId = patient.patient_id || patient.id;
        const isSelected = selectedPatients.some(p => (p.patient_id || p.id) === patientId);
        
        if (isSelected) {
            setSelectedPatients(selectedPatients.filter(p => (p.patient_id || p.id) !== patientId));
        } else {
            setSelectedPatients([...selectedPatients, patient]);
        }
    };

    const addServiceToSelection = (service) => {
        const existingService = selectedServices.find(s => s.id === service.id);
        if (existingService) {
            setSelectedServices(selectedServices.map(s => 
                s.id === service.id 
                    ? { ...s, quantity: s.quantity + 1 }
                    : s
            ));
        } else {
            setSelectedServices([...selectedServices, { ...service, quantity: 1 }]);
        }
    };

    const updateServiceQuantity = (serviceId, quantity) => {
        if (quantity <= 0) {
            setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
            return;
        }
        
        setSelectedServices(selectedServices.map(s => 
            s.id === serviceId ? { ...s, quantity } : s
        ));
    };

    const removeServiceFromSelection = (serviceId) => {
        setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
    };

    const calculateTotalPerPatient = () => {
        return selectedServices.reduce((total, service) => 
            total + (service.price * service.quantity), 0
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedPatients.length === 0) {
            alert('Please select at least one patient');
            return;
        }
        
        if (selectedServices.length === 0) {
            alert('Please select at least one service');
            return;
        }

        setLoading(true);

        try {
            const patientIds = selectedPatients.map(p => p.patient_id || p.id);
            const servicesData = selectedServices.map(s => ({
                id: s.id,
                quantity: s.quantity,
                price: s.price
            }));

            const response = await axios.post(
                `/api/birthcare/${birthcareId}/patient-charges/bulk-charge`,
                {
                    patient_ids: patientIds,
                    services: servicesData,
                    notes: notes
                }
            );

            if (response.data.success) {
                onSuccess(response.data.data);
                onClose();
            }
        } catch (error) {
            console.error('Error processing bulk charge:', error);
            alert('Failed to process bulk charge: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalPerPatient = calculateTotalPerPatient();
    const totalAmount = totalPerPatient * selectedPatients.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Bulk Charge Patients</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Selection */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Select Patients ({selectedPatients.length} selected)
                            </h3>
                            
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    value={searchPatient}
                                    onChange={(e) => setSearchPatient(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                                {filteredPatients.map((patient) => {
                                    const patientData = patient.patient || patient;
                                    const patientId = patient.patient_id || patient.id;
                                    const isSelected = selectedPatients.some(p => (p.patient_id || p.id) === patientId);
                                    const firstName = patientData.firstname || patientData.first_name || '';
                                    const lastName = patientData.lastname || patientData.last_name || '';
                                    
                                    return (
                                        <div
                                            key={patientId}
                                            onClick={() => togglePatientSelection(patient)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => togglePatientSelection(patient)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {firstName} {lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        Room: {patient.room_number || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Service Selection */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Select Services ({selectedServices.length} selected)
                            </h3>
                            
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    value={searchService}
                                    onChange={(e) => setSearchService(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                                {filteredServices.map((service) => (
                                    <div key={service.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm">{service.service_name}</h4>
                                                {service.category && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                                                        {service.category}
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-600 mt-1">{service.description}</p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="font-semibold text-gray-900 text-sm">₱{service.price.toLocaleString()}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => addServiceToSelection(service)}
                                                    className="mt-1 inline-flex items-center px-2 py-1 border border-blue-300 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Selected Services Summary */}
                        {selectedServices.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Services</h3>
                                <div className="space-y-2">
                                    {selectedServices.map((service) => (
                                        <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{service.service_name}</h4>
                                                <p className="text-sm text-gray-600">₱{service.price.toLocaleString()} each</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateServiceQuantity(service.id, service.quantity - 1)}
                                                        className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center font-medium">{service.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}
                                                        className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                
                                                <div className="text-right min-w-20">
                                                    <p className="font-semibold text-gray-900">₱{(service.price * service.quantity).toLocaleString()}</p>
                                                </div>
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => removeServiceFromSelection(service.id)}
                                                    className="ml-2 text-red-600 hover:text-red-800"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add any additional notes for this bulk charge..."
                            />
                        </div>

                        {/* Summary */}
                        {selectedPatients.length > 0 && selectedServices.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-2">Charging Summary</h4>
                                <div className="space-y-1 text-sm text-blue-800">
                                    <p>Patients to be charged: <span className="font-medium">{selectedPatients.length}</span></p>
                                    <p>Services per patient: <span className="font-medium">{selectedServices.length}</span></p>
                                    <p>Amount per patient: <span className="font-medium">₱{totalPerPatient.toLocaleString()}</span></p>
                                    <p className="text-lg font-semibold">Total Amount: ₱{totalAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || selectedPatients.length === 0 || selectedServices.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : `Charge ${selectedPatients.length} Patient${selectedPatients.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
