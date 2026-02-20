// app/layanan/steps/3-detail-pesanan/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon, ArrowRightIcon, UserIcon, PhoneIcon, MapPinIcon,
  PackageIcon, PlusIcon, MinusIcon, TrashIcon, TagIcon, Loader2Icon
} from "lucide-react"
import { getOrderDraft, saveOrderDraft } from "@/lib/order-storage"
import { useAuth } from "@/app/context/userAuth/getUserAuthData."

const TREATMENT_OPTIONS = [
  { id: "fast-clean", name: "Fast Clean", price: 35000, description: "Pembersihan cepat 30 menit" },
  { id: "deep-clean", name: "Deep Clean", price: 50000, description: "Pembersihan menyeluruh" },
  { id: "repaint", name: "Repaint", price: 150000, description: "Pengecatan ulang" },
  { id: "unyellowing", name: "Unyellowing", price: 80000, description: "Hilangkan kekuningan" },
  { id: "sole-repair", name: "Sole Repair", price: 100000, description: "Perbaikan sol" },
  { id: "leather-care", name: "Leather Care", price: 75000, description: "Perawatan kulit" },
]

interface OrderItem {
  id: string
  itemType: string
  treatmentType: string
  treatmentName: string
  price: number
  quantity: number
}

export default function Step3DetailPesanan() {
  const router = useRouter()
  const { user } = useAuth()

  const [draft, setDraft] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: ""
  })
  const [items, setItems] = useState<OrderItem[]>([])
  const [usePoints, setUsePoints] = useState(0)
  const [showPointInput, setShowPointInput] = useState(false)

  // Load draft dan init form
  useEffect(() => {
    const data = getOrderDraft()
    if (!data || !data.customerLocation) {
      router.push("/layanan/order/steps/2-lokasi")
      return
    }

    setDraft(data)

    // Auto-fill dari user atau draft sebelumnya
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: data.customerLocation?.address || "",
        notes: data.customerInfo?.notes || ""
      })
    } else if (data.customerInfo) {
      setFormData({
        name: data.customerInfo.name || "",
        phone: data.customerInfo.phone || "",
        address: data.customerInfo.address || "",
        notes: data.customerInfo.notes || ""  // ← pastikan notes ada
      })
    } else {
      setFormData(prev => ({
        ...prev,
        address: data.customerLocation?.address || ""
      }))
    }

    if (data.items) setItems(data.items)
    if (data.useLoyaltyPoints) setUsePoints(data.useLoyaltyPoints)

    setLoading(false)
  }, [user, router])

  // Auto-save
  useEffect(() => {
    if (!loading && draft) {
      saveOrderDraft({
        step: 3,
        customerInfo: formData,
        items,
        useLoyaltyPoints: usePoints
      })
    }
  }, [formData, items, usePoints, loading, draft])

  const addItem = (treatment: typeof TREATMENT_OPTIONS[0]) => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      itemType: "Sepatu",
      treatmentType: treatment.id,
      treatmentName: treatment.name,
      price: treatment.price,
      quantity: 1
    }
    setItems([...items, newItem])
  }

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Kalkulasi
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryFee = draft?.dropPointResult?.deliveryFee || 0
  const maxDiscount = user ? Math.min(user.loyaltyPoints || 0, subtotal * 0.5) : 0
  const finalDiscount = Math.min(usePoints, maxDiscount)
  const total = subtotal + deliveryFee - finalDiscount

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.address) {
      alert("Lengkapi data diri terlebih dahulu")
      return
    }
    if (items.length === 0) {
      alert("Pilih minimal 1 layanan")
      return
    }

    // Save final
    saveOrderDraft({
      step: 3,
      customerInfo: formData,
      items,
      useLoyaltyPoints: finalDiscount,
      subtotal,
      deliveryFee,
      discount: finalDiscount,
      total
    })

    router.push("/layanan/order/steps/4-pembayaran")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Left: Form */}
      <div className="md:col-span-2 space-y-6">
        {/* Data Diri */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-blue-600" />
            Data Pemesan
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08123456789"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Untuk konfirmasi dan tracking pesanan
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                rows={3}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Contoh: Rumah pagar hijau, sebelah warung"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Pilih Layanan */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <PackageIcon className="w-5 h-5 text-blue-600" />
            Pilih Treatment
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TREATMENT_OPTIONS.map((treatment) => (
              <button
                key={treatment.id}
                onClick={() => addItem(treatment)}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <p className="font-semibold text-sm">{treatment.name}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{treatment.description}</p>
                <p className="text-blue-600 font-bold mt-2">
                  Rp {treatment.price.toLocaleString('id-ID')}
                </p>
              </button>
            ))}
          </div>

          {/* List Items */}
          {items.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="font-medium text-sm text-gray-700">Item yang dipilih:</p>
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium">{item.treatmentName}</p>
                    <p className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}/pcs</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loyalty Points */}
        {user && (user.loyaltyPoints ?? 0) > 0 && (
          <div className="bg-purple-50 rounded-2xl border border-purple-200 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-800 mb-3">
              <TagIcon className="w-5 h-5" />
              Poin Loyalitas
            </h2>
            <p className="text-sm text-gray-600">
              Anda punya <span className="font-bold">{(user.loyaltyPoints ?? 0).toLocaleString('id-ID')} poin</span>
            </p>

            {!showPointInput ? (
              <button
                onClick={() => setShowPointInput(true)}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              >
                Gunakan Poin
              </button>
            ) : (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  value={usePoints}
                  onChange={(e) => setUsePoints(Math.min(Number(e.target.value), maxDiscount))}
                  max={maxDiscount}
                  className="w-32 p-2 border rounded-lg"
                  placeholder="Jumlah poin"
                />
                <button
                  onClick={() => {
                    setShowPointInput(false)
                    setUsePoints(0)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Batal
                </button>
              </div>
            )}

            {finalDiscount > 0 && (
              <p className="mt-2 text-purple-700 font-medium">
                Hemat: Rp {finalDiscount.toLocaleString('id-ID')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: Summary */}
      <div className="md:col-span-1">
        <div className="bg-gray-900 text-white rounded-2xl p-6 sticky top-24">
          <h3 className="font-bold text-lg mb-4">Ringkasan</h3>

          <div className="space-y-3 text-sm mb-4 text-gray-300">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkir</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-green-400">Gratis</span>
                ) : (
                  `Rp ${deliveryFee.toLocaleString('id-ID')}`
                )}
              </span>
            </div>
            {finalDiscount > 0 && (
              <div className="flex justify-between text-purple-400">
                <span>Diskon Poin</span>
                <span>- Rp {finalDiscount.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="text-2xl font-bold text-blue-400">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || !formData.name || !formData.phone}
            className="w-full py-4 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Lanjut ke Pembayaran
            <ArrowRightIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/layanan/order/steps/2-lokasi")}
            className="w-full mt-3 py-3 border border-gray-600 rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>
    </div>
  )
}