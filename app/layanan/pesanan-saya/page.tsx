"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  PackageIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  EyeIcon,
  MapPinIcon,
  PhoneIcon,
  MessageCircleIcon,
  CreditCardIcon,
  UploadIcon,
  Loader2Icon,
  ChevronRightIcon,
  CalendarIcon,
  FileTextIcon,
  NavigationIcon,
  CameraIcon
} from "lucide-react"

// Format Rupiah helper
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

interface OrderItem {
  itemType: string
  treatmentType: string
  price: number
  quantity: number
}

interface AdditionalPayment {
  required: boolean
  amount: number
  status: string
  proofImage?: string
  method?: string
}

interface PickupProof {
  image: string
  timestamp: string
  notes?: string
  location?: {
    lat: number
    lng: number
  }
}

interface ActiveCourier {
  courierId: string
  acceptedAt: string
  startedPickupAt?: string
  currentLocation?: {
    lat: number
    lng: number
    updatedAt: string
  }
}

interface Order {
  _id: string
  orderNumber: string
  customerInfo: {
    name: string
    phone: string
  }
  serviceType: string
  pickupLocation: {
    address?: string
    dropPointName?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  items: OrderItem[]
  payment: {
    method: string
    finalAmount: number
    status: string
    proofImage?: string
    subtotal: number
    deliveryFee: number
    discountPoints: number
  }
  additionalPayment?: AdditionalPayment
  status: string
  createdAt: string
  pickupProof?: PickupProof
  activeCourier?: ActiveCourier
  tracking?: {
    courierName?: string
    pickupTime?: string
  }
}

export default function PesananSaya() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState("")

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/my-orders")
      const data = await res.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order)
    setShowPaymentModal(true)
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadError("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File terlalu besar. Maksimal 5MB.")
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setUploadError("")
  }

  const handleSubmitAdditionalPayment = async () => {
    if (!selectedOrder || !selectedFile) return

    setUploading(true)
    setUploadError("")

    try {
      // Upload image
      const formData = new FormData()
      formData.append("file", selectedFile)
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      const uploadData = await uploadRes.json()

      if (!uploadData.success) {
        setUploadError("Gagal upload gambar: " + uploadData.message)
        setUploading(false)
        return
      }

      // Submit additional payment proof
      const res = await fetch(`/api/orders/${selectedOrder._id}/additional-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofImage: uploadData.data.url })
      })

      const data = await res.json()
      if (data.success) {
        setShowPaymentModal(false)
        fetchOrders()
        if (selectedOrder) {
          setSelectedOrder(data.data)
        }
      } else {
        setUploadError(data.message || "Gagal mengupload bukti pembayaran")
      }
    } catch (error) {
      setUploadError("Terjadi kesalahan jaringan")
    }
    setUploading(false)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string; icon: any }> = {
      pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending", icon: ClockIcon },
      waiting_confirmation: { bg: "bg-orange-50", text: "text-orange-700", label: "Menunggu Konfirmasi", icon: AlertTriangleIcon },
      confirmed: { bg: "bg-blue-50", text: "text-blue-700", label: "Dikonfirmasi", icon: CheckCircleIcon },
      courier_assigned: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Kurir Ditugaskan", icon: ClockIcon },
      pickup_in_progress: { bg: "bg-purple-50", text: "text-purple-700", label: "Kurir OTW", icon: NavigationIcon },
      picked_up: { bg: "bg-pink-50", text: "text-pink-700", label: "Sudah Diambil", icon: CameraIcon },
      in_workshop: { bg: "bg-teal-50", text: "text-teal-700", label: "Di Workshop", icon: PackageIcon },
      processing: { bg: "bg-cyan-50", text: "text-cyan-700", label: "Diproses", icon: Loader2Icon },
      qc_check: { bg: "bg-lime-50", text: "text-lime-700", label: "QC Check", icon: CheckCircleIcon },
      ready_for_delivery: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Siap Kirim", icon: PackageIcon },
      delivery_in_progress: { bg: "bg-amber-50", text: "text-amber-700", label: "Dikirim", icon: ClockIcon },
      completed: { bg: "bg-green-50", text: "text-green-700", label: "Selesai", icon: CheckCircleIcon },
      cancelled: { bg: "bg-rose-50", text: "text-rose-700", label: "Dibatalkan", icon: XCircleIcon }
    }

    const style = styles[status] || { bg: "bg-gray-50", text: "text-gray-700", label: status, icon: AlertTriangleIcon }
    const IconComponent = style.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <IconComponent size={12} className="mr-1.5" />
        {style.label}
      </span>
    )
  }

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Menunggu" },
      waiting_confirmation: { bg: "bg-orange-50", text: "text-orange-700", label: "Konfirmasi" },
      paid: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Dibayar" },
      failed: { bg: "bg-rose-50", text: "text-rose-700", label: "Gagal" },
      refunded: { bg: "bg-gray-50", text: "text-gray-700", label: "Dikembalikan" }
    }

    const style = styles[status] || { bg: "bg-gray-50", text: "text-gray-700", label: status }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <CreditCardIcon size={12} className="mr-1.5" />
        {style.label}
      </span>
    )
  }

  // Orders needing additional payment (priority)
  const ordersNeedingPayment = orders.filter(o => 
    o.additionalPayment?.required && o.additionalPayment.status === "pending"
  )

  // Recent orders (limit 5)
  const recentOrders = orders.slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-gray-500 text-sm">Memuat data pesanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kelola pesanan dan status pembayaran</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCwIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Alert: Additional Payment Required */}
        {ordersNeedingPayment.length > 0 && (
          <div className="mb-6">
            {ordersNeedingPayment.map((order) => (
              <div
                key={order._id}
                className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-200 mb-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-xl shrink-0">
                      <AlertTriangleIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        Pembayaran Tambahan Diperlukan
                      </h3>
                      <p className="text-white/90 text-sm mb-2">
                        Order <span className="font-mono font-bold">{order.orderNumber}</span> memerlukan pembayaran tambahan karena ada perubahan layanan oleh admin.
                      </p>
                      <div className="bg-white/20 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm text-white/80">Jumlah:</span>
                        <span className="text-lg font-bold ml-2">
                          Rp {order.additionalPayment?.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openPaymentModal(order)}
                    className="flex-shrink-0 px-6 py-3 bg-white text-amber-600 rounded-xl font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <UploadIcon className="w-5 h-5" />
                    Upload Bukti Pembayaran
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Total Orders</span>
              <PackageIcon className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Menunggu Pembayaran</span>
              <ClockIcon className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.additionalPayment?.required && o.additionalPayment.status === "pending").length}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Selesai</span>
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.status === "completed").length}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Total spent</span>
              <CreditCardIcon className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              Rp {orders.reduce((sum, o) => sum + o.payment.finalAmount, 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pesanan Terbaru</h2>
              <p className="text-sm text-gray-500">Riwayat pesanan Anda</p>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <PackageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada pesanan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 font-mono">
                          {order.orderNumber}
                        </h3>
                        {getStatusBadge(order.status)}
                        {order.additionalPayment?.required && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                            <AlertTriangleIcon className="w-3 h-3 mr-1" />
                            Additional Payment
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                        <span>{order.items.length} item(s)</span>
                        <span className="font-mono">Rp {order.payment.finalAmount.toLocaleString('id-ID')}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Info Kurir OTW */}
                      {order.status === 'pickup_in_progress' && order.activeCourier?.startedPickupAt && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                          <NavigationIcon className="w-4 h-4 text-blue-600 animate-pulse" />
                          <span className="text-sm font-medium text-blue-900">
                            Kurir sedang menuju lokasi Anda
                          </span>
                        </div>
                      )}

                      {/* Info Sudah Diambil */}
                      {order.status === 'picked_up' && order.pickupProof && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            Sepatu sudah dijemput kurir
                          </span>
                        </div>
                      )}

                      {order.additionalPayment?.required && order.additionalPayment.status === "pending" && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-900">
                            Tambahan: Rp {order.additionalPayment.amount.toLocaleString('id-ID')}
                          </span>
                          <button
                            onClick={() => openPaymentModal(order)}
                            className="ml-2 text-xs px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
                          >
                            Bayar Sekarang
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openDetailModal(order)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detail Pesanan</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircleIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status Pesanan</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status Pembayaran</p>
                  {getPaymentBadge(selectedOrder.payment.status)}
                </div>
              </div>

              {/* Tracking Kurir OTW */}
              {selectedOrder.status === 'pickup_in_progress' && selectedOrder.activeCourier?.startedPickupAt && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <NavigationIcon className="w-5 h-5 text-blue-600 mt-0.5 animate-pulse" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900">Kurir Sedang Menuju Lokasi</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Berangkat: {new Date(selectedOrder.activeCourier.startedPickupAt).toLocaleString('id-ID')}
                      </p>
                      {selectedOrder.tracking?.courierName && (
                        <p className="text-sm text-blue-600 mt-1">
                          Kurir: {selectedOrder.tracking.courierName}
                        </p>
                      )}
                      {selectedOrder.activeCourier.currentLocation && (
                        <a 
                          href={`https://www.google.com/maps?q=${selectedOrder.activeCourier.currentLocation.lat},${selectedOrder.activeCourier.currentLocation.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <MapPinIcon className="w-4 h-4" />
                          Lihat Lokasi Kurir
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bukti Pickup */}
              {selectedOrder.pickupProof && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CameraIcon className="w-4 h-4" />
                    Bukti Pengambilan oleh Kurir
                  </h3>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 mb-2">
                    <Image
                      src={selectedOrder.pickupProof.image}
                      alt="Bukti Pickup"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-600">
                      Diambil pada: <span className="font-medium">{new Date(selectedOrder.pickupProof.timestamp).toLocaleString('id-ID')}</span>
                    </p>
                    {selectedOrder.pickupProof.notes && (
                      <p className="text-gray-500 mt-1">Catatan: {selectedOrder.pickupProof.notes}</p>
                    )}
                    {selectedOrder.tracking?.courierName && (
                      <p className="text-gray-500 mt-1">Oleh: {selectedOrder.tracking.courierName}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Informasi Customer</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nama</span>
                    <span className="font-medium text-gray-900">{selectedOrder.customerInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Telepon</span>
                    <span className="font-mono text-gray-900">{selectedOrder.customerInfo.phone}</span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Layanan yang Dipesan</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {item.treatmentType.replaceAll('-', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="bg-gray-900 text-white p-5 rounded-xl">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>Rp {selectedOrder.payment.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Biaya Pengantaran</span>
                    <span>
                      {selectedOrder.payment.deliveryFee === 0 ? "Gratis" : `Rp ${selectedOrder.payment.deliveryFee.toLocaleString("id-ID")}`}
                    </span>
                  </div>
                  {selectedOrder.payment.discountPoints > 0 && (
                    <div className="flex justify-between text-purple-300">
                      <span>Diskon Poin</span>
                      <span>- Rp {selectedOrder.payment.discountPoints.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {selectedOrder.additionalPayment?.required && (
                    <div className="flex justify-between text-amber-300">
                      <span>Pembayaran Tambahan</span>
                      <span>+ Rp {selectedOrder.additionalPayment.amount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-600 pt-2 flex justify-between items-center mt-3">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold">
                      Rp {selectedOrder.payment.finalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pickup Location */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Lokasi Penjemputan</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-800">{selectedOrder.pickupLocation?.address || "Tidak tersedia"}</p>
                  {selectedOrder.pickupLocation?.dropPointName && (
                    <p className="text-sm text-gray-500 mt-1">
                      Drop Point: {selectedOrder.pickupLocation.dropPointName}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Proof */}
              {selectedOrder.payment.proofImage && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Bukti Pembayaran</h3>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
                    <Image
                      src={selectedOrder.payment.proofImage}
                      alt="Bukti Pembayaran"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {selectedOrder.additionalPayment?.required && selectedOrder.additionalPayment.status === "pending" && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      openPaymentModal(selectedOrder)
                    }}
                    className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <UploadIcon className="w-5 h-5" />
                    Bayar Pembayaran Tambahan
                  </button>
                )}
                <button
                  onClick={() => window.open(`https://wa.me/${selectedOrder.customerInfo.phone.replace(/\D/g, '')}`, "_blank")}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircleIcon className="w-5 h-5" />
                  Hubungi Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Payment Upload Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <UploadIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upload Bukti Pembayaran Tambahan</h3>
                <p className="text-sm text-gray-500 font-mono">{selectedOrder.orderNumber}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Amount Display */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-amber-900">Jumlah yang harus dibayar:</span>
                  <span className="text-xl font-bold text-amber-900">
                    Rp {selectedOrder.additionalPayment?.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Bukti Transfer
                </label>
                {previewUrl ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-amber-300">
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                    <button
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                      <UploadIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <p className="font-medium text-gray-900">Klik untuk upload bukti transfer</p>
                    <p className="text-xs text-gray-500 mt-1">Maksimal 5MB (JPG, PNG)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
                {uploadError && (
                  <p className="text-red-600 text-sm mt-2">{uploadError}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (opsional)
                </label>
                <textarea
                  placeholder="Tambahkan catatan jika diperlukan..."
                  rows={2}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={uploading}
                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitAdditionalPayment}
                disabled={!selectedFile || uploading}
                className="flex-1 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload & Bayar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}