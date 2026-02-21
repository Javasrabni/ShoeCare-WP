// app/layanan/steps/4-pembayaran/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { 
  ArrowLeftIcon, CheckIcon, CopyIcon, QrCodeIcon, BanknoteIcon, 
  ClockIcon, UploadIcon, Loader2Icon, CheckCircleIcon, HelpCircleIcon,
  ChevronRightIcon, ArrowRightIcon
} from "lucide-react"
import { getOrderDraft, clearOrderDraft } from "@/lib/order-storage"

const BANK_ACCOUNTS = [
  { bank: "BCA", number: "1234567890", name: "PT ShoeCare Indonesia", color: "bg-blue-600" },
  { bank: "Mandiri", number: "0987654321", name: "PT ShoeCare Indonesia", color: "bg-yellow-600" },
  { bank: "BNI", number: "1122334455", name: "PT ShoeCare Indonesia", color: "bg-green-600" },
]

export default function Step4Pembayaran() {
  const router = useRouter()
  const [draft, setDraft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [timeLeft, setTimeLeft] = useState(3600) // 1 jam

  // Load draft
  useEffect(() => {
    const data = getOrderDraft()
    if (!data || !data.items || data.items.length === 0) {
      router.push("/layanan/order/steps/3-detail-pesanan")
      return
    }
    setDraft(data)
    setLoading(false)

    // Countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return { hours, mins, secs }
  }

  const { hours, mins, secs } = formatTime(timeLeft)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Tersalin!")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleCreateOrder = async () => {
    if (!draft?.paymentMethod) {
      alert("Metode pembayaran tidak ditemukan")
      return
    }

    setCreatingOrder(true)
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInfo: {
            name: draft.customerInfo.name,
            phone: draft.customerInfo.phone,
            isGuest: true,
            userId: null
          },
          serviceType: draft.serviceType,
          pickupLocation: {
            address: draft.customerInfo.address,
            coordinates: draft.customerLocation,
            dropPointId: draft.selectedDropPoint?._id,
            dropPointName: draft.selectedDropPoint?.name,
            distanceKM: draft.selectedDropPoint?.distanceKM,
            deliveryFee: draft.dropPointResult?.deliveryFee
          },
          items: draft.items,
          payment: { method: draft.paymentMethod },
          useLoyaltyPoints: draft.useLoyaltyPoints || 0
        })
      })

      const data = await res.json()
      if (data.success) {
        setCreatedOrder(data.data)
        localStorage.setItem("shoecare_pending_order", JSON.stringify({
          orderId: data.data._id,
          orderNumber: data.data.orderNumber,
          phone: draft.customerInfo.phone
        }))
      } else {
        alert("Gagal: " + data.message)
      }
    } catch (error) {
      alert("Terjadi kesalahan")
    }
    setCreatingOrder(false)
  }

  const handleUploadProof = async () => {
    if (!uploadedFile || !createdOrder) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", uploadedFile)
    formData.append("orderId", createdOrder._id)

    try {
      const res = await fetch("/api/orders/upload-proof", {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      if (data.success) {
        clearOrderDraft()
        localStorage.removeItem("shoecare_pending_order")
        router.push(`/layanan/order/steps/pesanan-sukses?order=${createdOrder.orderNumber}`)
      } else {
        alert("Gagal upload: " + data.message)
      }
    } catch (error) {
      alert("Error upload")
    }
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // View: Konfirmasi sebelum buat order (jika belum ada createdOrder)
  if (!createdOrder) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/layanan/order/steps/3-detail-pesanan")}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Konfirmasi Pesanan</h1>
        </div>

        {/* Ringkasan Pesanan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Ringkasan</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Item</span>
              <span className="font-medium text-gray-900">{draft.items.length} treatment</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-900">Rp {draft.subtotal?.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Biaya Pengantaran</span>
              <span className="font-medium text-gray-900">
                {draft.deliveryFee === 0 ? 'Gratis' : `Rp ${draft.deliveryFee?.toLocaleString('id-ID')}`}
              </span>
            </div>
            {draft.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Diskon Poin</span>
                <span className="font-medium text-green-600">- Rp {draft.discount?.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Bayar</span>
              <span className="text-2xl font-bold text-blue-600">
                Rp {draft.total?.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Metode Pembayaran Terpilih */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              {draft.paymentMethod === 'qris' ? (
                <QrCodeIcon className="w-5 h-5 text-blue-600" />
              ) : (
                <BanknoteIcon className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Metode Pembayaran</p>
              <p className="font-semibold text-gray-900">
                {draft.paymentMethod === 'qris' ? 'QRIS' : 'Transfer Bank'}
              </p>
            </div>
            <button
              onClick={() => router.push("/layanan/order/steps/3-detail-pesanan")}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              Ubah
            </button>
          </div>
        </div>

        {/* Tombol Buat Pesanan */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleCreateOrder}
              disabled={creatingOrder}
              className="w-full py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {creatingOrder ? (
                <Loader2Icon className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Buat Pesanan
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // View setelah order created - MENUNGGU PEMBAYARAN
  const paymentMethod = draft?.paymentMethod

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/layanan")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Menunggu Pembayaran</h1>
      </div>

      {/* Countdown Timer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
        <p className="text-gray-500 text-sm mb-4">Selesaikan pembayaran dalam</p>
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{hours.toString().padStart(2, '0')}</span>
            <span className="text-xs text-gray-500">Jam</span>
          </div>
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{mins.toString().padStart(2, '0')}</span>
            <span className="text-xs text-gray-500">Menit</span>
          </div>
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{secs.toString().padStart(2, '0')}</span>
            <span className="text-xs text-gray-500">Detik</span>
          </div>
        </div>
      </div>

      {/* Order ID */}
      <div className="flex items-center justify-between px-2">
        <span className="text-gray-500 text-sm">Order ID</span>
        <span className="font-mono font-bold text-gray-900">#{createdOrder.orderNumber}</span>
      </div>

      {/* Total Bayar */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white">
        <p className="text-blue-100 text-sm mb-1">Total yang harus dibayar</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold">
            Rp {createdOrder.payment?.finalAmount?.toLocaleString('id-ID')}
          </p>
          <button
            onClick={() => copyToClipboard(createdOrder.payment?.finalAmount?.toString())}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30"
          >
            <CopyIcon className="w-4 h-4" />
            SALIN
          </button>
        </div>
        <p className="text-blue-100 text-xs mt-3 flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs">ⓘ</span>
          Mohon transfer tepat hingga digit terakhir
        </p>
      </div>

      {/* QRIS View */}
      {paymentMethod === "qris" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="w-48 h-48 bg-gray-100 mx-auto rounded-xl flex items-center justify-center mb-4">
            <QrCodeIcon className="w-24 h-24 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Scan kode QR dengan aplikasi e-wallet</p>
        </div>
      )}

      {/* Transfer View */}
      {paymentMethod === "transfer" && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Transfer Bank</h3>
          
          <div className="space-y-3">
            {BANK_ACCOUNTS.map((bank) => (
              <div key={bank.bank} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-8 ${bank.color} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                    {bank.bank}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Bank {bank.bank}</p>
                    <p className="font-mono text-sm text-gray-700">{bank.number}</p>
                    <p className="text-xs text-gray-500">a/n {bank.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(bank.number)}
                  className="px-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-xl"
                >
                  Salin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Bukti Transfer (hanya untuk transfer) */}
      {paymentMethod === "transfer" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Upload Bukti Transfer</h3>
          
          {previewUrl ? (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-dashed border-blue-300">
              <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              <button
                onClick={() => { setUploadedFile(null); setPreviewUrl(null) }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="block w-full p-8 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <UploadIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-medium text-gray-900 mb-1">Klik untuk upload bukti</p>
              <p className="text-xs text-gray-500">Maksimal file 5MB (JPG, PNG)</p>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>
      )}

      {/* Bantuan */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <HelpCircleIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">Butuh bantuan?</p>
            <p className="text-sm text-gray-600 mt-1">
              Hubungi WhatsApp kami jika ada kendala pembayaran.
            </p>
            <button className="mt-2 text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline">
              Hubungi Admin
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tombol Konfirmasi */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          {paymentMethod === "transfer" ? (
            <button
              onClick={handleUploadProof}
              disabled={!uploadedFile || uploading}
              className="w-full py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {uploading ? (
                <Loader2Icon className="w-5 h-5 animate-spin" />
              ) : (
                "Konfirmasi Pembayaran"
              )}
            </button>
          ) : (
            <button
              onClick={() => router.push(`/layanan/lacak-pesanan?phone=${encodeURIComponent(draft.customerInfo.phone)}`)}
              className="w-full py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              Cek Status Pesanan
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}