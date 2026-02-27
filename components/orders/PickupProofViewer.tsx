// /components/orders/PickupProofViewer.tsx - Lanjutan
'use client';

import { useState } from 'react';
import { CameraIcon, XIcon, MapPinIcon, ClockIcon, UserIcon, ZoomInIcon } from 'lucide-react';

interface PickupProofViewerProps {
  orderId: string;
  imageUrl?: string | undefined | null;
  timestamp?: string | undefined | null;
  location?: { lat: number; lng: number };
  takenBy?: string;
  compact?: boolean;
}

export default function PickupProofViewer({ 
  orderId, 
  imageUrl: initialImageUrl,
  timestamp: initialTimestamp,
  location,
  takenBy,
  compact = false 
}: PickupProofViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [proofData, setProofData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchProof = async () => {
    if (initialImageUrl) {
      setProofData({
        imageUrl: initialImageUrl,
        timestamp: initialTimestamp,
        location,
        takenBy
      });
      setIsOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/proof`);
      const data = await res.json();
      if (data.success) {
        setProofData(data.data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Fetch proof error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compact version untuk list/table
  if (compact) {
    return (
      <>
        <button
          onClick={fetchProof}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CameraIcon size={12} />
          )}
          Lihat Bukti
        </button>

        {/* Modal */}
        {isOpen && proofData && (
          <ProofModal 
            proofData={proofData} 
            onClose={() => setIsOpen(false)} 
          />
        )}
      </>
    );
  }

  // Full version untuk detail view
  if (!initialImageUrl && !proofData) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
        <CameraIcon size={48} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Bukti pickup belum diupload</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CameraIcon size={18} className="text-blue-600" />
          Bukti Penjemputan
        </h3>
        <button
          onClick={fetchProof}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <ZoomInIcon size={18} />
        </button>
      </div>
      
      <div className="relative group cursor-pointer" onClick={fetchProof}>
        <img 
          src={initialImageUrl || proofData?.imageUrl} 
          alt="Bukti Pickup"
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-sm font-medium">Klik untuk perbesar</p>
        </div>
      </div>

      {(initialTimestamp || proofData?.timestamp) && (
        <div className="p-4 bg-gray-50 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon size={14} className="text-gray-400" />
            <span>{new Date(initialTimestamp || proofData?.timestamp).toLocaleString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          
          {(location || proofData?.location) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPinIcon size={14} className="text-gray-400" />
              <span>
                {proofData?.location?.lat?.toFixed(6)}, {proofData?.location?.lng?.toFixed(6)}
              </span>
              <a 
                href={`https://www.google.com/maps?q=${proofData?.location?.lat},${proofData?.location?.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                (Lihat di Maps)
              </a>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isOpen && proofData && (
        <ProofModal 
          proofData={proofData} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}

// Modal Component
function ProofModal({ proofData, onClose }: { proofData: any; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"
      >
        <XIcon size={24} />
      </button>

      <div 
        className="max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <img 
          src={proofData.imageUrl} 
          alt="Bukti Pickup Full Size"
          className="w-full h-auto rounded-lg"
        />
        
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <ClockIcon size={18} className="text-blue-400" />
              <div>
                <p className="text-xs text-gray-300">Waktu</p>
                <p className="text-sm font-medium">
                  {new Date(proofData.timestamp).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            
            {proofData.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon size={18} className="text-red-400" />
                <div>
                  <p className="text-xs text-gray-300">Lokasi</p>
                  <p className="text-sm font-medium">
                    {proofData.location.lat.toFixed(6)}, {proofData.location.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            )}
            
            {proofData.takenBy && (
              <div className="flex items-center gap-2">
                <UserIcon size={18} className="text-green-400" />
                <div>
                  <p className="text-xs text-gray-300">Diupload oleh</p>
                  <p className="text-sm font-medium">Kurir</p>
                </div>
              </div>
            )}
          </div>
          
          {proofData.location && (
            <a
              href={`https://www.google.com/maps?q=${proofData.location.lat},${proofData.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <MapPinIcon size={16} />
              Buka di Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}