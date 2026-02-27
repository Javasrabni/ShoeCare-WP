// /components/map/RouteInfo.tsx - Komponen info jarak terpisah (opsional)
'use client';

import { Navigation, MapPin, Clock } from 'lucide-react';

interface RouteInfoProps {
  distance: number; // in km
  eta: string;
  className?: string;
}

export default function RouteInfo({ distance, eta, className = '' }: RouteInfoProps) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-lg border border-gray-100 ${className}`}>
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
            <Clock className="text-green-600" size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Estimasi</p>
            <p className="text-lg font-bold text-gray-900">{eta}</p>
          </div>
        </div>
      </div>
    </div>
  );
}