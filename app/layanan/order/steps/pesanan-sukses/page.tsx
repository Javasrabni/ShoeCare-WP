// app/layanan/order/steps/pesanan-sukses/page.tsx
"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircleIcon } from "lucide-react"
import Link from "next/link"

// ⬇️ Tambahkan ini untuk mencegah prerender error
export const dynamic = 'force-dynamic'

// ⬇️ Wrapper component untuk search params
function PesananSuksesContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircleIcon className="w-12 h-12 text-green-600" />
      </div>

      <h1 className="text-3xl font-bold mb-4">Pesanan Berhasil!</h1>
      <p className="text-gray-600 mb-2">
        Nomor Pesanan: <span className="font-mono font-bold text-lg">{orderNumber || '-'}</span>
      </p>
      <p className="text-gray-500 mb-8">
        Simpan nomor pesanan untuk tracking status laundry Anda
      </p>

      <div className="bg-blue-50 p-6 rounded-xl mb-8 text-left">
        <h3 className="font-semibold text-blue-900 mb-2">Langkah Selanjutnya:</h3>
        <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
          <li>Admin akan memverifikasi pembayaran (1-5 menit)</li>
          <li>Kurir akan diassign ke pesanan Anda</li>
          <li>Anda akan menerima notifikasi WhatsApp saat kurir berangkat</li>
        </ol>
      </div>

      <div className="space-y-3">
        <Link
          href={`/layanan/lacak-pesanan?order=${orderNumber || ''}`}
          className="block w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
        >
          Lacak Pesanan Saya
        </Link>

        <a
          href={`https://wa.me/6281234567890?text=Halo , saya sudah order ${orderNumber || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
        >
          Hubungi Admin via WhatsApp
        </a>

        <p className="text-sm text-gray-500 pt-4">
          Atau{' '}
          <Link href="/auth?tab=register" className="text-blue-600 hover:underline font-medium">
            buat akun
          </Link>
          {' '}untuk tracking lebih mudah
        </p>
      </div>

      {countdown > 0 && (
        <p className="text-sm text-gray-400 mt-8">
          Redirect ke halaman tracking dalam {countdown} detik...
        </p>
      )}
    </div>
  )
}

// ⬇️ Loading fallback
function Loading() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="animate-pulse">
        <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
    </div>
  )
}

// ⬇️ Main export dengan Suspense
export default function PesananSuksesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PesananSuksesContent />
    </Suspense>
  )
}