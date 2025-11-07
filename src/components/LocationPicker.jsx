"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Button from "./Button";

// Dynamically import Map component with no SSR
const MapComponent = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 flex items-center justify-center">
      Loading map...
    </div>
  ),
});

const LocationPicker = ({ value, onChange, error }) => {
  const [position, setPosition] = useState(value || null);
  
  // Default center for Davao City, Philippines
  const defaultCenter = [7.0731, 125.6128]; // Davao City, Philippines

  useEffect(() => {
    if (position) {
      onChange(position);
    }
  }, [position, onChange]);

  const handleSetPosition = (newPosition) => {
    setPosition(newPosition);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting current location:", error);
          alert(
            "Could not get your current location. Please allow location access or select manually on the map."
          );
        }
      );
    } else {
      alert(
        "Geolocation is not supported by your browser. Please select location manually on the map."
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="h-96 relative border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
        <MapComponent
          position={position}
          onPositionChange={handleSetPosition}
          onViewportChange={(viewport) => {
            console.log('Viewport changed:', viewport);
            // Optionally do something with the new viewport
          }}
          defaultCenter={defaultCenter}
          zoom={13}
          animateMarker={true}
          key={`map-${position?.[0]}-${position?.[1]}`}
        />

        <div className="absolute top-4 right-4 z-[1000]">
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#A41F39] to-[#BF3853] text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-[#923649] hover:to-[#A41F39] transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/20"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
            Get Current Location
          </button>
        </div>
      </div>

      {position && (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <svg 
            className="w-5 h-5 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-green-800">Location Selected</p>
            <p className="text-xs text-green-600">
              Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default LocationPicker;
