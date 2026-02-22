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
  const [guestOrder, setGuestOrder] = useState<any>(null)

  // Tambahkan useEffect untuk load dari localStorage (hanya client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pending = localStorage.getItem("shoecare_pending_order")
      console.log("Loading from localStorage:", pending) // Debug
      if (pending) {
        try {
          const parsed = JSON.parse(pending)
          console.log("Parsed guestOrder:", parsed) // Debug
          setGuestOrder(parsed)
        } catch (e) {
          console.error("Failed to parse pending order", e)
        }
      }
    }
  }, [])

  // Fetch user orders saat login dan tidak ada order di URL
  useEffect(() => {
    if (isAuthenticated && user?.phone && !orderNumberFromUrl) {
      fetchUserOrders(user.phone)
    }
  }, [isAuthenticated, user, orderNumberFromUrl])

  // Auto-track jika ada order di URL
  useEffect(() => {
    if (orderNumberFromUrl) {
      const cleanOrderId = orderNumberFromUrl.trim().toUpperCase()
      setSelectedOrderId(cleanOrderId)
      fetchTrackingData(cleanOrderId)
    }
  }, [orderNumberFromUrl])

  const fetchUserOrders = async (phone: string) => {
    setFetchingOrders(true)
    try {
      const res = await fetch(`/api/customer/orders?phone=${phone}`)
      const data = await res.json()
      if (data.success) {
        // Filter hanya order aktif (belum completed/cancelled)
        const activeOrders = data.data.filter((o: UserOrder) =>
          !['completed', 'cancelled', 'delivered'].includes(o.status)
        )
        setUserOrders(activeOrders)
        console.log(data.data)
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

  // ============================================
  // VIEW 1: LIST ORDER AKTIF (Member, tanpa query)
  // ============================================
  if (isAuthenticated && !orderNumberFromUrl) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        {/* Header */}
        {pathname !== "/layanan" && (
          <div className="flex items-center gap-4 px-6 py-4">
            <button
              onClick={() => router.push("/layanan")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 cursor-pointer hover:bg-gray-100"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
          </div>
        )}

        <div className="flex-1 px-6 py-6">
          {/* Greeting */}
          <div className="mb-6">
            <p className="text-gray-500 text-sm">Halo,</p>
            <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
          </div>

          {/* Loading */}
          {fetchingOrders && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!fetchingOrders && userOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">Tidak ada pesanan aktif</p>
              <p className="text-sm text-gray-400 mb-6">Pesanan yang sudah selesai tidak ditampilkan di sini</p>
              <button
                onClick={() => router.push("/layanan/order/steps/1-pilih-layanan")}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700"
              >
                Buat Pesanan Baru
              </button>
            </div>
          )}

          {/* List Order Aktif */}
          {!fetchingOrders && userOrders.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-3">
                {userOrders.length} pesanan aktif
              </p>
              {userOrders.map((order) => (
                <button
                  key={order._id}
                  onClick={() => handleTrack(order.orderNumber)}
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {order.status === 'pending' ? 'Menunggu' :
                        order.status === 'processing' ? 'Diproses' : 'Aktif'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {order.items?.length || 0} item • {order.items?.[0]?.treatmentName || 'Treatment'}
                    </p>
                    <p className="font-bold text-blue-600">
                      Rp {(order.payment?.finalAmount || order.payment?.amount || 0).toLocaleString('id-ID')}
                    </p>
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

        {/* Buat Pesanan Baru */}
        {/* <div className="bg-white border-t border-gray-100 p-4">
          <button
            onClick={() => router.push("/layanan/order/steps/1-pilih-layanan")}
            className="w-full py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200"
          >
            Buat Pesanan Baru
          </button>
        </div> */}
      </div>
    )
  }

  // ============================================
  // VIEW 2: DETAIL TRACKING (Dengan query order=)
  // ============================================
  if (orderNumberFromUrl && trackingData) {
    const currentIndex = trackingData.timeline?.findIndex(
      (t: any) => t.status === trackingData.currentStage
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
            {trackingData.timeline?.[currentIndex]?.label || trackingData.status}
          </span>
        </div>

        {/* Live Status */}
        {trackingData.courier?.pickupTime && !trackingData.courier?.deliveryTime && (
          <div className="mx-4 bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <TruckIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Kurir Menuju Lokasi</p>
              <p className="text-xs text-gray-500">Estimasi pickup: {trackingData.courier.pickupTime}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="mx-4 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Status Pesanan</h3>
          <div className="space-y-0">
            {trackingData.timeline?.map((item: any, idx: number) => {
              const isActive = idx <= currentIndex
              const isCurrent = idx === currentIndex

              return (
                <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {idx < trackingData.timeline.length - 1 && (
                    <div className={`absolute left-4 top-8 w-0.5 h-full ${idx < currentIndex ? 'bg-blue-500' : 'bg-gray-200'
                      }`} />
                  )}

                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm ${isActive
                    ? isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                    }`}>
                    {isActive ? <CheckCircleIcon className="w-4 h-4" /> : item.icon}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <h4 className={`font-medium text-sm ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {item.label}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.description}
                    </p>
                    {isActive && item.timestamp && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // VIEW 3: FORM INPUT + GUEST ORDERS (Guest atau member dengan query tapi belum fetch)
  // ============================================

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4">
        <button
          onClick={() => router.push("/layanan")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Lacak Pesanan</h1>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {/* Input Form */}
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
                className="w-full p-4 pl-12 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase text-gray-900"
              />
              <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={() => handleTrack()}
              disabled={loading || !selectedOrderId.trim()}
              className="px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Guest Orders dari LocalStorage */}
        {guestOrder && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Pesanan Aktif Anda</h3>
            <button
              onClick={() => handleTrack(guestOrder.orderNumber)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono font-bold text-gray-900">{guestOrder.orderNumber}</p>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Aktif
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm font-medium">
                <span>Lacak Pesanan</span>
                <ChevronRightIcon className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Ajakan Daftar Member */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <PackageIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">Jadilah Member ShoeCare</p>
              <p className="text-sm text-gray-600 mb-3">
                Daftar sekarang untuk tracking lebih mudah, dapatkan poin loyalitas, dan nikmati promo eksklusif!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/auth?tab=register")}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700"
                >
                  Daftar Gratis
                </button>
                <button
                  onClick={() => router.push("/auth?tab=login")}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="max-w-2xl mx-auto min-h-screen flex items-center justify-center px-6">
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