"use client";

import React from 'react';
import { User, MapPin, Activity, Calendar } from 'lucide-react';

const PatientPanel = ({ 
  patientName = "Mela Dela Cruz", 
  roomType = "Semi-Private", 
  status = "In-Labor",
  date = "2025-10-23",
  className = ""
}) => {
  // Get status color based on status type
  const getStatusColor = (status) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'in-labor':
      case 'in labor':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300';
      case 'admitted':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'delivered':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'discharged':
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
      default:
        return 'bg-gradient-to-r from-[#FDB3C2]/30 to-[#F891A5]/30 text-[#A41F39] border-[#E56D85]';
    }
  };

  return (
    <div className={`bg-white border-2 border-[#FDB3C2]/40 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Patient info */}
          <div className="flex items-center space-x-3">
            {/* Patient avatar */}
            <div className="w-10 h-10 bg-gradient-to-r from-[#E56D85] to-[#BF3853] rounded-full flex items-center justify-center shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
            
            {/* Patient details */}
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-[#A41F39] leading-tight">
                {patientName}
              </h3>
              <div className="flex items-center space-x-3 mt-0.5">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-[#BF3853]" />
                  <span className="text-xs font-medium text-[#BF3853]">
                    Room: <span className="font-semibold">{roomType}</span>
                  </span>
                </div>
                <div className="w-1 h-1 bg-[#E56D85] rounded-full"></div>
                <div className="flex items-center space-x-1">
                  <Activity className="h-3 w-3 text-[#BF3853]" />
                  <span className="text-xs font-medium text-[#BF3853]">
                    Status: 
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Date */}
          <div className="flex items-center space-x-2 text-[#BF3853]">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {date}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPanel;