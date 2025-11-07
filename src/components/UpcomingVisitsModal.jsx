"use client";
import React from 'react';
import { X, Calendar, User, Hash, Clock } from 'lucide-react';

const UpcomingVisitsModal = ({ isOpen, onClose, visits, onVisitRightClick, getStatusColor, normalizeYMD }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[70vh] overflow-hidden border-2 border-[#FDB3C2]/30">
        {/* Header */}
        <div className="px-4 py-3 bg-[#A41F39]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-white mr-2" />
              <h2 className="text-base font-bold text-white">Upcoming Visits</h2>
              <span className="ml-2 text-[11px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
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
        <div className="p-3 max-h-[50vh] overflow-y-auto">
          {visits.length > 0 ? (
            <div className="space-y-2.5">
              {visits.map((visit, index) => (
                <div
                  key={visit.id}
                  className={`p-2 bg-gradient-to-r from-[#FDB3C2]/10 to-[#F891A5]/10 border border-[#F891A5]/30 rounded-md transition-all duration-200 hover:shadow hover:border-[#E56D85]/50 ${
                    visit.status === 'Scheduled' ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  onContextMenu={(e) => onVisitRightClick && onVisitRightClick(e, visit)}
                  title={visit.status === 'Scheduled' ? 'Right-click to change status' : `Status: ${visit.status}`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center">
                      <div className="w-7 h-7 bg-gradient-to-r from-[#E56D85] to-[#BF3853] rounded-md flex items-center justify-center text-white font-bold text-xs mr-2">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center mb-0.5">
                          <User className="h-3 w-3 text-[#A41F39] mr-1" />
                          <h3 className="text-sm font-bold text-[#A41F39]">
                            {visit.patient.first_name} {visit.patient.last_name}
                          </h3>
                        </div>
                        <div className="flex items-center text-[11px] text-[#BF3853] font-medium">
                          <Hash className="h-3 w-3 mr-1" />
                          Visit {visit.visit_number}: {visit.visit_name}
                        </div>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${getStatusColor(visit.status)}`}>
                      {visit.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center text-[#BF3853]">
                      <Calendar className="h-3 w-3 mr-1 text-[#E56D85]" />
                      <span className="font-medium">Week {visit.recommended_week}</span>
                    </div>
                    <div className="flex items-center text-[#BF3853]">
                      <Clock className="h-3 w-3 mr-1 text-[#E56D85]" />
                      <span className="font-medium">
                        {(() => {
                          // Normalize to local date first, then format
                          const ymd = normalizeYMD ? normalizeYMD(visit.scheduled_date) : visit.scheduled_date.split(' ')[0];
                          const [year, month, day] = ymd.split('-');
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });
                        })()}
                      </span>
                    </div>
                  </div>

                  {visit.notes && (
                    <div className="mt-2 p-2 bg-white/60 rounded border border-[#FDB3C2]/40">
                      <p className="text-xs text-[#A41F39] font-medium">
                        <strong>Notes:</strong> {visit.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="h-10 w-10 text-[#F891A5] mx-auto mb-2" />
              <h3 className="text-base font-bold text-[#A41F39] mb-1">No Upcoming Visits</h3>
              <p className="text-xs text-[#BF3853] font-medium">There are no upcoming prenatal visits scheduled.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#FDB3C2]/20 to-[#F891A5]/20 border-t border-[#FDB3C2]/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#BF3853] font-medium">
              💡 <strong>Tip:</strong> Right-click on scheduled visits to change status.
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

export default UpcomingVisitsModal;