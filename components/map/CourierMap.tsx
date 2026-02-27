// /components/map/CourierMap.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, User } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

// Fix default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface CourierMapProps {
  customerLocation: { lat: number; lng: number };
  courierLocation?: { lat: number; lng: number } | null;
  destinationLabel?: string;
}

// Custom icon generator using Lucide icons
const createCustomIcon = (type: 'courier' | 'customer') => {
  const color = type === 'courier' ? '#3B82F6' : '#EF4444';
  const iconSvg = type === 'courier' 
    ? ReactDOMServer.renderToString(<Navigation size={20} color="white" />)
    : ReactDOMServer.renderToString(<MapPin size={20} color="white" />);

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Component to fit bounds and center map
function MapController({ 
  courierPos, 
  customerPos 
}: { 
  courierPos: [number, number]; 
  customerPos: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([courierPos, customerPos]);
    map.fitBounds(bounds, { 
      padding: [50, 50],
      maxZoom: 16
    });
  }, [map, courierPos, customerPos]);

  return null;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(p1: {lat: number, lng: number}, p2: {lat: number, lng: number}): number {
  const R = 6371; // Earth's radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Estimate time based on distance (assuming 25 km/h average for motorcycle)
function estimateTime(distanceKm: number): string {
  const speedKmh = 25;
  const timeHours = distanceKm / speedKmh;
  const timeMinutes = Math.ceil(timeHours * 60);
  
  if (timeMinutes < 60) {
    return `${timeMinutes} menit`;
  } else {
    const hours = Math.floor(timeMinutes / 60);
    const mins = timeMinutes % 60;
    return `${hours} jam ${mins > 0 ? `${mins} menit` : ''}`;
  }
}

export default function CourierMap({ 
  customerLocation, 
  courierLocation,
  destinationLabel = 'Customer'
}: CourierMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to Jakarta center if no courier location
  const defaultCourierPos: [number, number] = [-6.2088, 106.8456];
  
  const courierPos: [number, number] = courierLocation 
    ? [courierLocation.lat, courierLocation.lng]
    : defaultCourierPos;
    
  const customerPos: [number, number] = [customerLocation.lat, customerLocation.lng];

  // Calculate distance and ETA
  const { distance, eta } = useMemo(() => {
    const dist = calculateDistance(
      { lat: courierPos[0], lng: courierPos[1] },
      { lat: customerPos[0], lng: customerPos[1] }
    );
    return {
      distance: dist,
      eta: estimateTime(dist)
    };
  }, [courierPos, customerPos]);

  // Route line positions
  const routePositions: [number, number][] = [courierPos, customerPos];

  if (!mounted) {
    return (
      <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-gray-400">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={courierPos}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route Line with arrow */}
        <Polyline 
          positions={routePositions}
          color="#3B82F6"
          weight={4}
          opacity={0.8}
          dashArray="10, 10"
          lineCap="round"
          lineJoin="round"
        />
        
        {/* Courier Marker */}
        <Marker 
          position={courierPos} 
          icon={createCustomIcon('courier')}
        >
          <Popup>
            <div className="text-sm font-medium">Lokasi Anda</div>
          </Popup>
        </Marker>

        {/* Customer Marker */}
        <Marker 
          position={customerPos} 
          icon={createCustomIcon('customer')}
        >
          <Popup>
            <div className="text-sm font-medium">{destinationLabel}</div>
          </Popup>
        </Marker>

        {/* Auto-fit bounds */}
        <MapController courierPos={courierPos} customerPos={customerPos} />
      </MapContainer>

      {/* Distance & ETA Overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Navigation className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Jarak</p>
              <p className="text-lg font-bold text-gray-900">{distance.toFixed(1)} km</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-gray-200" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Estimasi</p>
              <p className="text-lg font-bold text-gray-900">{eta}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-700">Anda</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-700">{destinationLabel}</span>
        </div>
      </div>
    </div>
  );
}