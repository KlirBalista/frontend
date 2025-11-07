"use client";
import React from 'react';
import { X, FileText, Clock, User, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const VisitLogModal = ({ isOpen, onClose, visit, onConfirmStatusChange }) => {
  if (!isOpen || !visit) return null;

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'missed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'scheduled':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-[#A41F39]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-white mr-2" />
              <h2 className="text-lg font-bold text-white">Visit Status Update</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Patient & Visit Info */}
          <div className="bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 border border-[#F891A5]/30 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-900 mr-2" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {visit.patient.first_name} {visit.patient.last_name}
                  </h3>
                  <p className="text-xs text-gray-900 font-medium">
                    Visit {visit.visit_number}: {visit.visit_name}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(visit.status)}`}>
                {visit.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-900">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-gray-900" />
                <span>Week {visit.recommended_week}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-gray-900" />
                <span>{new Date(visit.scheduled_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Status Change Options */}
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Update Status:</h4>
            
            {/* Completed Option */}
            <div 
              className="flex items-center p-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg cursor-pointer hover:border-green-300 hover:shadow-sm transition-all duration-200"
              onClick={() => onConfirmStatusChange('completed')}
            >
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <div className="flex-1">
                <h5 className="font-medium text-green-800 text-sm">Mark as Completed</h5>
                <p className="text-xs text-green-700">Patient attended this visit</p>
              </div>
            </div>

            {/* Missed Option */}
            <div 
              className="flex items-center p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg cursor-pointer hover:border-red-300 hover:shadow-sm transition-all duration-200"
              onClick={() => onConfirmStatusChange('missed')}
            >
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <div className="flex-1">
                <h5 className="font-medium text-red-800 text-sm">Mark as Missed</h5>
                <p className="text-xs text-red-700">Patient did not attend</p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <div className="flex items-start">
              <AlertCircle className="h-3 w-3 text-blue-600 mr-1.5 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This will create a permanent log entry and update the visit status immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 border-t border-[#FDB3C2]/30">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-900 font-semibold border border-[#F891A5] rounded-md hover:bg-[#FDB3C2]/20 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitLogModal;