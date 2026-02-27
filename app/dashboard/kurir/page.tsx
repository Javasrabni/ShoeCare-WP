// /app/dashboard/kurir/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Star,
  MapPin,
  Navigation,
  AlertCircle
} from "lucide-react"

interface Stats {
  todayPickups: number
  totalPickups: number
  activeOrder: {
    hasActive: boolean
    orderNumber?: string
    status?: string
  }
  vehicleInfo: {
    type: string
    number: string
  }
  isAvailable: boolean
}

export default function CourierDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/courier/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">Selamat Datang!</h1>
        <p className="text-blue-100 text-sm">Siap melayani customer hari ini</p>
        
        <div className="mt-4 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            stats?.activeOrder.hasActive 
              ? 'bg-orange-500' 
              : stats?.isAvailable 
              ? 'bg-green-500' 
              : 'bg-gray-500'
          }`}>
            {stats?.activeOrder.hasActive ? '🔴 Sedang Bertugas' : 
             stats?.isAvailable ? '🟢 Tersedia' : '⚪ Offline'}
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
            {stats?.vehicleInfo.type === 'motorcycle' ? '🏍️' : '🚗'} {stats?.vehicleInfo.number}
          </span>
        </div>
      </div>

      {/* Active Order Alert */}
      {stats?.activeOrder.hasActive && (
        <div 
          onClick={() => router.push('/dashboard/kurir/active-order')}
          className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
        >
          <AlertCircle className="text-orange-500 shrink-0" size={24} />
          <div className="flex-1">
            <p className="font-semibold text-orange-800">Tugas Aktif</p>
            <p className="text-sm text-orange-600">Order #{stats.activeOrder.orderNumber}</p>
          </div>
          <Navigation className="text-orange-400" size={20} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/dashboard/kurir/queue')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Package className="text-blue-600" size={24} />
          </div>
          <span className="font-semibold text-gray-700 text-sm">Lihat Antrian</span>
        </button>
        
        <button
          onClick={() => router.push('/dashboard/kurir/active-order')}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Navigation className="text-green-600" size={24} />
          </div>
          <span className="font-semibold text-gray-700 text-sm">Tugas Aktif</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Package size={16} />
            <span className="text-xs">Pickup Hari Ini</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.todayPickups || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <CheckCircle size={16} />
            <span className="text-xs">Total Pickup</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.totalPickups || 0}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Aktivitas Terbaru</h3>
        <div className="text-center text-gray-400 py-8">
          <Clock size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada aktivitas hari ini</p>
        </div>
      </div>
    </div>
  )
}