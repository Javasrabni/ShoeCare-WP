// /app/admin/order-tracking/page.tsx - MOBILE FRIENDLY DESIGN
"use client"

import { useEffect, useState } from "react"
import {
    SearchIcon,
    FilterIcon,
    RefreshCwIcon,
    MapPinIcon,
    PhoneIcon,
    PackageIcon,
    CheckCircleIcon,
    ClockIcon,
    CameraIcon,
    EyeIcon,
    ChevronDownIcon,
    UserIcon,
    TruckIcon,
    CalendarIcon
} from "lucide-react"
import PickupProofViewer from "@/components/orders/PickupProofViewer"

interface TrackingOrder {
    _id: string
    orderNumber: string
    customerName: string
    customerPhone: string
    status: string
    currentStage: string
    pickupAddress: string
    courier: {
        name: string
        phone: string
        vehicleNumber: string
    } | null
    hasPickupProof: boolean
    pickupProofImage: string | null
    pickupProofTimestamp: string | null
    lastUpdate: string
    createdAt: string
}

export default function AdminOrderTrackingPage() {
    const [orders, setOrders] = useState<TrackingOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<TrackingOrder | null>(null)
    const [filter, setFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

    useEffect(() => {
        fetchOrders()
    }, [statusFilter])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const url = new URL("/api/admin/orders/tracking", window.location.origin)
            if (statusFilter && statusFilter !== "all") {
                url.searchParams.set("status", statusFilter)
            }

            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                setOrders(data.data)
            } else {
                console.error("API Error:", data.message)
            }
        } catch (error) {
            console.error("Fetch error:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            "pending": "bg-gray-100 text-gray-700",
            "waiting_confirmation": "bg-yellow-100 text-yellow-700",
            "confirmed": "bg-blue-100 text-blue-700",
            "courier_assigned": "bg-indigo-100 text-indigo-700",
            "pickup_in_progress": "bg-cyan-100 text-cyan-700",
            "picked_up": "bg-orange-100 text-orange-700",
            "in_workshop": "bg-purple-100 text-purple-700",
            "processing": "bg-pink-100 text-pink-700",
            "qc_check": "bg-rose-100 text-rose-700",
            "ready_for_delivery": "bg-teal-100 text-teal-700",
            "delivery_in_progress": "bg-sky-100 text-sky-700",
            "completed": "bg-green-100 text-green-700",
            "cancelled": "bg-red-100 text-red-700"
        }
        return colors[status] || "bg-gray-100 text-gray-700"
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
        } catch {
            return "-"
        }
    }

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return "-"
        }
    }

    const filteredOrders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(filter.toLowerCase()) ||
        order.customerName.toLowerCase().includes(filter.toLowerCase()) ||
        order.customerPhone.includes(filter)
    )

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Order Tracking</h1>
                            <p className="text-sm text-gray-500 mt-1">Pantau status semua order secara real-time</p>
                        </div>

                        {/* Stats Summary - Desktop */}
                        <div className="hidden md:flex gap-4">
                            <div className="bg-blue-50 px-4 py-2 rounded-lg">
                                <p className="text-xs text-blue-600 font-medium">Total Order</p>
                                <p className="text-lg font-bold text-blue-900">{orders.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nomor order, nama, atau telepon..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Menunggu Pembayaran</option>
                                <option value="waiting_confirmation">Menunggu Konfirmasi</option>
                                <option value="confirmed">Dikonfirmasi</option>
                                <option value="courier_assigned">Kurir Ditugaskan</option>
                                <option value="pickup_in_progress">Menuju Lokasi</option>
                                <option value="picked_up">Barang Diambil</option>
                                <option value="in_workshop">Di Workshop</option>
                                <option value="processing">Sedang Dikerjakan</option>
                                <option value="qc_check">QC Check</option>
                                <option value="ready_for_delivery">Siap Diantar</option>
                                <option value="delivery_in_progress">Dalam Pengantaran</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>

                            <button
                                onClick={fetchOrders}
                                className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                                title="Refresh"
                            >
                                <RefreshCwIcon size={18} className="text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCwIcon className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <PackageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Tidak ada order ditemukan</p>
                    </div>
                ) : (
                    <div className="space-y-3 lg:space-y-0 flex flex-col lg:flex-row lg:flex-wrap gap-3">
                        {filteredOrders.map((order) => (
                            <div
                                key={order._id}
                                className="lg:w-[49%] h-fit lg:shrink-0 bg-white lg:justify-between rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Card Header - Always visible */}
                                <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-bold text-gray-900 text-sm md:text-base">
                                                    {order.orderNumber}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {order.currentStage}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <UserIcon size={14} />
                                                <span className="truncate text-black">{order.customerName}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                <CalendarIcon size={12} />
                                                <span>{formatDate(order.createdAt)} • {formatTime(order.lastUpdate)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {order.hasPickupProof && (
                                                <span className="p-1.5 bg-green-100 text-green-600 rounded-full">
                                                    <CameraIcon size={14} />
                                                </span>
                                            )}
                                            <ChevronDownIcon
                                                size={20}
                                                className={`text-gray-400 transition-transform ${expandedOrder === order._id ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedOrder === order._id && (
                                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                                        {/* Customer Info */}
                                        <div className="py-3 space-y-2">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Info Customer</h4>
                                            <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <UserIcon size={16} className="text-gray-400" />
                                                    <span className="font-medium text-gray-900">{order.customerName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                    <PhoneIcon size={16} className="text-gray-400" />
                                                    <a href={`tel:${order.customerPhone}`} className="hover:text-blue-600">
                                                        {order.customerPhone}
                                                    </a>
                                                </div>
                                                <div className="flex items-start gap-2 text-sm text-gray-600 mt-1">
                                                    <MapPinIcon size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">{order.pickupAddress}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Courier Info */}
                                        {order.courier && (
                                            <div className="py-3 space-y-2">
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kurir</h4>
                                                <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <TruckIcon size={16} className="text-gray-400" />
                                                        <span className="font-medium text-gray-900">{order.courier.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                        <PhoneIcon size={16} className="text-gray-400" />
                                                        <a href={`tel:${order.courier.phone}`} className="hover:text-blue-600">
                                                            {order.courier.phone}
                                                        </a>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                        <PackageIcon size={16} className="text-gray-400" />
                                                        <span>{order.courier.vehicleNumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pickup Proof */}
                                        {order.hasPickupProof && (
                                            <div className="py-3 space-y-2">
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bukti Penjemputan</h4>
                                                <PickupProofViewer
                                                    orderId={order._id}
                                                    imageUrl={order.pickupProofImage}
                                                    timestamp={order.pickupProofTimestamp}
                                                />
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="pt-3 flex gap-2">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                                            >
                                                <EyeIcon size={16} />
                                                Detail Lengkap
                                            </button>
                                        </div>
                                    </div>

                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    )
}

// Detail Modal Component
function OrderDetailModal({ order, onClose }: { order: TrackingOrder; onClose: () => void }) {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            "pending": "bg-gray-100 text-gray-700",
            "waiting_confirmation": "bg-yellow-100 text-yellow-700",
            "confirmed": "bg-blue-100 text-blue-700",
            "courier_assigned": "bg-indigo-100 text-indigo-700",
            "pickup_in_progress": "bg-cyan-100 text-cyan-700",
            "picked_up": "bg-orange-100 text-orange-700",
            "in_workshop": "bg-purple-100 text-purple-700",
            "processing": "bg-pink-100 text-pink-700",
            "qc_check": "bg-rose-100 text-rose-700",
            "ready_for_delivery": "bg-teal-100 text-teal-700",
            "delivery_in_progress": "bg-sky-100 text-sky-700",
            "completed": "bg-green-100 text-green-700",
            "cancelled": "bg-red-100 text-red-700"
        }
        return colors[status] || "bg-gray-100 text-gray-700"
    }
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Detail Order</h2>
                        <p className="text-sm text-gray-500 font-mono">{order.orderNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <span className="sr-only">Tutup</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Status */}
                    <div className={`p-4 rounded-xl ${getStatusColor(order.status)}`}>
                        <p className="text-xs font-medium opacity-75 mb-1">Status Saat Ini</p>
                        <p className="text-lg font-bold">{order.currentStage}</p>
                        <p className="text-xs mt-1 opacity-75">
                            Update terakhir: {new Date(order.lastUpdate).toLocaleString('id-ID')}
                        </p>
                    </div>

                    {/* Customer Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <UserIcon size={16} className="text-gray-400" />
                            Info Customer
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                            <p className="font-medium text-gray-900">{order.customerName}</p>
                            <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 text-sm text-blue-600">
                                <PhoneIcon size={14} />
                                {order.customerPhone}
                            </a>
                            <p className="flex items-start gap-2 text-sm text-gray-600">
                                <MapPinIcon size={14} className="mt-0.5 shrink-0" />
                                {order.pickupAddress}
                            </p>
                        </div>
                    </div>

                    {/* Courier Info */}
                    {order.courier && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <TruckIcon size={16} className="text-gray-400" />
                                Info Kurir
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                <p className="font-medium text-gray-900">{order.courier.name}</p>
                                <a href={`tel:${order.courier.phone}`} className="flex items-center gap-2 text-sm text-blue-600">
                                    <PhoneIcon size={14} />
                                    {order.courier.phone}
                                </a>
                                <p className="text-sm text-gray-600">No. Kendaraan: {order.courier.vehicleNumber}</p>
                            </div>
                        </div>
                    )}

                    {/* Pickup Proof */}
                    {order.hasPickupProof && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <CameraIcon size={16} className="text-gray-400" />
                                Bukti Penjemputan
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <img
                                    src={order.pickupProofImage!}
                                    alt="Bukti pickup"
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Diupload: {order.pickupProofTimestamp ? new Date(order.pickupProofTimestamp).toLocaleString('id-ID') : '-'}
                                </p>
                                <a
                                    href={order.pickupProofImage!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                >
                                    Lihat ukuran penuh
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}