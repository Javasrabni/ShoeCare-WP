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
  NavigationIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  SearchIcon,
  ClockIcon,
  ChevronRightIcon,
  MapPinnedIcon,
  PhoneCallIcon,
  StoreIcon,
  AlertTriangleIcon
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
  courierQueue?: any[]
}

interface Courier {
  _id: string
  name: string
  phone: string
  courierInfo: {
    vehicleType: string;
    vehicleNumber: string;
    currentLocation?: { lat: number; lng: number }
  }
  distance: number | null
  status: string
  statusLabel: string
  isActuallyBusy: boolean
  activeOrder: { orderNumber: string; status: string } | null
}

export default function NeedProcessingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders/need-processing?includeAssigned=true")
      const data = await res.json()
      if (data.success) {
        setOrders(data.data)
        console.log("Orders loaded:", data.data.length)
      }
    } catch (error) {
      console.error("Fetch orders error:", error)
    }
    setLoading(false)
  }

  const fetchCouriers = async (order: Order) => {
    setSelectedOrder(order)
    const params = new URLSearchParams()
    if (order.pickupLocation?.coordinates) {
      params.append("lat", order.pickupLocation.coordinates.lat.toString())
      params.append("lng", order.pickupLocation.coordinates.lng.toString())
    }

    try {
      const res = await fetch(`/api/admin/couriers/available?${params}`)
      const data = await res.json()
      if (data.success) {
        setCouriers(data.data)
        console.log("Couriers loaded:", data.data.length)
      }
    } catch (error) {
      console.error("Fetch couriers error:", error)
    }
  }

  // ⬅️ FIX: Simpan orderId di state sebelum assign
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null)

  const handleAssign = async (courierId: string) => {
    if (!selectedOrder?._id) {
      alert("Order tidak dipilih")
      return
    }

    const orderId = selectedOrder._id
    console.log("Assigning order:", orderId, "to courier:", courierId)

    setAssigning(courierId)
    setAssigningOrderId(orderId)

    try {
      // 1. Assign kurir ke queue
      const assignRes = await fetch(`/api/admin/orders/${orderId}/force-assign-courier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierId,
          notes: "Ditugaskan dari halaman perlu diproses"
        })
      })

      const assignData = await assignRes.json()
      console.log("Assign response:", assignData)

      if (!assignData.success) {
        alert(assignData.message || "Gagal assign kurir")
        setAssigning(null)
        return
      }

      // ✅ FIX: Hapus update status terpisah - sudah dihandle oleh force-assign-courier
      // API force-assign-courier sudah mengubah status ke "courier_assigned"
      // Tidak perlu call API terpisah lagi

      // ✅ FIX: Tambahkan delay kecil untuk MongoDB replication (jika pakai Atlas)
      await new Promise(resolve => setTimeout(resolve, 500))

      // ✅ FIX: Force refresh dengan timestamp untuk cache busting
      await fetchOrders()

      // Reset state
      setSelectedOrder(null)
      setCouriers([])
      alert("✅ Kurir berhasil ditugaskan ke antrian!")

    } catch (error) {
      console.error("Assign error:", error)
      alert("Terjadi kesalahan saat assign kurir: " + (error as Error).message)
    }

    setAssigning(null)
    setAssigningOrderId(null)
  }

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerInfo.phone.includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-500 text-sm">Memuat order...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 z-30">
        <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Orders</span>
                <span>/</span>
                <span className="text-blue-600 font-medium">Need Processing</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Order Perlu Diproses</h1>
              <p className="text-gray-500 text-sm mt-1">Assign kurir untuk penjemputan sepatu customer</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="text-sm text-gray-600">Waiting</span>
                <span className="bg-orange-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                  {orders.length}
                </span>
              </div>
              <button
                onClick={fetchOrders}
                className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCwIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-4 mt-6">
            <div className="flex-1 max-w-md relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari order ID atau nama customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <PackageIcon className="w-4 h-4 text-blue-500" />
              Daftar Order ({filteredOrders.length})
            </h2>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PackageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada order</h3>
                <p className="text-gray-500 text-sm">Semua order sudah diassign kurir</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => fetchCouriers(order)}
                  className={`bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 ${selectedOrder?._id === order._id
                      ? 'border-blue-500 ring-2 ring-blue-100 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 font-mono">
                          {order.orderNumber}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${order.status === 'confirmed'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                            }`}>
                            {order.status === 'confirmed' ? 'Belum Assign' : order.status}
                          </span>
                          {order.courierQueue && order.courierQueue.length > 0 && (
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                              {order.courierQueue.length} Kurir di Queue
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${selectedOrder?._id === order._id ? 'rotate-90 text-blue-500' : ''
                        }`} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.customerInfo.name}</p>
                          <p className="text-gray-500 text-xs">{order.customerInfo.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPinIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                            {order.pickupLocation.address}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {order.pickupLocation.dropPointName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`px-5 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedOrder?._id === order._id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-600'
                    }`}>
                    {selectedOrder?._id === order._id ? (
                      <>
                        <NavigationIcon className="w-4 h-4" />
                        Pilih Kurir Sekarang
                      </>
                    ) : (
                      <>
                        <TruckIcon className="w-4 h-4" />
                        Klik untuk Assign Kurir
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Courier Selection */}
          <div className="lg:col-span-3">
            {selectedOrder ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-24">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Tugaskan Kurir</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Order: {selectedOrder.orderNumber}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {selectedOrder._id}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <PackageIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{selectedOrder.customerInfo.name}</h3>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{selectedOrder.pickupLocation.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <TruckIcon className="w-4 h-4 text-blue-500" />
                      Kurir Tersedia ({couriers.length})
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {couriers.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <TruckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Tidak ada kurir</p>
                      </div>
                    ) : (
                      couriers.map((courier) => (
                        <div
                          key={courier._id}
                          className={`relative p-5 rounded-xl border-2 transition-all ${courier.isActuallyBusy
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${courier.isActuallyBusy ? 'bg-amber-100' : 'bg-green-100'
                                }`}>
                                <TruckIcon className={`w-7 h-7 ${courier.isActuallyBusy ? 'text-amber-600' : 'text-green-600'
                                  }`} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900">{courier.name}</h4>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${courier.isActuallyBusy
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-green-100 text-green-700'
                                    }`}>
                                    {courier.statusLabel}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                  <span className="text-lg">
                                    {courier.courierInfo.vehicleType === 'motorcycle' ? '🛵' : '🚗'}
                                  </span>
                                  <span className="font-medium text-gray-700">
                                    {courier.courierInfo.vehicleNumber}
                                  </span>
                                  {courier.distance !== null && (
                                    <span className="text-blue-600 font-semibold">
                                      {courier.distance} km
                                    </span>
                                  )}
                                </div>

                                {courier.isActuallyBusy && courier.activeOrder && (
                                  <div className="mt-2 p-2 bg-amber-100 rounded-lg text-xs text-amber-800">
                                    <p className="font-medium">
                                      Sedang: {courier.activeOrder.orderNumber}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleAssign(courier._id)}
                              disabled={assigning === courier._id}
                              className={`px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm ${courier.isActuallyBusy
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                                } disabled:opacity-50`}
                            >
                              {assigning === courier._id ? (
                                <>
                                  <Loader2Icon className="w-4 h-4 animate-spin" />
                                  Assigning...
                                </>
                              ) : (
                                <>
                                  {courier.isActuallyBusy ? (
                                    <AlertTriangleIcon className="w-4 h-4" />
                                  ) : (
                                    <CheckIcon className="w-4 h-4" />
                                  )}
                                  {courier.isActuallyBusy ? 'Assign' : 'Assign'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center sticky top-24">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPinnedIcon className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pilih Order untuk Assign Kurir
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Klik order di sebelah kiri untuk melihat kurir yang tersedia
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}