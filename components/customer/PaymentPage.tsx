// components/customer/PaymentPage.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QrCodeIcon, BanknoteIcon, CopyIcon, CheckIcon, ClockIcon, AlertCircleIcon } from "lucide-react"

interface PaymentPageProps {
  orderData: {
    _id: string
    orderNumber: string
    payment: {
      method: "qris" | "transfer"
      finalAmount: number
      status: string
    }
    customerInfo: {
      name: string
      phone: string
    }
  }
  onPaymentComplete: () => void
}

const BANK_ACCOUNTS = [
  { bank: "BCA", number: "1234567890", name: "PT ShoeCare Indonesia" },
  { bank: "BNI", number: "0987654321", name: "PT ShoeCare Indonesia" },
  { bank: "Mandiri", number: "1122334455", name: "PT ShoeCare Indonesia" },
]

export default function PaymentPage({ orderData, onPaymentComplete }: PaymentPageProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(3600) // 1 jam countdown
  const [copied, setCopied] = useState<string | null>(null)
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("orderId", orderData._id)

    try {
      const res = await fetch("/api/orders/upload-proof", {
        method: "POST",
        body: formData
        // Jangan set Content-Type header, browser akan set otomatis dengan boundary
      })

      const data = await res.json()

      if (data.success) {
        setPaymentProof(file)
        // Tampilkan preview atau redirect
        alert("Bukti pembayaran berhasil diupload! Menunggu konfirmasi admin.")
      } else {
        alert(data.message || "Gagal upload")
      }
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Terjadi kesalahan saat upload")
    } finally {
      setUploading(false)
    }
  }

  const checkPaymentStatus = async () => {
    const res = await fetch(`/api/orders/${orderData._id}/status`)
    const data = await res.json()
    if (data.data.payment.status === "paid") {
      onPaymentComplete()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold font-[poppins]">Menunggu Pembayaran</h1>
        <p className="text-gray-600">Order: <span className="font-mono font-bold">{orderData.orderNumber}</span></p>

        {/* Countdown */}
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full">
          <ClockIcon className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
        </div>
        <p className="text-xs text-gray-500">Selesaikan pembayaran sebelum waktu habis</p>
      </div>

      {/* QRIS Payment */}
      {orderData.payment.method === "qris" && (
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b">
            <QrCodeIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="font-semibold">Pembayaran QRIS</h2>
              <p className="text-sm text-gray-500">Scan dengan aplikasi e-wallet</p>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-center">
            <div className="bg-gray-100 p-8 rounded-xl">
              {/* Generate QR code di sini menggunakan library seperti qrcode.react */}
              <div className="w-64 h-64 bg-white p-4 rounded-lg flex items-center justify-center">
                <QrCodeIcon className="w-32 h-32 text-gray-400" />
                {/* <QRCodeSVG value={`SHOECARE:${orderData._id}:${orderData.payment.finalAmount}`} size={200} /> */}
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Total Pembayaran</p>
            <p className="text-3xl font-bold text-blue-600">
              Rp {orderData.payment.finalAmount.toLocaleString("id-ID")}
            </p>
          </div>

          {/* Supported Apps */}
          <div className="flex justify-center gap-4 pt-4">
            {["Gopay", "OVO", "Dana", "LinkAja"].map((app) => (
              <div key={app} className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs">
                {app}
              </div>
            ))}
          </div>

          <button
            onClick={checkPaymentStatus}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Cek Status Pembayaran
          </button>
        </div>
      )}

      {/* Transfer Payment */}
      {orderData.payment.method === "transfer" && (
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b">
            <BanknoteIcon className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="font-semibold">Transfer Bank</h2>
              <p className="text-sm text-gray-500">Transfer ke salah satu rekening berikut</p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <p className="text-sm text-gray-600">Total Transfer</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-3xl font-bold text-green-600">
                Rp {orderData.payment.finalAmount.toLocaleString("id-ID")}
              </p>
              <button
                onClick={() => copyToClipboard(orderData.payment.finalAmount.toString(), "amount")}
                className="p-2 hover:bg-green-200 rounded-lg"
              >
                {copied === "amount" ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="space-y-3">
            {BANK_ACCOUNTS.map((bank) => (
              <div key={bank.bank} className="border rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{bank.bank}</p>
                    <p className="text-sm text-gray-500">{bank.name}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bank.number, bank.bank)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {copied === bank.bank ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                    {copied === bank.bank ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <p className="text-xl font-mono mt-2 tracking-wider">{bank.number}</p>
              </div>
            ))}
          </div>

          {/* Upload Proof */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Upload Bukti Transfer</h3>
            <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="text-center">
                {uploading ? (
                  <p className="text-blue-600">Mengupload...</p>
                ) : paymentProof ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckIcon className="w-5 h-5" />
                    <p>Bukti terupload</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <BanknoteIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">Klik untuk upload bukti transfer</p>
                    <p className="text-xs text-gray-400">Format: JPG, PNG (Max 5MB)</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">Butuh bantuan?</p>
          <p>Hubungi admin kami di WhatsApp <a href="https://wa.me/6281234567890" className="underline">0812-3456-7890</a></p>
        </div>
      </div>
    </div>
  )
}