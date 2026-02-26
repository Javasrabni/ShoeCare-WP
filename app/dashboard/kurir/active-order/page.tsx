"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  CameraIcon,
  NavigationIcon,
  CheckCircleIcon,
  Loader2Icon,
  ArrowLeftIcon,
  ClockIcon,
  PackageIcon,
  UploadIcon,
  XCircleIcon
} from "lucide-react";

interface Order {
  _id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    phone: string;
  };
  pickupLocation: {
    address: string;
    dropPointName: string;
    coordinates?: { lat: number; lng: number };
  };
  status: string;
  activeCourier?: {
    startedPickupAt?: string;
    currentLocation?: {
      lat: number;
      lng: number;
      updatedAt: string;
    };
  };
  pickupProof?: {
    image: string;
    timestamp: string;
    notes?: string;
  };
}

export default function ActiveOrderPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);

  const fetchActiveOrder = useCallback(async () => {
    try {
      const res = await fetch("/api/courier/orders/active");
      const data = await res.json();
      if (data.success) {
        if (!data.data) {
          router.push("/dashboard/kurir/queue");
          return;
        }
        setOrder(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch active order:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchActiveOrder();
  }, [fetchActiveOrder]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  const handleStartPickup = async () => {
    try {
      const res = await fetch(`/api/courier/orders/${order?._id}/start-pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location })
      });
      const data = await res.json();
      if (data.success) {
        fetchActiveOrder();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Gagal update status");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File maksimal 5MB");
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !order) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("location", JSON.stringify(location));
    formData.append("notes", "Bukti pengambilan sepatu");

    try {
      const res = await fetch(`/api/courier/orders/${order._id}/upload-pickup-proof`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        setShowUploadModal(false);
        fetchActiveOrder();
        alert("Bukti pickup berhasil diupload! Status: Sudah Diambil");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Gagal upload bukti");
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2Icon className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) return null;

  const isStarted = order.status === 'pickup_in_progress';
  const isPickedUp = order.status === 'picked_up';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/dashboard/kurir/queue")}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order Aktif</h1>
              <p className="text-sm text-gray-500 font-mono">{order.orderNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Status Card */}
        <div className={`rounded-2xl p-5 text-white ${
          isPickedUp ? 'bg-green-600' : isStarted ? 'bg-blue-600' : 'bg-amber-500'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            {isPickedUp ? <CheckCircleIcon className="w-8 h-8" /> : 
             isStarted ? <NavigationIcon className="w-8 h-8" /> : 
             <ClockIcon className="w-8 h-8" />}
            <div>
              <h2 className="text-lg font-bold">
                {isPickedUp ? 'Sudah Diambil' : isStarted ? 'Menuju Lokasi' : 'Tugas Diterima'}
              </h2>
              <p className="text-white/90 text-sm">
                {isPickedUp ? 'Sepatu berhasil dijemput' : 
                 isStarted ? `Berangkat: ${new Date(order.activeCourier?.startedPickupAt || '').toLocaleTimeString('id-ID')}` : 
                 'Silakan mulai perjalanan ke lokasi customer'}
              </p>
            </div>
          </div>
          
          {!isStarted && !isPickedUp && (
            <button
              onClick={handleStartPickup}
              className="w-full py-3 bg-white text-amber-600 rounded-xl font-bold hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
            >
              <NavigationIcon className="w-5 h-5" />
              Mulai Perjalanan (OTW)
            </button>
          )}
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Informasi Customer</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <PackageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{order.customerInfo.name}</p>
                <p className="text-sm text-gray-500">{order.customerInfo.phone}</p>
              </div>
              <a
                href={`https://wa.me/${order.customerInfo.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                WhatsApp
              </a>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPinIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-700 leading-relaxed">{order.pickupLocation.address}</p>
                <p className="text-sm text-gray-500 mt-1">Drop Point: {order.pickupLocation.dropPointName}</p>
              </div>
              {order.pickupLocation.coordinates && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.pickupLocation.coordinates.lat},${order.pickupLocation.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <NavigationIcon className="w-4 h-4" />
                  Navigasi
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Upload Proof Section */}
        {isStarted && !isPickedUp && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Bukti Pengambilan</h3>
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CameraIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">Foto Bukti Pickup</span>
              <span className="text-sm text-gray-500">Ambil foto sepatu yang dijemput</span>
            </button>
          </div>
        )}

        {/* Display Proof if exists */}
        {order.pickupProof && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Bukti Pickup Tersimpan</h3>
            <div className="relative w-full h-64 rounded-xl overflow-hidden">
              <Image
                src={order.pickupProof.image}
                alt="Bukti Pickup"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Diupload: {new Date(order.pickupProof.timestamp).toLocaleString('id-ID')}
              {order.pickupProof.notes && (
                <span className="block mt-1">Catatan: {order.pickupProof.notes}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Upload Bukti Pickup</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {previewUrl ? (
              <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4">
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              </div>
            ) : (
              <label className="block w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400">
                <CameraIcon className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-gray-500">Klik untuk ambil foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleUploadProof}
                disabled={!selectedFile || uploading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}