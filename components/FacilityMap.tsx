
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Facility, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface FacilityMapProps {
  facilities: Facility[];
  lang: Language;
}

const FacilityMap: React.FC<FacilityMapProps> = ({ facilities, lang }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const t = TRANSLATIONS[lang];
  
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (New Delhi)
    const defaultCenter: [number, number] = [28.6139, 77.2090];
    
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Resize fix for when container size changes
    mapRef.current.invalidateSize();

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add facility markers
    facilities.forEach(fac => {
      const marker = L.marker([fac.lat, fac.lng])
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="p-1">
            <h4 class="font-bold text-sm">${fac.name}</h4>
            <p class="text-xs text-slate-500">${fac.type}</p>
            <p class="text-[10px] text-blue-600 mt-1">${fac.hours}</p>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Add user marker if exists
    if (userPos) {
      const userMarker = L.circleMarker(userPos, {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 1,
        radius: 8
      })
      .addTo(mapRef.current)
      .bindPopup(t.youAreHere);
      markersRef.current.push(userMarker as unknown as L.Marker);
      
      mapRef.current.setView(userPos, 14);
    } else {
      // Fit bounds to facilities if no user pos
      const group = L.featureGroup(markersRef.current);
      if (markersRef.current.length > 0) {
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [facilities, userPos, lang]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPos([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full min-h-[200px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <button 
        onClick={requestLocation}
        className="absolute bottom-4 right-4 z-[400] bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-blue-600 hover:bg-blue-50 transition active:scale-95 group-hover:scale-105"
        title={t.useCurrentLocation}
      >
        <span className="text-xl">🎯</span>
      </button>
    </div>
  );
};

export default FacilityMap;
