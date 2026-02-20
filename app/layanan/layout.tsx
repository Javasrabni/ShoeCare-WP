// app/layanan/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getOrderDraft, isOrderDraftExpired, clearOrderDraft } from "@/lib/order-storage"

const STEPS = [
  { path: "/layanan/steps/1-pilih-layanan", label: "Pilih Layanan", number: 1 },
  { path: "/layanan/steps/2-lokasi", label: "Lokasi", number: 2 },
  { path: "/layanan/steps/3-detail-pesanan", label: "Detail", number: 3 },
  { path: "/layanan/steps/4-pembayaran", label: "Pembayaran", number: 4 },
]

export default function LayananLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [draftInfo, setDraftInfo] = useState<any>(null)

  useEffect(() => {
    // Check expired draft
    if (isOrderDraftExpired()) {
      clearOrderDraft()
    } else {
      const draft = getOrderDraft()
      if (draft) setDraftInfo(draft)
    }
  }, [])

  const currentStepIndex = STEPS.findIndex(step => pathname.startsWith(step.path))
  const currentStep = currentStepIndex >= 0 ? STEPS[currentStepIndex] : null

  // Resume button untuk kembali ke step tersimpan
  const handleResume = () => {
    if (draftInfo?.step) {
      router.push(`/layanan/steps/${draftInfo.step}-${
        draftInfo.step === 1 ? 'pilih-layanan' :
        draftInfo.step === 2 ? 'lokasi' :
        draftInfo.step === 3 ? 'detail-pesanan' : 'pembayaran'
      }`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div key={step.path} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${index + 1 === currentStep?.number ? 'bg-blue-600 text-white' :
                    index + 1 < (currentStep?.number || 0) ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'}
                `}>
                  {index + 1 < (currentStep?.number || 0) ? '✓' : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-12 md:w-24 h-1 mx-1 md:mx-2
                    ${index + 1 < (currentStep?.number || 0) ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          
          {/* Step Labels */}
          <div className="flex justify-between text-xs text-gray-500">
            {STEPS.map(step => (
              <span key={step.path} className={pathname.startsWith(step.path) ? 'text-blue-600 font-medium' : ''}>
                {step.label}
              </span>
            ))}
          </div>

          {/* Resume Draft Button */}
          {draftInfo && draftInfo.step > 1 && !pathname.includes('pembayaran') && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
              <span className="text-sm text-blue-800">
                Ada pesanan yang belum selesai (Step {draftInfo.step})
              </span>
              <button
                onClick={handleResume}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Lanjutkan →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}