// app/layanan/order/steps/pesanan-sukses/page.tsx
"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircleIcon, ArrowRightIcon, MessageCircleIcon, PackageIcon, UserIcon } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

function PesananSuksesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")
  const [countdown, setCountdown] = useState(20)

  // Simpan ke localStorage saat mount (jika belum ada)
  useEffect(() => {
    if (orderNumber && typeof window !== 'undefined') {
      const existing = localStorage.getItem("shoecare_pending_order")
      if (!existing) {
        localStorage.setItem("shoecare_pending_order", JSON.stringify({
          orderId: null, // Tidak tahu ID, hanya nomor
          orderNumber: orderNumber,
          phone: null,
          createdAt: new Date().toISOString()
        }))
      }
    }
  }, [orderNumber])

  // Auto-redirect saat countdown habis
  useEffect(() => {
    if (countdown === 0) {
      router.push(`/layanan/lacak-pesanan?order=${orderNumber || ''}`)
    }
  }, [countdown, router, orderNumber])

  return (
    <div className="relative pb-34 max-w-2xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Berhasil!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Pesanan Anda telah kami terima dan pembayaran anda sedang kami konfirmasi.
        </p>

        {/* Order Number Card */}
        <div className="w-full bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-6">
          <p className="text-sm text-gray-500 mb-1">Nomor Pesanan</p>
          <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
            #{orderNumber || '-'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Simpan nomor ini untuk tracking pesanan
          </p>
        </div>

        {/* Next Steps */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PackageIcon className="w-5 h-5 text-blue-600" />
            Langkah Selanjutnya
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Verifikasi Pembayaran</p>
                <p className="text-xs text-gray-500">Admin akan memverifikasi (1-5 menit)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Kurir Dijadwalkan</p>
                <p className="text-xs text-gray-500">Kurir akan diassign ke pesanan Anda</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">3</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Notifikasi</p>
                <p className="text-xs text-gray-500">Anda akan menerima notifikasi saat kurir berangkat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Register CTA */}
        <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">Buat Akun Sekarang</p>
              <p className="text-xs text-gray-500">Untuk tracking lebih mudah & dapatkan poin</p>
            </div>
            <Link
              href="/auth?tab=register"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700"
            >
              Daftar
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="left-[50%] translate-x-[-50%] px-6 py-6 bottom-0 fixed  bg-white border-t w-full border-gray-100 space-y-3">
        <Link
          href={`/layanan/lacak-pesanan?order=${orderNumber || ''}`}
          className="flex items-center justify-center gap-2 w-full max-w-2xl mx-auto py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200"
        >
          Lacak Pesanan Saya
          <ArrowRightIcon className="w-5 h-5" />
        </Link>

        <a
          href={`https://wa.me/6281234567890?text=Halo, saya sudah order ${orderNumber || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center max-w-2xl mx-auto justify-center gap-2 w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50"
        >
          <MessageCircleIcon className="w-5 h-5 text-green-600" />
          Hubungi Admin
        </a>

        {countdown > 0 && (
          <p className="text-center text-xs text-gray-400">
            Redirect otomatis dalam {countdown} detik...
          </p>
        )}
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="max-w-2xl mx-auto min-h-screen flex items-center justify-center px-6">
      <div className="animate-pulse w-full">
        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
        <div className="h-8 bg-gray-200 rounded-xl w-1/2 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded-xl w-3/4 mx-auto mb-8"></div>
        <div className="h-32 bg-gray-200 rounded-2xl w-full mb-6"></div>
        <div className="h-48 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    </div>
  )
}

export default function PesananSuksesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PesananSuksesContent />
    </Suspense>
  )
}