// app/layanan/lacak-pesanan/page.tsx
"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SearchIcon, PackageIcon } from "lucide-react"

// ⬇️ TAMBAHKAN INI
export const dynamic = 'force-dynamic'

// ⬇️ Pisahkan komponen yang pakai useSearchParams
function LacakPesananContent() {
  const searchParams = useSearchParams()
  const initialPhone = searchParams.get("phone") || ""
  
  const [phone, setPhone] = useState(initialPhone)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/customer/orders?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      
      if (data.success) {
        setOrders(data.data)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error("Error:", error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "pending": "Menunggu Konfirmasi",
      "confirmed": "Dikonfirmasi",
      "courier_assigned": "Kurir Ditugaskan",
      "picked_up": "Barang Diambil",
      "in_workshop": "Di Workshop",
      "ready_for_delivery": "Siap Diantar",
      "completed": "Selesai",
      "cancelled": "Dibatalkan"
    }
    return labels[status] || status
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold font-[poppins] mb-2">Lacak Pesanan</h1>
      <p className="text-gray-500 mb-8">Masukkan nomor telepon untuk melihat status pesanan</p>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="tel"
              placeholder="Contoh: 08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-4 pl-12 border rounded-xl focus:ring-2 focus:ring-blue-500"
            />
            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={loading || !phone}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Mencari..." : "Cari"}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && !loading && orders.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <PackageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ditemukan pesanan dengan nomor {phone}</p>
          <p className="text-sm text-gray-400 mt-2">
            Pastikan nomor telepon sesuai dengan yang digunakan saat pemesanan
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Ditemukan {orders.length} pesanan
          </p>
          
          {orders.map((order) => (
            <div key={order._id} className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-lg">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.treatmentName} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tracking Info */}
              {order.tracking?.courierName && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-blue-800">
                    🚚 Kurir: {order.tracking.courierName}
                  </p>
                  {order.tracking.pickupTime && (
                    <p className="text-xs text-blue-600 mt-1">
                      Diambil: {new Date(order.tracking.pickupTime).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold text-blue-600">
                    Rp {order.payment?.finalAmount?.toLocaleString('id-ID') || 0}
                  </p>
                </div>
                
                {/* CTA untuk jadi member */}
                {order.customerInfo?.isGuest && (
                  <button
                    onClick={() => window.location.href = `/auth?tab=register&phone=${phone}`}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                  >
                    Jadikan Akun →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ajakan Login */}
      <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-purple-900">Ingin tracking lebih mudah?</h4>
            <p className="text-sm text-purple-700 mt-1">
              Buat akun untuk melihat semua pesanan tanpa perlu mencari
            </p>
          </div>
          <button 
            onClick={() => window.location.href = "/auth?tab=register"}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium"
          >
            Daftar Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}

// ⬇️ Loading fallback
function Loading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

// ⬇️ Export dengan Suspense
export default function LacakPesananPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LacakPesananContent />
    </Suspense>
  )
}