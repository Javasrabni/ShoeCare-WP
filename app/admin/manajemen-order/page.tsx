// /admin/manajemen-order/page.tsx

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
  PlusIcon,
  SearchIcon,
  RefreshCwIcon,
  FilterIcon,
  MoreHorizontalIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  StoreIcon,
  CreditCardIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ArrowUpDownIcon,
  CopyIcon,
  BanknoteIcon,
  QrCodeIcon
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

type SortOption = "newest" | "oldest" | "highest" | "lowest"

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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-lg text-gray-800">Bukti Pembayaran</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 bg-gray-50">
          <div className="relative w-full h-[60vh] rounded-xl overflow-hidden bg-white">
            <Image
              src={imageUrl}
              alt="Bukti Pembayaran"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end bg-white">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl mx-4">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangleIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Batalkan Order</h3>
            <p className="text-sm text-gray-500">Order akan ditolak dan dibatalkan</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Nomor Order</p>
          <p className="font-mono font-bold text-gray-900 text-lg">{order.orderNumber}</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Alasan Pembatalan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Bukti pembayaran palsu, jumlah transfer tidak sesuai, dll"
            rows={3}
            className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
            disabled={isSubmitting}
          />
        </div>

        {usedPoints > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Poin loyalitas sebesar <span className="font-bold">{usedPoints.toLocaleString("id-ID")}</span> akan dikembalikan ke customer
              </span>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <PencilIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Edit Order</h3>
              <p className="text-sm text-gray-500 font-mono">{order.orderNumber}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Items */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Item Saat Ini
            </label>
            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <PackageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Belum ada item</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-blue-50/70 rounded-xl border border-blue-100">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{item.treatmentName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">@ Rp {item.price.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center hover:bg-blue-100 text-blue-600 transition-colors"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-700">{item.quantity}</span>
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
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tambah Layanan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TREATMENT_OPTIONS.map((treatment) => (
                <button
                  key={treatment.id}
                  onClick={() => addItem(treatment)}
                  className="p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group"
                >
                  <p className="font-semibold text-sm text-gray-800 group-hover:text-blue-700">{treatment.name}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{treatment.description}</p>
                  <p className="text-blue-600 font-bold text-sm mt-2">
                    Rp {treatment.price.toLocaleString("id-ID")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-900 text-white p-5 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Subtotal Baru</span>
              <span className="text-2xl font-bold">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Alasan Perubahan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Customer request upgrade dari fast clean ke deep clean"
              rows={2}
              className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 bg-white sticky bottom-0">
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
  const [activeFilter, setActiveFilter] = useState<"all" | "paid" | "unpaid">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showSortDropdown, setShowSortDropdown] = useState(false)

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

  // Sort function
  const sortOrders = (orders: Order[]): Order[] => {
    const sorted = [...orders]
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case "oldest":
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case "highest":
        return sorted.sort((a, b) => b.payment.finalAmount - a.payment.finalAmount)
      case "lowest":
        return sorted.sort((a, b) => a.payment.finalAmount - b.payment.finalAmount)
      default:
        return sorted
    }
  }

  // Filter and sort orders
  const filteredOrders = sortOrders(orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo.phone.includes(searchQuery)

    const matchesFilter =
      activeFilter === "all" ? true :
        activeFilter === "paid" ? order.payment.status === "paid" || order.payment.proofImage :
          activeFilter === "unpaid" ? !order.payment.proofImage && order.payment.method === "transfer" :
            true

    return matchesSearch && matchesFilter
  }))

  const getSortLabel = (option: SortOption): string => {
    const labels: Record<SortOption, string> = {
      newest: "Newest First",
      oldest: "Oldest First",
      highest: "Highest Amount",
      lowest: "Lowest Amount"
    }
    return labels[option]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-500 text-sm">Memuat pesanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-scree">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Orders</span>
                <span>/</span>
                <span className="text-blue-600 font-medium">Incoming</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pesanan Masuk</h1>
              <p className="text-gray-500 text-sm mt-1">Manage and process your new shoe care service requests.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="text-sm text-gray-600 inline">Total Orders</span>
                <span className="bg-blue-600 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">{orders.length}</span>
              </div>
              <button
                onClick={fetchOrders}
                className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCwIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 mt-6">
            {/* Filter Tabs - Scrollable on mobile */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
              {[
                { id: "all", label: "All Orders" },
                { id: "paid", label: "Paid" },
                { id: "unpaid", label: "Unpaid" }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFilter === filter.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search and Sort Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order ID or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDownIcon className="w-4 h-4 text-gray-500" />
                    <span>{getSortLabel(sortBy)}</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
                    {([
                      { value: "newest", label: "Newest First" },
                      { value: "oldest", label: "Oldest First" },
                      { value: "highest", label: "Highest Amount" },
                      { value: "lowest", label: "Lowest Amount" }
                    ] as { value: SortOption; label: string }[]).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value)
                          setShowSortDropdown(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${sortBy === option.value ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <PackageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Tidak ada pesanan</h3>
            <p className="text-gray-500 text-sm">Belum ada pesanan yang masuk atau sesuai filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order._id

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  {/* Main Card Content - Mobile Optimized */}
                  <div className="p-4 sm:p-5">
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-4">
                      {/* Top Row: Order Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 font-mono">
                              {order.orderNumber}
                            </h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${order.payment.method === "qris"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-green-100 text-green-700"
                              }`}>
                              {order.payment.method === "qris" ? "QRIS" : "TRANSFER"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <UserIcon className="w-4 h-4 text-gray-400" />
                              <span className="font-medium truncate">{order.customerInfo.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <PhoneIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{order.customerInfo.phone}</span>
                            </div>
                          </div>

                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {order.payment.proofImage ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                <CheckIcon className="w-3 h-3" />
                                PAID
                              </span>
                            ) : order.payment.method === "transfer" ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                PENDING
                              </span>
                            ) : null}
                            {!order.customerInfo.isGuest && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                MEMBER
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price - Right Side */}
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1 hidden sm:block">Total Price</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-900">
                            Rp {order.payment.finalAmount.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                        <a
                          href={`https://wa.me/${order.customerInfo.phone}?text=${encodeURIComponent(`Halo ${order.customerInfo.name}, saya admin ShoeCare. Terkait order ${order.orderNumber}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium transition-colors text-sm"
                        >
                          <MessageCircleIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">WhatsApp</span>
                          <span className="sm:hidden">WA</span>
                        </a>

                        <button
                          onClick={() => handleConfirm(order._id)}
                          disabled={isProcessing(order._id) || (order.payment.method === "transfer" && !order.payment.proofImage)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                        >
                          {isProcessing(order._id) ? (
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckIcon className="w-4 h-4" />
                          )}
                          Accept
                        </button>

                        <button
                          onClick={() => openRejectModal(order)}
                          disabled={isProcessing(order._id)}
                          className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details - Mobile Optimized */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 sm:px-5 py-5">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Services */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <PackageIcon className="w-4 h-4 text-blue-500" />
                              Layanan yang Dipilih
                            </h4>
                            <div className="space-y-2">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                    <div>
                                      <p className="font-medium text-sm text-gray-800">{item.treatmentName}</p>
                                      <p className="text-xs text-gray-500">{item.quantity} × Rp {item.price.toLocaleString("id-ID")}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-400 text-sm italic">Tidak ada data item</p>
                              )}
                            </div>
                            <button
                              onClick={() => openEditModal(order)}
                              className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <PencilIcon className="w-4 h-4" />
                              Edit Layanan
                            </button>
                          </div>

                          {/* Location Info - Stack on mobile */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <MapPinIcon className="w-4 h-4" />
                                Alamat Penjemputan
                              </div>
                              <p className="text-sm text-gray-800 font-medium">
                                {order.pickupLocation?.address || "Tidak tersedia"}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <StoreIcon className="w-4 h-4" />
                                Drop Point
                              </div>
                              <p className="text-sm text-gray-800 font-medium">
                                {order.pickupLocation?.dropPointName || "-"}
                              </p>
                              {order.pickupLocation?.distanceKM && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {order.pickupLocation.distanceKM} km dari lokasi
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment & Actions Sidebar */}
                        <div className="space-y-4">
                          {/* Payment Details */}
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                              <CreditCardIcon className="w-4 h-4 text-blue-500" />
                              Rincian Pembayaran
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>Rp {order.payment.subtotal.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>Delivery Fee</span>
                                <span className={order.payment.deliveryFee === 0 ? "text-green-600 font-medium" : ""}>
                                  {order.payment.deliveryFee === 0 ? "Gratis" : `Rp ${order.payment.deliveryFee.toLocaleString("id-ID")}`}
                                </span>
                              </div>
                              {order.payment.discountPoints > 0 && (
                                <div className="flex justify-between text-purple-600">
                                  <span>Diskon Poin</span>
                                  <span>- Rp {order.payment.discountPoints.toLocaleString("id-ID")}</span>
                                </div>
                              )}
                              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="text-lg font-bold text-blue-600">Rp {order.payment.finalAmount.toLocaleString("id-ID")}</span>
                              </div>
                            </div>
                          </div>

                          {/* Payment Proof */}
                          {order.payment.proofImage && (
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-blue-900">Bukti Pembayaran</span>
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Verified</span>
                              </div>
                              <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3">
                                <Image
                                  src={order.payment.proofImage}
                                  alt="Bukti Pembayaran"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <button
                                onClick={() => setSelectedImage(order.payment.proofImage!)}
                                className="w-full py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <EyeIcon className="w-4 h-4" />
                                Lihat Detail
                              </button>
                            </div>
                          )}

                          {/* Courier Assignment */}
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Assign Kurir
                            </label>
                            <select
                              onChange={(e) => handleAssignCourier(order._id, e.target.value)}
                              disabled={isProcessing(order._id)}
                              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              defaultValue=""
                            >
                              <option value="" disabled>Pilih Kurir...</option>
                              {couriers.map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.name} • {c.courierInfo?.vehicleType === "motorcycle" ? "Motor" : "Mobil"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expand Toggle */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                    className="w-full py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {isExpanded ? "Sembunyikan Detail" : "Lihat Detail"}
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              Showing <span className="font-semibold text-gray-900">1-{filteredOrders.length}</span> of <span className="font-semibold text-gray-900">{orders.length}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled>
                <ChevronDownIcon className="w-5 h-5 rotate-90" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 text-white font-medium">
                1
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                2
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                3
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                <ChevronDownIcon className="w-5 h-5 -rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>

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