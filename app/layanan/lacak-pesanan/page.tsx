// app/layanan/lacak-pesanan/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchIcon, PackageIcon, TruckIcon, MapPinIcon, UserIcon, ChevronDownIcon } from "lucide-react"
import { useAuth } from "@/app/context/userAuth/getUserAuthData."

export const dynamic = 'force-dynamic'

interface TrackingDetail {
  stage: string
  timestamp: string
  proofImage?: string
  notes?: string
  updatedByName?: string
  location?: {
    lat: number
    lng: number
  }
}

interface TrackingTimeline {
  id: string
  status: string
  timestamp: string
  label: string
  description: string
  updatedBy: string
  notes: string
  icon: string
}

interface TrackingData {
  orderNumber: string
  status: string
  currentStage: string
  timeline: TrackingTimeline[]
  trackingDetails: TrackingDetail[]
  courier: {
    name: string
    pickupTime: string
    deliveryTime: string
  } | null
}

interface UserOrder {
  _id: string
  orderNumber: string
  status: string
  createdAt: string
  total: number
}

function LacakPesananContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userOrders, setUserOrders] = useState<UserOrder[]>([])
  const [fetchingOrders, setFetchingOrders] = useState(false)

  // Fetch user orders saat login
  useEffect(() => {
    if (isAuthenticated && user?.phone) {
      fetchUserOrders(user.phone)
    }
  }, [isAuthenticated, user])

  // Auto-track jika ada order di URL
  useEffect(() => {
    const orderFromUrl = searchParams.get("order")
    if (orderFromUrl) {
      const cleanOrderId = orderFromUrl.trim().toUpperCase()
      if (cleanOrderId) {
        setSelectedOrderId(cleanOrderId)
        handleTrack(cleanOrderId)
      }
    }
  }, [searchParams])

  const fetchUserOrders = async (phone: string) => {
    setFetchingOrders(true)
    try {
      const res = await fetch(`/api/customer/orders?phone=${phone}`)
      const data = await res.json()
      if (data.success) {
        setUserOrders(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch user orders")
    }
    setFetchingOrders(false)
  }

  const handleTrack = async (orderId?: string) => {
    const trackId = orderId || selectedOrderId
    
    if (!trackId || trackId.trim() === "") {
      setError(isAuthenticated ? "Silakan pilih pesanan" : "Silakan masukkan nomor order")
      return
    }

    const cleanId = trackId.trim().toUpperCase()
    setLoading(true)
    setError("")
    setTrackingData(null)

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(cleanId)}/tracking`)
      const data = await res.json()

      if (data.success) {
        setTrackingData(data.data)
      } else {
        setError(data.message || `Order tidak ditemukan`)
      }
    } catch (err) {
      setError("Terjadi kesalahan saat melacak pesanan")
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStageIndex = () => {
    if (!trackingData) return -1
    return trackingData.timeline.findIndex(t => t.status === trackingData.currentStage)
  }

  // ⬅️ RENDER: Jika user login dan ada daftar order, tampilkan dropdown
  const renderOrderSelector = () => {
    if (!isAuthenticated) {
      // Guest: input manual
      return (
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Masukkan nomor order (SC-...)"
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full p-4 pl-12 border rounded-xl focus:ring-2 focus:ring-blue-500 font-mono uppercase"
          />
          <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      )
    }

    if (fetchingOrders) {
      return (
        <div className="flex-1 p-4 border rounded-xl bg-gray-50 text-gray-500">
          Memuat daftar pesanan...
        </div>
      )
    }

    if (userOrders.length === 0) {
      return (
        <div className="flex-1 p-4 border rounded-xl bg-gray-50 text-gray-500">
          Belum ada pesanan
        </div>
      )
    }

    // Member dengan order: dropdown
    return (
      <div className="flex-1 relative">
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="w-full p-4 pl-12 pr-10 border rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
        >
          <option value="">Pilih pesanan Anda</option>
          {userOrders.map((order) => (
            <option key={order._id} value={order.orderNumber}>
              {order.orderNumber} - {new Date(order.createdAt).toLocaleDateString('id-ID')} - Rp {order.total?.toLocaleString('id-ID')}
            </option>
          ))}
        </select>
        <PackageIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold font-[poppins] mb-2">Lacak Pesanan</h1>
      <p className="text-gray-500 mb-8">
        {isAuthenticated
          ? `Halo ${user?.name}, silakan pilih pesanan Anda`
          : "Masukkan nomor order (SC-...) untuk melacak status pesanan"}
      </p>

      {/* Search Form */}
      <div className="mb-8">
        <div className="flex gap-3">
          {renderOrderSelector()}
          <button
            onClick={() => handleTrack()}
            disabled={loading || !selectedOrderId.trim()}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium whitespace-nowrap"
          >
            {loading ? "Mencari..." : "Lacak"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-6">
          {error}
        </div>
      )}

      {/* Tracking Result */}
      {trackingData && (
        <div className="space-y-6">
          {/* Order Header */}
          <div className="bg-white border rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nomor Order</p>
                <h2 className="text-2xl font-bold font-mono">{trackingData.orderNumber}</h2>
              </div>
              <div className="text-right">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  trackingData.status === 'completed' ? 'bg-green-100 text-green-800' :
                  trackingData.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {trackingData.timeline[getCurrentStageIndex()]?.label || trackingData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Live Tracking Status */}
          {trackingData.courier && trackingData.currentStage === 'pickup_in_progress' && (
            <div className="bg-blue-600 text-white rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <TruckIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Kurir Sedang Menuju Lokasi Anda</h3>
                  <p className="text-blue-100">Kurir: {trackingData.courier.name}</p>
                </div>
              </div>
            </div>
          )}

          {trackingData.courier && trackingData.currentStage === 'delivery_in_progress' && (
            <div className="bg-green-600 text-white rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Kurir Sedang Mengantar Pesanan Anda</h3>
                  <p className="text-green-100">Kurir: {trackingData.courier.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white border rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-6">Status Pesanan</h3>
            <div className="space-y-0">
              {trackingData.timeline.map((item, index) => {
                const currentIndex = getCurrentStageIndex()
                const isActive = index <= currentIndex
                const isCurrent = index === currentIndex

                return (
                  <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
                    {index < trackingData.timeline.length - 1 && (
                      <div className={`absolute left-5 top-10 w-0.5 h-full ${
                        index < currentIndex ? 'bg-blue-500' : 'bg-gray-200'
                      }`} />
                    )}
                    
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      isActive 
                        ? isCurrent 
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                          : 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {item.icon}
                    </div>

                    <div className="flex-1 pt-1">
                      <h4 className={`font-semibold ${
                        isActive ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {item.label}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        isActive ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {item.description}
                      </p>
                      {isActive && item.updatedBy && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          {item.updatedBy} • {new Date(item.timestamp).toLocaleString('id-ID')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Proof Images Gallery */}
          {trackingData.trackingDetails?.some((t: any) => t.proofImage) && (
            <div className="bg-white border rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Bukti Foto</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trackingData.trackingDetails
                  .filter((t: any) => t.proofImage)
                  .map((detail: any, idx: number) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border">
                      <img
                        src={detail.proofImage}
                        alt={`Bukti ${detail.stage}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                        {getStatusLabel(detail.stage)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    "pickup_assigned": "Kurir Ditugaskan",
    "pickup_in_progress": "Menuju Lokasi",
    "picked_up": "Barang Diambil",
    "in_workshop": "Di Workshop",
    "processing": "Dikerjakan",
    "qc_check": "QC",
    "ready_for_delivery": "Siap Diantar",
    "delivery_assigned": "Kurir Diantar",
    "delivery_in_progress": "Dalam Pengantaran",
    "delivered": "Terkirim"
  };
  return labels[status] || status;
}

function Loading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

export default function LacakPesananPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LacakPesananContent />
    </Suspense>
  )
}