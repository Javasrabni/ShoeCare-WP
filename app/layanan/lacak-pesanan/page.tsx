// app/layanan/lacak-pesanan/page.tsx
"use client"
import { usePathname } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  SearchIcon, PackageIcon, TruckIcon, MapPinIcon,
  ChevronDownIcon, ArrowLeftIcon, ClockIcon, CheckCircleIcon,
  ChevronRightIcon
} from "lucide-react"
import { useAuth } from "@/app/context/userAuth/getUserAuthData."

export const dynamic = 'force-dynamic'

interface UserOrder {
  _id: string
  orderNumber: string
  status: string
  createdAt: string
  payment?: {
    amount: number
    finalAmount?: number
  }
  items: { treatmentName: string; quantity: number; price: number }[]
}

function LacakPesananContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const orderNumberFromUrl = searchParams.get("order")

  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [trackingData, setTrackingData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userOrders, setUserOrders] = useState<UserOrder[]>([])
  const [fetchingOrders, setFetchingOrders] = useState(false)


  // ⬅️ FIX: Array untuk multiple guest orders
  const [guestOrders, setGuestOrders] = useState<any[]>([]);

  // Load dari localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("shoecare_guest_orders");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setGuestOrders(parsed);
            console.log("Loaded guest orders:", parsed.length);
          } else {
            setGuestOrders([parsed]);
          }
        } catch (e) {
          console.error("Failed to parse guest orders", e);
          setGuestOrders([]);
        }
      }

      // Backward compatibility
      const oldFormat = localStorage.getItem("shoecare_pending_order");
      if (oldFormat && !saved) {
        try {
          const parsed = JSON.parse(oldFormat);
          setGuestOrders([parsed]);
          localStorage.setItem("shoecare_guest_orders", JSON.stringify([parsed]));
        } catch (e) {
          console.error("Failed to parse old format", e);
        }
      }
    }
  }, []);

  // Fetch user orders
  useEffect(() => {
    if (isAuthenticated && user?.phone && !orderNumberFromUrl) {
      fetchUserOrders()
    }
  }, [isAuthenticated, user, orderNumberFromUrl])

  useEffect(() => {
    if (orderNumberFromUrl) {
      const cleanOrderId = orderNumberFromUrl.trim().toUpperCase()
      setSelectedOrderId(cleanOrderId)
      fetchTrackingData(cleanOrderId)
    }
  }, [orderNumberFromUrl])

  const fetchUserOrders = async () => {
    setFetchingOrders(true)
    try {
      const res = await fetch("/api/orders/my-orders")
      const data = await res.json()
      if (data.success) {
        setUserOrders(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch user orders")
    }
    setFetchingOrders(false)
  }

  const fetchTrackingData = async (orderId: string) => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/tracking`)
      const data = await res.json()
      if (data.success) {
        setTrackingData(data.data)
      } else {
        setError(data.message || "Order tidak ditemukan")
      }
    } catch (err) {
      setError("Terjadi kesalahan")
    }
    setLoading(false)
  }

  const handleTrack = (orderId?: string) => {
    const trackId = orderId || selectedOrderId
    if (!trackId?.trim()) {
      setError("Silakan masukkan nomor order")
      return
    }
    router.push(`/layanan/lacak-pesanan?order=${trackId.trim().toUpperCase()}`)
  }

  // VIEW 1: Member list
  if (isAuthenticated && !orderNumberFromUrl) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        {pathname !== "/layanan" && (
          <div className="flex items-center gap-4 px-6 py-4">
            <button
              onClick={() => router.push("/layanan")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
          </div>
        )}

        <div className="flex-1 px-6 py-6">
          <div className="mb-6">
            <p className="text-gray-500 text-sm">Halo,</p>
            <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
          </div>

          {fetchingOrders && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          )}

          {!fetchingOrders && userOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">Tidak ada pesanan</p>
              <button
                onClick={() => router.push("/layanan/order/steps/1-pilih-layanan")}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium"
              >
                Buat Pesanan Baru
              </button>
            </div>
          )}

          {!fetchingOrders && userOrders.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-3">
                {userOrders.length} pesanan
              </p>
              {userOrders.map((order) => (
                <button
                  key={order._id}
                  onClick={() => handleTrack(order.orderNumber)}
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-blue-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                      }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm font-medium">
                    <span>Lacak Pesanan</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // VIEW 2: DETAIL TRACKING (Dengan query order=)
  // ============================================
  if (orderNumberFromUrl) {
    // ⬅️ TAMBAHKAN: Loading state
    if (loading) {
      return (
        <div className="max-w-2xl mx-auto pb-24">
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
      )
    }

    // ⬅️ TAMBAHKAN: Error state
    if (error) {
      return (
        <div className="max-w-2xl mx-auto pb-24">
          <div className="flex items-center gap-4 px-4 py-4">
            <button onClick={() => router.push("/layanan")} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Error</h1>
          </div>
          <div className="mx-4 bg-red-50 rounded-2xl p-6 border border-red-100 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push("/layanan/lacak-pesanan")}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl"
            >
              Kembali
            </button>
          </div>
        </div>
      )
    }

    // ⬅️ TAMBAHKAN: Cek trackingData null atau belum fetch
    if (!trackingData) {
      return (
        <div className="max-w-2xl mx-auto pb-24">
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500">Memuat data...</p>
          </div>
        </div>
      )
    }

    // ⬅️ BARU: Sekarang trackingData sudah pasti ada
    const currentIndex = trackingData.timeline?.findIndex(
      (t: any) => t.status === trackingData.status
    ) || -1

    return (
      <div className="max-w-2xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => isAuthenticated
              ? router.push("/layanan/lacak-pesanan")
              : router.push("/layanan")
            }
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Detail Pesanan</h1>
        </div>

        {/* Order Info */}
        <div className="mx-4 bg-blue-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Nomor Order</p>
              <p className="text-2xl font-mono font-bold">{trackingData.orderNumber}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <PackageIcon className="w-6 h-6" />
            </div>
          </div>
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
            {trackingData.status}
          </span>
        </div>

        {/* Timeline */}
        <div className="mx-4 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Status Pesanan</h3>

          {/* ⬅️ TAMBAHKAN: Cek timeline ada dan punya data */}
          {!trackingData.timeline || trackingData.timeline.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Status: {trackingData.status}</p>
              <p className="text-sm text-gray-400 mt-1">
                Dibuat: {new Date(trackingData.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {trackingData.timeline.map((item: any, idx: number) => {
                const isLast = idx === trackingData.timeline.length - 1;
                const isActive = item.status === trackingData.status;
                const isPast = !isActive && idx < currentIndex;

                return (
                  <div key={item.id || idx} className="relative flex gap-4 pb-6 last:pb-0">
                    {!isLast && (
                      <div className={`absolute left-4 top-8 w-0.5 h-full ${isPast || isActive ? 'bg-blue-500' : 'bg-gray-200'
                        }`} />
                    )}

                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm ${isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : isPast
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                      {isPast || isActive ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : (
                        <span>{item.icon || '○'}</span>
                      )}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <h4 className={`font-medium text-sm ${isActive || isPast ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                        {item.label || item.status}
                      </h4>

                      <p className={`text-xs mt-0.5 ${isActive || isPast ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                        {item.description}
                      </p>

                      {item.timestamp && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      )}

                      {item.updatedBy && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          oleh {item.updatedBy}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
  // VIEW 3: Guest form + list
  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
      <div className="flex items-center gap-4 px-4 py-4">
        <button onClick={() => router.push("/layanan")} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Lacak Pesanan</h1>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {/* Input */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Nomor Order</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="SC-2024..."
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                className="w-full p-4 pl-12 bg-white border border-gray-200 rounded-xl font-mono uppercase"
              />
              <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={() => handleTrack()}
              disabled={loading || !selectedOrderId.trim()}
              className="px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        {/* ⬅️ FIX: Render guest orders sebagai array */}
        {guestOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Pesanan Anda ({guestOrders.length})
            </h3>
            <div className="space-y-3">
              {guestOrders.map((order, idx) => (
                <button
                  key={order.orderNumber || idx}
                  onClick={() => handleTrack(order.orderNumber)}
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-blue-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Aktif</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('id-ID')}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm font-medium">
                    <span>Lacak Pesanan</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {guestOrders.length === 0 && !isAuthenticated && (
          <div className="text-center py-8 bg-gray-50 rounded-2xl mb-6">
            <p className="text-gray-500 text-sm">Belum ada pesanan</p>
            <p className="text-xs text-gray-400 mt-1">Pesanan akan muncul setelah checkout</p>
          </div>
        )}

        {/* CTA Register */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100">
          <p className="font-semibold text-gray-900 mb-1">Jadilah Member</p>
          <p className="text-sm text-gray-600 mb-3">Tracking lebih mudah & dapatkan poin</p>
          <div className="flex gap-2">
            <button onClick={() => router.push("/auth?tab=register")} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl">Daftar</button>
            <button onClick={() => router.push("/auth?tab=login")} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl">Login</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="max-w-2xl mx-auto min-h-screen flex items-center justify-center">
      <div className="animate-pulse w-full space-y-4">
        <div className="h-8 bg-gray-200 rounded-xl w-1/3 mx-auto"></div>
        <div className="h-64 bg-gray-200 rounded-2xl w-full"></div>
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