"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { 
  PhoneIcon, 
  CheckIcon, 
  XIcon, 
  TruckIcon, 
  EyeIcon,
  MessageCircleIcon,
  AlertTriangleIcon,
  Loader2Icon,
  PackageIcon,
  PencilIcon,
  ChevronDownIcon,
  MapPinIcon,
  WalletIcon,
  MinusIcon,
  PlusIcon
} from "lucide-react"

// ==================== TYPES ====================

interface OrderItem {
  itemType: string
  treatmentType: string
  treatmentName: string
  price: number
  quantity: number
}

interface Order {
  _id: string
  orderNumber: string
  customerInfo: {
    name: string
    phone: string
    isGuest: boolean
    userId?: string
  }
  serviceType: string
  pickupLocation: {
    address?: string
    dropPointName?: string
    distanceKM?: number
  }
  items?: OrderItem[]
  payment: {
    method: "qris" | "transfer"
    finalAmount: number
    status: string
    proofImage?: string
    subtotal: number
    deliveryFee: number
    discountPoints: number
  }
  loyaltyPoints?: {
    earned: number
    used: number
  }
  status: string
  createdAt: string
}

interface Courier {
  _id: string
  name: string
  phone: string
  courierInfo?: {
    vehicleType: string
    vehicleNumber: string
  }
}

// ==================== CONSTANTS ====================

const TREATMENT_OPTIONS = [
  { id: "fast-clean", name: "Fast Clean", price: 35000, description: "Pembersihan cepat 30 menit" },
  { id: "deep-clean", name: "Deep Clean", price: 50000, description: "Pembersihan menyeluruh" },
  { id: "repaint", name: "Repaint", price: 150000, description: "Pengecatan ulang" },
  { id: "unyellowing", name: "Unyellowing", price: 80000, description: "Hilangkan kekuningan" },
  { id: "sole-repair", name: "Sole Repair", price: 100000, description: "Perbaikan sol" },
  { id: "leather-care", name: "Leather Care", price: 75000, description: "Perawatan kulit" },
]

// ==================== MODAL COMPONENTS ====================

function ImageModal({ 
  isOpen, 
  imageUrl, 
  onClose 
}: { 
  isOpen: boolean
  imageUrl: string | null
  onClose: () => void
}) {
  if (!isOpen || !imageUrl) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">Bukti Pembayaran</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative w-full h-[60vh]">
            <Image
              src={imageUrl}
              alt="Bukti Pembayaran"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <a 
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Buka di Tab Baru
          </a>
        </div>
      </div>
    </div>
  )
}

