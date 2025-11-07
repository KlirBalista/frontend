"use client";
import React from 'react';
import { X, Clock, User, Calendar, Hash } from 'lucide-react';

const TodaysVisitsModal = ({ isOpen, onClose, visits, onVisitRightClick, getStatusColor }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[70vh] overflow-hidden border-2 border-[#FDB3C2]/30">
        {/* Header */}
        <div className="px-4 py-3 bg-[#A41F39]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-white mr-2" />
              <h2 className="text-lg font-bold text-white">Today's Visits</h2>
              <span className="ml-2 text-xs font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                {visits.length} visit{visits.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          {visits.length > 0 ? (
            <div className="space-y-3">
              {visits.map((visit, index) => (
                <div
                  key={visit.id}
                  className={`p-3 bg-gradient-to-r from-[#FDB3C2]/10 to-[#F891A5]/10 border border-[#F891A5]/30 rounded-lg transition-all duration-200 hover:shadow-md hover:border-[#E56D85]/50 ${
                    visit.status === 'Scheduled' ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  onContextMenu={(e) => onVisitRightClick && onVisitRightClick(e, visit)}
                  title={visit.status === 'Scheduled' ? 'Right-click to change status' : `Status: ${visit.status}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#E56D85] to-[#BF3853] rounded-lg flex items-center justify-center text-white font-bold text-sm mr-2">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center mb-0.5">
                          <User className="h-3 w-3 text-[#A41F39] mr-1" />
                          <h3 className="text-base font-bold text-[#A41F39]">
                            {visit.patient.first_name} {visit.patient.last_name}
                          </h3>
                        </div>
                        <div className="flex items-center text-xs text-[#BF3853] font-medium">
                          <Hash className="h-3 w-3 mr-1" />
                          Visit {visit.visit_number}: {visit.visit_name}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(visit.status)}`}>
                      {visit.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center text-[#BF3853]">
                      <Calendar className="h-3 w-3 mr-1 text-[#E56D85]" />
                      <span className="font-medium">Recommended: Week {visit.recommended_week}</span>
                    </div>
                    <div className="flex items-center text-[#BF3853]">
                      <Clock className="h-3 w-3 mr-1 text-[#E56D85]" />
                      <span className="font-medium">Scheduled: {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>

                  {visit.notes && (
                    <div className="mt-2 p-2 bg-white/60 rounded-md border border-[#FDB3C2]/40">
                      <p className="text-xs text-[#A41F39] font-medium">
                        <strong>Notes:</strong> {visit.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-[#F891A5] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#A41F39] mb-1">No Visits Today</h3>
              <p className="text-sm text-[#BF3853] font-medium">There are no prenatal visits scheduled for today.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 border-t border-[#FDB3C2]/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#BF3853] font-medium">
              💡 <strong>Tip:</strong> Right-click on status to mark as completed or missed.
            </p>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white text-sm font-semibold rounded-md hover:shadow-md hover:shadow-[#BF3853]/25 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodaysVisitsModal;