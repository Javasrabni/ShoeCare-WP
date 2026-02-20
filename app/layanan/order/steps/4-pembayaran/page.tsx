// app/layanan/steps/4-pembayaran/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { 
  ArrowLeftIcon, CheckIcon, CopyIcon, QrCodeIcon, BanknoteIcon, 
  ClockIcon, UploadIcon, Loader2Icon, CheckCircleIcon 
} from "lucide-react"
import { getOrderDraft, clearOrderDraft } from "@/lib/order-storage"

const BANK_ACCOUNTS = [
  { bank: "BCA", number: "1234567890", name: "PT ShoeCare Indonesia" },
  { bank: "BNI", number: "0987654321", name: "PT ShoeCare Indonesia" },
  { bank: "Mandiri", number: "1122334455", name: "PT ShoeCare Indonesia" },
]

export default function Step4Pembayaran() {
  const router = useRouter()
  const [draft, setDraft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "transfer" | null>(null)
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
    if (data.paymentMethod) setPaymentMethod(data.paymentMethod)
    setLoading(false)

    // Countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

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
    if (!paymentMethod) {
      alert("Pilih metode pembayaran")
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
            isGuest: true, // atau cek dari auth
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
          payment: { method: paymentMethod },
          useLoyaltyPoints: draft.useLoyaltyPoints || 0
        })
      })

      const data = await res.json()
      if (data.success) {
        setCreatedOrder(data.data)
        // Simpan pending order untuk tracking
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

  // View setelah order created
  if (createdOrder) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Pesanan Berhasil Dibuat!</h2>
          <p className="text-gray-500 mt-2">Nomor: <span className="font-mono font-bold">{createdOrder.orderNumber}</span></p>
        </div>

        {/* QRIS View */}
        {paymentMethod === "qris" && (
          <div className="text-center space-y-6">
            <div className="bg-blue-50 inline-flex items-center gap-2 px-4 py-2 rounded-full">
              <ClockIcon className="w-5 h-5 text-blue-600" />
              <span className="font-mono font-bold text-blue-800">{formatTime(timeLeft)}</span>
            </div>

            <div className="bg-white p-8 rounded-2xl border-2 border-blue-100">
              <div className="w-64 h-64 bg-gray-100 mx-auto rounded-xl flex items-center justify-center mb-4">
                <QrCodeIcon className="w-32 h-32 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Scan dengan aplikasi e-wallet</p>
            </div>

            <div className="bg-gray-900 text-white p-6 rounded-xl">
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-3xl font-bold text-blue-400">
                Rp {createdOrder.payment?.finalAmount?.toLocaleString('id-ID')}
              </p>
            </div>

            <button
              onClick={() => router.push(`/layanan/lacak-pesanan?phone=${encodeURIComponent(draft.customerInfo.phone)}`)}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Cek Status Pesanan
            </button>
          </div>
        )}

        {/* Transfer View */}
        {paymentMethod === "transfer" && (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
              <p className="text-sm text-gray-600 mb-2">Transfer sesuai nominal:</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-4xl font-bold text-green-700">
                  Rp {createdOrder.payment?.finalAmount?.toLocaleString('id-ID')}
                </p>
                <button
                  onClick={() => copyToClipboard(createdOrder.payment?.finalAmount?.toString())}
                  className="p-2 hover:bg-green-200 rounded-lg"
                >
                  <CopyIcon className="w-5 h-5 text-green-700" />
                </button>
              </div>
            </div>

            {/* Bank Accounts */}
            <div className="space-y-3">
              {BANK_ACCOUNTS.map((bank) => (
                <div key={bank.bank} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{bank.bank}</p>
                    <p className="text-sm text-gray-500">{bank.name}</p>
                    <p className="font-mono text-lg mt-1">{bank.number}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bank.number)}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Salin
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Proof */}
            <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UploadIcon className="w-5 h-5" />
                Upload Bukti Transfer
              </h3>

              {previewUrl ? (
                <div className="relative w-full h-48 mb-4">
                  <Image src={previewUrl} alt="Preview" fill className="object-contain rounded-lg" />
                  <button
                    onClick={() => { setUploadedFile(null); setPreviewUrl(null) }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50">
                  <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Klik untuk upload</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}

              <button
                onClick={handleUploadProof}
                disabled={!uploadedFile || uploading}
                className="w-full mt-4 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2Icon className="w-5 h-5 animate-spin" /> : "Konfirmasi Pembayaran"}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // View: Pilih metode pembayaran
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pilih Metode Pembayaran</h2>

        <button
          onClick={() => setPaymentMethod("qris")}
          className={`w-full p-6 border-2 rounded-xl flex items-center gap-4 transition ${
            paymentMethod === "qris" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <QrCodeIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold">QRIS</p>
            <p className="text-sm text-gray-500">Scan dengan e-wallet</p>
          </div>
        </button>

        <button
          onClick={() => setPaymentMethod("transfer")}
          className={`w-full p-6 border-2 rounded-xl flex items-center gap-4 transition ${
            paymentMethod === "transfer" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <BanknoteIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold">Transfer Bank</p>
            <p className="text-sm text-gray-500">BCA, BNI, Mandiri</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/layanan/order/steps/3-detail-pesanan")}
          className="w-full py-4 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gray-900 text-white rounded-2xl p-6 h-fit">
        <h3 className="font-bold text-lg mb-4">Ringkasan</h3>
        
        <div className="space-y-2 text-sm mb-4 text-gray-300">
          <div className="flex justify-between">
            <span>Item</span>
            <span>{draft.items.length} treatment</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rp {draft.subtotal?.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Ongkir</span>
            <span>{draft.deliveryFee === 0 ? 'Gratis' : `Rp ${draft.deliveryFee?.toLocaleString('id-ID')}`}</span>
          </div>
          {draft.discount > 0 && (
            <div className="flex justify-between text-purple-400">
              <span>Diskon</span>
              <span>- Rp {draft.discount?.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Bayar</span>
            <span className="text-3xl font-bold text-blue-400">
              Rp {draft.total?.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <button
          onClick={handleCreateOrder}
          disabled={!paymentMethod || creatingOrder}
          className="w-full py-4 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {creatingOrder ? <Loader2Icon className="w-5 h-5 animate-spin" /> : "Buat Pesanan"}
        </button>
      </div>
    </div>
  )
}