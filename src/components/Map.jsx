"use client";

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import '../styles/map.css';

// Fix Leaflet marker icon issues
// This solves the problem of marker icons not displaying
delete L.Icon.Default.prototype._getIconUrl;

// Create custom pin marker icon
const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin shadow -->
          <ellipse cx="20" cy="47" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
          <!-- Pin body with gradient -->
          <path d="M20 2C12.268 2 6 8.268 6 16c0 12 14 28 14 28s14-16 14-28c0-7.732-6.268-14-14-14z" 
                fill="url(#pinGradient)" 
                stroke="#fff" 
                stroke-width="2"/>
          <!-- Heart icon -->
          <path d="M20 13.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5c0 2.5-4.5 7-4.5 7s-4.5-4.5-4.5-7z" 
                fill="#fff" 
                transform="scale(0.6) translate(13.5, 8)"/>
          <!-- Gradient definition -->
          <defs>
            <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ff6b6b"/>
              <stop offset="100%" stop-color="#ff5252"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 45],
    popupAnchor: [0, -45]
  });
};

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

// Map event handler component
export const MapEventHandler = ({ onClick, onMoveEnd, onZoomEnd, onViewportChange }) => {
  const map = useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
    moveend() {
      if (onMoveEnd) {
        const center = map.getCenter();
        onMoveEnd([center.lat, center.lng]);
      }
    },
    zoomend() {
      if (onZoomEnd) {
        onZoomEnd(map.getZoom());
      }
    },
    dragend() {
      if (onViewportChange) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bounds = map.getBounds();
        onViewportChange({
          center: [center.lat, center.lng],
          zoom,
          bounds: {
            southWest: [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
            northEast: [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
          }
        });
      }
    }
  });
  
  return null;
};

// Position marker with enhanced map centering and animation
export const LocationMarkerWithFly = ({ position, zoom = 13, animate = true }) => {
  const map = useMap();
  const [prevPosition, setPrevPosition] = useState(position);
  
  useEffect(() => {
    if (position && map) {
      try {
        if (animate) {
          const flyOptions = {
            duration: 1.5, // Animation duration in seconds
            easeLinearity: 0.25,
            noMoveStart: true
          };
          
          // Only animate if position has changed significantly
          if (!prevPosition || 
              Math.abs(position[0] - prevPosition[0]) > 0.0001 || 
              Math.abs(position[1] - prevPosition[1]) > 0.0001) {
            map.flyTo(position, zoom, flyOptions);
          }
        } else {
          // No animation, just set view
          map.setView(position, zoom);
        }
        
        setPrevPosition(position);
      } catch (error) {
        console.error('Error when centering map:', error);
        // Fallback in case animation fails
        map.setView(position, zoom);
      }
    }
    
    // Cleanup function to cancel any ongoing animations when component unmounts
    return () => {
      if (map && map._flyToFrame) {
        L.Util.cancelAnimFrame(map._flyToFrame);
      }
    };
  }, [position, map, zoom, animate, prevPosition]);

  // Custom pin icon setup
  const customIcon = position ? createCustomPinIcon() : null;

  return position ? <Marker position={position} icon={customIcon} /> : null;
};

// Main map component with enhanced event handling
const Map = ({ 
  position, 
  onPositionChange, 
  onMoveEnd, 
  onZoomEnd, 
  onViewportChange,
  defaultCenter = [7.0731, 125.6128], // Davao City, Philippines
  zoom = 13,
  animateMarker = true
}) => {
  const [mapReady, setMapReady] = useState(false);
  
  // Track viewport data
  const [viewport, setViewport] = useState({
    center: position || defaultCenter,
    zoom: zoom
  });

  const handleViewportChange = useCallback((newViewport) => {
    setViewport(prev => ({
      ...prev,
      ...newViewport
    }));
    
    if (onViewportChange) {
      onViewportChange(newViewport);
    }
  }, [onViewportChange]);

  useEffect(() => {
    // Log confirmation of map initialization
    console.log('Map component initialized with Leaflet icon configuration');
    setMapReady(true);
    
    return () => {
      // Cleanup when component unmounts
      setMapReady(false);
    };
  }, []);

  return (
    <MapContainer
      center={position || defaultCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      whenReady={() => setMapReady(true)}
    >
      {mapReady && (
        <>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventHandler 
            onClick={onPositionChange}
            onMoveEnd={onMoveEnd}
            onZoomEnd={onZoomEnd}
            onViewportChange={handleViewportChange}
          />
          <LocationMarkerWithFly 
            position={position} 
            zoom={zoom}
            animate={animateMarker} 
          />
        </>
      )}
    </MapContainer>
  );
};

export default Map;

