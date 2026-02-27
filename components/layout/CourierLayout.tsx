// /components/layout/CourierLayout.tsx - FIX BOTTOM NAV STYLE
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  ClipboardList, 
  Package,
  User, 
  Home,
  History
} from 'lucide-react';
import Link from 'next/link';

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { href: '/dashboard/kurir', icon: Home, label: 'Beranda' },
    { href: '/dashboard/kurir/queue', icon: ClipboardList, label: 'Antrian' },
    { href: '/dashboard/kurir/active-order', icon: Package, label: 'Tugas' },
    { href: '/dashboard/kurir/history', icon: History, label: 'Riwayat' },
    { href: '/dashboard/kurir/profile', icon: User, label: 'Profil' },
  ];

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 bg-white shadow-lg flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-blue-600">ShoeCare</h1>
            <p className="text-sm text-gray-500">Panel Kurir</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  // ⬅️ MOBILE: Instagram-style Bottom Navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>
      
      {/* Bottom Navigation - Instagram Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center w-full h-full relative"
              >
                <div className={`p-1.5 rounded-lg transition-all ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}>
                  <Icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'fill-current' : ''}
                  />
                </div>
                <span className={`text-[10px] font-medium mt-0.5 ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Safe area for iPhone */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </nav>
    </div>
  );
}