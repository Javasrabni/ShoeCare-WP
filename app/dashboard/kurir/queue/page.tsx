"use client"

import { useEffect, useState } from "react"
import {
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  CheckIcon,
  Loader2Icon,
  PackageIcon,
  UserIcon,
  ClockIcon,
  ChevronRightIcon,
  AlertCircleIcon
} from "lucide-react"

interface Order {
  _id: string
  orderNumber: string
  customerInfo: { name: string; phone: string }
  pickupLocation: { 
    address: string; 
    dropPointName: string; 
    coordinates?: { lat: number; lng: number } 
  }
  status: string
  payment?: { finalAmount: number }
  createdAt: string
  activeCourier?: { courierId: string } | null
  // ✅ Bisa dari queueInfo atau dari courierQueue array
  queueInfo?: {
    assignedAt: string
    status: string
    notes?: string
  }
  courierQueue?: any[] // Fallback jika queueInfo tidak ada
  isActive: boolean
}

export default function CourierQueuePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchQueue()
  }, [])

  const fetchQueue = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/courier/orders/queue")
      const data = await res.json()
      
      console.log("📦 API Response:", data) // Debug
      
      if (data.success) {
        setOrders(data.data || [])
        console.log("✅ Orders set:", data.data?.length)
      } else {
        setError(data.message || "Gagal memuat data")
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Terjadi kesalahan saat memuat data")
    } finally {
      setLoading(false)
    }
  }

  // ✅ HELPER: Format date dengan safe check
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Baru saja"
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return "Invalid date"
    }
  }

  // ✅ HELPER: Get queue info dengan fallback
  const getQueueInfo = (order: Order) => {
    // Prioritas 1: queueInfo yang sudah diformat backend
    if (order.queueInfo) {
      return order.queueInfo
    }
    
    // Prioritas 2: Cari dari courierQueue array
    if (order.courierQueue && order.courierQueue.length > 0) {
      const pending = order.courierQueue.find(q => q.status === "pending")
      if (pending) {
        return {
          assignedAt: pending.assignedAt,
          status: pending.status,
          notes: pending.notes
        }
      }
    }
    
    // Fallback
    return {
      assignedAt: order.createdAt,
      status: "pending",
      notes: ""
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-500">Memuat antrian...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchQueue}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Antrian Order</h1>
              <p className="text-gray-500 text-sm mt-1">
                {orders.length} order menunggu penjemputan
              </p>
            </div>
            <button
              onClick={fetchQueue}
              className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <Loader2Icon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak ada antrian
            </h3>
            <p className="text-gray-500 text-sm">
              Belum ada order yang ditugaskan ke Anda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const queueInfo = getQueueInfo(order) // ✅ Gunakan helper
              
              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 font-mono">
                          {order.orderNumber}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            order.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {order.isActive ? 'Sedang Aktif' : 'Menunggu'}
                          </span>
                        </div>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.customerInfo?.name || "Unknown"}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {order.customerInfo?.phone || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPinIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                            {order.pickupLocation?.address || "Alamat tidak tersedia"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {order.pickupLocation?.dropPointName || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ SAFE: Queue Info Footer */}
                  <div className="px-5 py-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Ditugaskan</p>
                          <p className="text-sm font-medium text-gray-700">
                            {formatDate(queueInfo?.assignedAt)}
                          </p>
                        </div>
                      </div>
                      
                      {queueInfo?.notes && (
                        <div className="text-right max-w-[150px]">
                          <p className="text-xs text-gray-400 truncate" title={queueInfo.notes}>
                            {queueInfo.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {/* TODO: Accept order */}}
                    disabled={order.isActive}
                    className={`w-full py-3 font-medium flex items-center justify-center gap-2 transition-colors ${
                      order.isActive
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {order.isActive ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Sedang Diproses
                      </>
                    ) : (
                      <>
                        <TruckIcon className="w-4 h-4" />
                        Terima Order
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}