"use client"

import { useState, useEffect } from "react"
import { 
  MenuIcon, 
  XIcon,
  TruckIcon,
  PackageIcon,
  UserIcon,
  LogOutIcon,
  MapPinIcon,
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  NavigationIcon,
  PhoneIcon
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { logout } from "@/lib/auth-client"
import Link from "next/link"

interface CourierStats {
  todayDeliveries: number
  totalDeliveries: number
  activeOrder: boolean
}

export default function CourierNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [stats, setStats] = useState<CourierStats>({
    todayDeliveries: 0,
    totalDeliveries: 0,
    activeOrder: false
  })
  const [courierName, setCourierName] = useState("Kurir")

  useEffect(() => {
    fetchCourierStats()
    fetchCourierProfile()
    
    // Polling setiap 30 detik
    const interval = setInterval(fetchCourierStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchCourierStats = async () => {
    try {
      const res = await fetch("/api/courier/stats")
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch courier stats")
    }
  }

  const fetchCourierProfile = async () => {
    try {
      const res = await fetch("/api/me")
      const data = await res.json()
      if (data.success) {
        setCourierName(data.data.name)
      }
    } catch (error) {
      console.error("Failed to fetch profile")
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
    router.refresh()
  }

  const navItems = [
    {
      label: "Antrian",
      path: "/dashboard/kurir/queue",
      icon: <PackageIcon size={20} />,
      badge: null
    },
    {
      label: "Order Aktif",
      path: "/dashboard/kurir/active-order",
      icon: <TruckIcon size={20} />,
      badge: stats.activeOrder ? "!" : null,
      highlight: stats.activeOrder
    },
    {
      label: "Riwayat",
      path: "/dashboard/kurir/history",
      icon: <ClockIcon size={20} />,
      badge: null
    },
    {
      label: "Profil",
      path: "/dashboard/kurir/profile",
      icon: <UserIcon size={20} />,
      badge: null
    }
  ]

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-blue-600 text-white z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <TruckIcon size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg">ShoeCare</h1>
            <p className="text-xs text-blue-100">Kurir Panel</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-white/20 rounded-lg"
        >
          {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40 mt-16" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute right-0 top-0 w-64 h-[calc(100vh-64px)] bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{courierName}</p>
                  <p className="text-xs text-gray-500">Kurir Aktif</p>
                </div>
              </div>
            </div>
            
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive(item.path)
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${item.highlight ? "bg-orange-50 text-orange-600" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              
              <hr className="my-4" />
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl w-full"
              >
                <LogOutIcon size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col z-50">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <TruckIcon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">ShoeCare</h1>
            <p className="text-xs text-gray-500">Kurir Panel</p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="p-4 mx-4 mt-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircleIcon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
              <p className="text-xs text-blue-100">Order Hari Ini</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/20">
            <p className="text-xs text-blue-100">Total: {stats.totalDeliveries} order</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.path)
                  ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              } ${item.highlight && !isActive(item.path) ? "bg-orange-50 text-orange-600 animate-pulse" : ""}`}
            >
              <div className={`${isActive(item.path) ? "text-blue-600" : "text-gray-400"}`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {item.highlight && (
                <span className="ml-auto w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <UserIcon size={20} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{courierName}</p>
              <p className="text-xs text-gray-500">Kurir</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl w-full transition-colors"
          >
            <LogOutIcon size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Spacer for mobile */}
      <div className="md:hidden h-16"></div>
    </>
  )
}