"use client"

import { usePathname, useRouter } from "next/navigation"
import { 
  HomeIcon, 
  PackageIcon, 
  TruckIcon, 
  UserIcon, 
  ClipboardListIcon,
  MapPinIcon,
  StarIcon,
  LayoutDashboardIcon
} from "lucide-react"
import clsx from "clsx"

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  badge?: number
  highlight?: boolean
}

interface BottomNavProps {
  items: NavItem[]
  userRole: 'admin' | 'courier' | 'customer'
}

export default function BottomNav({ items, userRole }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => pathname === path

  // Warna tema berdasarkan role
  const themeColor = {
    admin: "bg-blue-600",
    courier: "bg-orange-600",
    customer: "bg-green-600"
  }[userRole]

  return (
    <>
      {/* Spacer untuk konten */}
      <div className="md:hidden h-16" />
      
      {/* Bottom Navigation */}
      <nav className={clsx(
        "md:hidden fixed bottom-0 left-0 right-0 h-16 z-50 shadow-lg",
        "bg-white border-t border-gray-200"
      )}>
        <div className="grid grid-cols-5 h-full">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={clsx(
                "flex flex-col items-center justify-center relative",
                "transition-colors duration-200",
                isActive(item.path) ? themeColor + " text-white" : "text-gray-500 hover:text-gray-700",
                item.highlight && !isActive(item.path) && "text-orange-600 animate-pulse"
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge ? (
                  <span className={clsx(
                    "absolute -top-2 -right-2 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center",
                    isActive(item.path) ? "bg-white text-gray-900" : "bg-red-500"
                  )}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : item.highlight && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium truncate max-w-[60px]">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}