// /app/dashboard/kurir/queue/page.tsx - IMPROVED UI
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
    MapPinIcon,
    PhoneIcon,
    CheckIcon,
    Loader2Icon,
    PackageIcon,
    UserIcon,
    ClockIcon,
    ChevronRightIcon,
    AlertCircleIcon,
    BuildingIcon,
    NavigationIcon
} from "lucide-react"

interface Order {
    _id: string
    orderNumber: string
    customerInfo: { name: string; phone: string }
    pickupLocation: {
        address: string;
        dropPointName?: string;
        coordinates?: { lat: number; lng: number }
    }
    payment?: { finalAmount: number }
    createdAt: string
    queueInfo?: {
        assignedAt: string
        assignedBy: string
        notes?: string
    }
}

export default function CourierQueuePage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [hasActiveTask, setHasActiveTask] = useState(false)
    const [activeOrder, setActiveOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [acceptingId, setAcceptingId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchQueue()
        const interval = setInterval(fetchQueue, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchQueue = async () => {
        try {
            const res = await fetch("/api/courier/orders/queue")
            const data = await res.json()

            if (data.success) {
                setOrders(data.data || [])
                setHasActiveTask(data.hasActiveTask)
                setActiveOrder(data.activeOrder)
            } else {
                setError(data.message || "Gagal memuat data")
            }
        } catch (err) {
            setError("Terjadi kesalahan saat memuat data")
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (orderId: string) => {
        if (hasActiveTask) {
            alert("Anda masih memiliki tugas aktif. Selesaikan tugas sebelumnya terlebih dahulu.")
            return
        }

        setAcceptingId(orderId)
        try {
            const res = await fetch(`/api/courier/orders/${orderId}/accept`, {
                method: "POST"
            })
            const data = await res.json()

            if (data.success) {
                router.push("/dashboard/kurir/active-order")
            } else {
                alert(data.message || "Gagal menerima order")
                if (data.activeOrder) {
                    setHasActiveTask(true)
                    setActiveOrder(data.activeOrder)
                }
            }
        } catch (error) {
            alert("Terjadi kesalahan")
        } finally {
            setAcceptingId(null)
        }
    }

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "Baru saja"
        try {
            return new Date(dateString).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return "Invalid date"
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2Icon className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Antrian Tugas</h1>
                            <p className="text-slate-500 text-sm mt-0.5">
                                {orders.length} order menunggu penjemputan
                            </p>
                        </div>
                        <button
                            onClick={fetchQueue}
                            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
                        >
                            <Loader2Icon className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Task Warning */}
            {hasActiveTask && activeOrder && (
                <div className="p-4">
                    <div 
                        onClick={() => router.push('/dashboard/kurir/active-order')}
                        className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                            <AlertCircleIcon className="text-amber-600" size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-amber-800">
                                Anda sedang mengerjakan tugas lain
                            </p>
                            <p className="text-sm text-amber-600 mt-0.5">
                                Order #{activeOrder.orderNumber}
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-700">
                                Lanjutkan tugas
                                <ChevronRightIcon size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-4 max-w-3xl mx-auto">
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PackageIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            Tidak ada antrian
                        </h3>
                        <p className="text-slate-500 text-sm">
                            Belum ada order yang ditugaskan ke Anda
                        </p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div
                            key={order._id}
                            className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${
                                hasActiveTask ? 'border-slate-200 opacity-60' : 'border-slate-200'
                            }`}
                        >
                            {/* Assignment Info */}
                            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
                                <BuildingIcon size={16} className="text-indigo-600" />
                                <span className="text-sm text-indigo-800">
                                    Ditugaskan oleh <strong>{order.queueInfo?.assignedBy || 'Admin'}</strong>
                                </span>
                                <span className="text-indigo-300 mx-1">•</span>
                                <ClockIcon size={14} className="text-indigo-500" />
                                <span className="text-xs text-indigo-600">
                                    {formatDate(order.queueInfo?.assignedAt)}
                                </span>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Order Info */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 font-mono">
                                            {order.orderNumber}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long'
                                            })}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                        Pickup
                                    </span>
                                </div>

                                {/* Customer Info */}
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <UserIcon size={24} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">{order.customerInfo?.name}</p>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <PhoneIcon size={12} />
                                            {order.customerInfo?.phone}
                                        </p>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                                    <MapPinIcon size={18} className="text-red-500 shrink-0 mt-0.5" />
                                    <p className="leading-relaxed line-clamp-2">{order.pickupLocation?.address}</p>
                                </div>

                                {/* Notes */}
                                {order.queueInfo?.notes && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                        <p className="font-medium mb-1 flex items-center gap-1">
                                            <AlertCircleIcon size={14} />
                                            Catatan Admin
                                        </p>
                                        {order.queueInfo.notes}
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={() => handleAccept(order._id)}
                                    disabled={hasActiveTask || acceptingId === order._id}
                                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                                        hasActiveTask
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : acceptingId === order._id
                                            ? 'bg-blue-400 text-white cursor-wait'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200'
                                    }`}
                                >
                                    {acceptingId === order._id ? (
                                        <>
                                            <Loader2Icon className="w-5 h-5 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : hasActiveTask ? (
                                        'Selesaikan Tugas Aktif Terlebih Dahulu'
                                    ) : (
                                        <>
                                            <CheckIcon className="w-5 h-5" />
                                            Terima Tugas
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}