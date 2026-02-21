// app/layanan/order/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, XIcon } from "lucide-react"
import { getOrderDraft, isOrderDraftExpired, clearOrderDraft } from "@/lib/order-storage"

const STEPS = [
  { path: "/layanan/order/steps/1-pilih-layanan", label: "Layanan", number: 1 },
  { path: "/layanan/order/steps/2-lokasi", label: "Lokasi", number: 2 },
  { path: "/layanan/order/steps/3-detail-pesanan", label: "Detail", number: 3 },
  { path: "/layanan/order/steps/4-pembayaran", label: "Bayar", number: 4 },
]

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  useEffect(() => {
    // Cleanup expired draft
    if (isOrderDraftExpired()) {
      clearOrderDraft()
    }
  }, [])

  const currentStepIndex = STEPS.findIndex(step => pathname.startsWith(step.path))
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const handleExit = () => {
    router.push("/layanan") // Kembali ke dashboard
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium">Kembali</span>
            </button>
            
            <Link href="/layanan" className="flex items-center gap-2 text-gray-400 hover:text-gray-600">
              <XIcon className="w-5 h-5" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {STEPS.map((step, idx) => (
                <span 
                  key={step.path}
                  className={`text-xs font-medium ${
                    idx <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {step.number}. {step.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        {children}
      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Tinggalkan Pesanan?</h3>
            <p className="text-gray-600 text-sm mb-6">
              Progress Anda akan tersimpan selama 24 jam. Anda bisa melanjutkan nanti dari dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Lanjutkan Pesanan
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}