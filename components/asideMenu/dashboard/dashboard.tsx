// components/asideMenu/dashboard/dashboard.tsx  (atau components/customer/dashboard.tsx)
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/userAuth/getUserAuthData."
import { TruckIcon, StoreIcon, SearchIcon, PackageIcon } from "lucide-react"

interface DashboardProps {
  userId: string | object
  userRole: string
}

export function Dashboard({ userId, userRole }: DashboardProps) {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (userRole === "admin") {
      router.replace("/admin/dashboard")
    }
  }, [userRole, router])

  // Cek draft yang belum selesai
  const checkDraft = () => {
    if (typeof window === "undefined") return null
    const draft = localStorage.getItem("shoecare_order_draft")
    if (draft) {
      const parsed = JSON.parse(draft)
      const hours = (Date.now() - new Date(parsed.timestamp).getTime()) / (1000 * 60 * 60)
      if (hours < 24) return parsed
    }
    return null
  }

  const draft = checkDraft()

  const continueOrder = () => {
    if (draft?.step) {
      const stepPaths: Record<number, string> = {
        1: "/layanan/order/steps/1-pilih-layanan",
        2: "/layanan/order/steps/2-lokasi",
        3: "/layanan/order/steps/3-detail-pesanan",
        4: "/layanan/order/steps/4-pembayaran"
      }
      router.push(stepPaths[draft.step] || stepPaths[1])
    }
  }

  const startNewOrder = () => {
    localStorage.removeItem("shoecare_order_draft")
    router.push("/layanan/order/steps/1-pilih-layanan")
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Halo, {user?.name || "Guest"}! 👋
        </h1>
        <p className="text-blue-100 text-lg">
          Siap cuci sepatu hari ini? Pilih layanan yang Anda butuhkan.
        </p>
      </div>

      {/* Resume Draft (jika ada) */}
      {draft && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <PackageIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-orange-900">Pesanan Belum Selesai</h3>
                <p className="text-sm text-orange-700">
                  Anda memiliki draft di Step {draft.step} • {draft.serviceType === "antar-jemput" ? "Antar Jemput" : "Drop Point"}
                </p>
              </div>
            </div>
            <button
              onClick={continueOrder}
              className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700"
            >
              Lanjutkan →
            </button>
          </div>
        </div>
      )}

      {/* Main Menu Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Order Baru */}
        <button
          onClick={startNewOrder}
          className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
            <TruckIcon className="w-6 h-6 text-blue-600 group-hover:text-white" />
          </div>
          <h3 className="font-bold text-lg mb-1">Order Baru</h3>
          <p className="text-sm text-gray-500">Pesan laundry sepatu</p>
        </button>

        {/* Lacak Pesanan */}
        <button
          onClick={() => router.push("/layanan/lacak-pesanan")}
          className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-lg transition-all text-left"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
            <SearchIcon className="w-6 h-6 text-green-600 group-hover:text-white" />
          </div>
          <h3 className="font-bold text-lg mb-1">Lacak Pesanan</h3>
          <p className="text-sm text-gray-500">Cek status laundry</p>
        </button>

        {/* Pesanan Saya (khusus member) */}
        {user && (
          <button
            onClick={() => router.push("/layanan/pesanan-saya")}
            className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-purple-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
              <PackageIcon className="w-6 h-6 text-purple-600 group-hover:text-white" />
            </div>
            <h3 className="font-bold text-lg mb-1">Pesanan Saya</h3>
            <p className="text-sm text-gray-500">Riwayat & status</p>
          </button>
        )}

        {/* Drop Point */}
        <button
          onClick={() => router.push("/layanan/drop-point-list")}
          className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all text-left"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors">
            <StoreIcon className="w-6 h-6 text-orange-600 group-hover:text-white" />
          </div>
          <h3 className="font-bold text-lg mb-1">Drop Point</h3>
          <p className="text-sm text-gray-500">Lokasi terdekat</p>
        </button>
      </div>

      {/* Promo atau Info */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold mb-4">Kenapa Memilih Kami?</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">✓</div>
            <div>
              <p className="font-medium">Gratis Ongkir</p>
              <p className="text-sm text-gray-500">Dalam radius 5km dari drop point</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">✓</div>
            <div>
              <p className="font-medium">Garansi Kebersihan</p>
              <p className="text-sm text-gray-500">100% uang kembali jika tidak puas</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">✓</div>
            <div>
              <p className="font-medium">Tracking Real-time</p>
              <p className="text-sm text-gray-500">Pantau status sepatu Anda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guest CTA */}
      {!user && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-purple-900">Buat Akun Member</h4>
              <p className="text-sm text-purple-700 mt-1">
                Dapatkan poin loyalitas, riwayat pesanan, dan promo eksklusif!
              </p>
            </div>
            <button
              onClick={() => router.push("/auth?tab=register")}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium"
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      )}
    </div>
  )
}