function RejectModal({ 
  isOpen, 
  order, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean
  order: Order | null
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setReason("")
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen || !order) return null

  const usedPoints = order.loyaltyPoints?.used ?? 0

  const handleSubmit = async () => {
    if (!reason.trim()) return
    setIsSubmitting(true)
    await onConfirm(reason)
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangleIcon className="w-8 h-8" />
          <h3 className="text-xl font-bold">Batalkan Order</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Order: <span className="font-mono font-bold text-gray-800">{order.orderNumber}</span>
        </p>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Alasan Pembatalan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Bukti pembayaran palsu, jumlah transfer tidak sesuai, dll"
            rows={3}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
        </div>

        {usedPoints > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Poin loyalitas sebesar <span className="font-bold">{usedPoints.toLocaleString("id-ID")}</span> akan dikembalikan ke customer
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Ya, Batalkan"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ 
  isOpen, 
  order, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean
  order: Order | null
  onClose: () => void
  onConfirm: (items: any[], reason: string) => void
}) {
  const [items, setItems] = useState<any[]>([])
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && order) {
      setItems(order.items?.map((item, idx) => ({ ...item, id: idx.toString() })) || [])
      setReason("")
    }
  }, [isOpen, order])

  if (!isOpen || !order) return null

  const addItem = (treatment: typeof TREATMENT_OPTIONS[0]) => {
    setItems([...items, {
      id: Date.now().toString(),
      itemType: "Sepatu",
      treatmentType: treatment.id,
      treatmentName: treatment.name,
      price: treatment.price,
      quantity: 1
    }])
  }

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) }
      }
      return item
    }))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleSubmit = async () => {
    if (!reason.trim() || items.length === 0) return
    setIsSubmitting(true)
    const cleanItems = items.map(({ id, ...rest }) => rest)
    await onConfirm(cleanItems, reason)
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 text-blue-600">
            <PencilIcon className="w-6 h-6" />
            <h3 className="text-xl font-bold text-gray-800">Edit Order</h3>
          </div>
          <p className="text-gray-500 mt-1 font-mono">{order.orderNumber}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Item Saat Ini
            </label>
            {items.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Belum ada item</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50/70 rounded-xl">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{item.treatmentName}</p>
                      <p className="text-xs text-gray-500">Rp {item.price.toLocaleString("id-ID")} / pcs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center hover:bg-blue-100 text-blue-600 transition-colors"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium text-gray-700">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center hover:bg-blue-100 text-blue-600 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-2 w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Treatment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tambah Layanan
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TREATMENT_OPTIONS.map((treatment) => (
                <button
                  key={treatment.id}
                  onClick={() => addItem(treatment)}
                  className="p-4 border border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
                >
                  <p className="font-medium text-sm text-gray-800 group-hover:text-blue-700">{treatment.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{treatment.description}</p>
                  <p className="text-blue-600 font-bold text-sm mt-2">
                    Rp {treatment.price.toLocaleString("id-ID")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Subtotal Baru</span>
              <span className="text-xl font-bold text-blue-600">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alasan Perubahan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Customer request upgrade dari fast clean ke deep clean"
              rows={2}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || items.length === 0 || isSubmitting}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== MAIN PAGE ====================

export default function ManajemenOrderPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrders()
    fetchCouriers()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders/pending")
      const data = await res.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch orders")
    }
    setLoading(false)
  }

  const fetchCouriers = async () => {
    try {
      const res = await fetch("/api/admin/couriers/available")
      const data = await res.json()
      if (data.success) {
        setCouriers(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch couriers")
    }
  }

  const handleConfirm = useCallback(async (orderId: string) => {
    setProcessingIds(prev => new Set(prev).add(orderId))
    
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: "POST"
      })
      if (res.ok) {
        fetchOrders()
      } else {
        alert("Gagal konfirmasi order")
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    }
    
    setProcessingIds(prev => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
  }, [])

  const handleReject = useCallback(async (orderId: string, reason: string) => {
    setProcessingIds(prev => new Set(prev).add(orderId))
    
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      })

      if (res.ok) {
        setRejectModalOpen(false)
        setSelectedOrder(null)
        fetchOrders()
      } else {
        alert("Gagal membatalkan order")
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    }
    
    setProcessingIds(prev => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
  }, [])

  const handleEdit = useCallback(async (orderId: string, newItems: any[], reason: string) => {
    setProcessingIds(prev => new Set(prev).add(orderId))
    
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newItems, reason })
      })

      if (res.ok) {
        setEditModalOpen(false)
        setSelectedOrder(null)
        fetchOrders()
      } else {
        alert("Gagal edit order")
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    }
    
    setProcessingIds(prev => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
  }, [])

  const handleAssignCourier = useCallback(async (orderId: string, courierId: string) => {
    if (!courierId) return
    
    setProcessingIds(prev => new Set(prev).add(orderId))
    
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-courier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierId })
      })
      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      alert("Gagal assign kurir")
    }
    
    setProcessingIds(prev => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
  }, [])

  const openRejectModal = useCallback((order: Order) => {
    setSelectedOrder(order)
    setRejectModalOpen(true)
  }, [])

  const openEditModal = useCallback((order: Order) => {
    setSelectedOrder(order)
    setEditModalOpen(true)
  }, [])

  const closeRejectModal = useCallback(() => {
    setRejectModalOpen(false)
    setTimeout(() => setSelectedOrder(null), 300)
  }, [])

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false)
    setTimeout(() => setSelectedOrder(null), 300)
  }, [])

  const isProcessing = (orderId: string) => processingIds.has(orderId)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2Icon className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-[poppins]">Manajemen Order</h1>
        <p className="text-gray-500 mt-2">Kelola dan proses pesanan customer</p>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-xs">
          <PackageIcon className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <p className="text-gray-500 text-lg">Belum ada pesanan</p>
          <p className="text-gray-400 text-sm mt-2">Atau semua order sudah diproses</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order._id
            
            return (
              <div 
                key={order._id} 
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Header Card */}
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg text-gray-800 font-[poppins]">
                          {order.orderNumber}
                        </h3>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          order.payment.method === "qris" 
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {order.payment.method.toUpperCase()}
                        </span>
                        {!order.customerInfo.isGuest && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Member
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 font-medium mt-1">{order.customerInfo.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <PhoneIcon className="w-4 h-4" />
                        {order.customerInfo.phone}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600 font-[poppins]">
                        Rp {order.payment.finalAmount.toLocaleString("id-ID")}
                      </p>
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mt-3 ml-auto transition-colors"
                      >
                        {isExpanded ? "Sembunyikan" : "Lihat Detail"}
                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                    {/* Layanan yang Dipilih */}
                    <div className="mt-5">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <PackageIcon className="w-4 h-4 text-blue-500" />
                        Layanan yang Dipilih
                      </h4>
                      <div className="space-y-2">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-blue-50/50 rounded-xl">
                              <div>
                                <p className="font-medium text-sm text-gray-800">{item.treatmentName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.itemType} × {item.quantity}</p>
                              </div>
                              <p className="font-semibold text-blue-600">
                                Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm italic">Tidak ada data item</p>
                        )}
                      </div>
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(order)}
                        className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit Layanan
                      </button>
                    </div>

                    {/* Info Tambahan */}
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Alamat Penjemputan</p>
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {order.pickupLocation?.address || "Tidak tersedia"}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Drop Point Terdekat</p>
                        <p className="text-sm text-gray-700 font-medium">
                          {order.pickupLocation?.dropPointName || "-"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.pickupLocation?.distanceKM ? `${order.pickupLocation.distanceKM} km dari lokasi` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Rincian Pembayaran */}
                    <div className="mt-5 p-5 bg-gray-50 rounded-xl">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <WalletIcon className="w-4 h-4 text-blue-500" />
                        Rincian Pembayaran
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1">
                          <span className="text-gray-600">Subtotal Layanan</span>
                          <span className="font-medium">Rp {order.payment.subtotal.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-gray-600">Biaya Penjemputan</span>
                          <span className="font-medium">
                            {order.payment.deliveryFee === 0 ? (
                              <span className="text-green-600">Gratis</span>
                            ) : (
                              `Rp ${order.payment.deliveryFee.toLocaleString("id-ID")}`
                            )}
                          </span>
                        </div>
                        {order.payment.discountPoints > 0 && (
                          <div className="flex justify-between py-1 text-purple-600">
                            <span>Diskon Poin Loyalitas</span>
                            <span className="font-medium">- Rp {order.payment.discountPoints.toLocaleString("id-ID")}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between">
                          <span className="text-gray-700 font-medium">Total Pembayaran</span>
                          <span className="text-xl font-bold text-blue-600">Rp {order.payment.finalAmount.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bukti Pembayaran */}
                    {order.payment.proofImage && (
                      <div className="mt-5 p-5 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-24 relative rounded-xl overflow-hidden border-2 border-white shadow-md">
                              <Image
                                src={order.payment.proofImage}
                                alt="Bukti Pembayaran"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-blue-800">Bukti Pembayaran</p>
                              <p className="text-sm text-blue-600 mt-1">Status: Menunggu verifikasi admin</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedImage(order.payment.proofImage!)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-100 font-medium shadow-sm transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Lihat Detail
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${order.customerInfo.phone}?text=${encodeURIComponent(`Halo ${order.customerInfo.name}, saya admin ShoeCare. Konfirmasi order ${order.orderNumber}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium shadow-sm shadow-green-200 transition-colors"
                  >
                    <MessageCircleIcon className="w-4 h-4" />
                    Hubungi WA
                  </a>

                  <button
                    onClick={() => handleConfirm(order._id)}
                    disabled={isProcessing(order._id) || (order.payment.method === "transfer" && !order.payment.proofImage)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm shadow-blue-200 transition-colors"
                  >
                    {isProcessing(order._id) ? (
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                    {order.payment.method === "transfer" && !order.payment.proofImage 
                      ? "Menunggu Bukti" 
                      : "Terima"}
                  </button>

                  <button
                    onClick={() => openRejectModal(order)}
                    disabled={isProcessing(order._id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium transition-colors"
                  >
                    <XIcon className="w-4 h-4" />
                    Tolak
                  </button>

                  <select
                    onChange={(e) => handleAssignCourier(order._id, e.target.value)}
                    disabled={isProcessing(order._id)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-700"
                    defaultValue=""
                  >
                    <option value="" disabled>👤 Pilih Kurir</option>
                    {couriers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.courierInfo?.vehicleType === "motorcycle" ? "🛵" : "🚗"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <ImageModal 
        isOpen={!!selectedImage} 
        imageUrl={selectedImage} 
        onClose={() => setSelectedImage(null)} 
      />
      
      <RejectModal 
        isOpen={rejectModalOpen} 
        order={selectedOrder} 
        onClose={closeRejectModal}
        onConfirm={(reason) => selectedOrder && handleReject(selectedOrder._id, reason)}
      />

      <EditModal 
        isOpen={editModalOpen} 
        order={selectedOrder} 
        onClose={closeEditModal}
        onConfirm={(items, reason) => selectedOrder && handleEdit(selectedOrder._id, items, reason)}
      />
    </div>
  )
}