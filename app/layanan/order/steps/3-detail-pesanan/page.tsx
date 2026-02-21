// app/layanan/steps/3-detail-pesanan/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon, ArrowRightIcon, UserIcon, PhoneIcon, MapPinIcon,
  PackageIcon, PlusIcon, MinusIcon, TrashIcon, TagIcon, Loader2Icon,
  CheckIcon,
  StoreIcon,
  ChevronRightIcon,
  CreditCardIcon
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
  image?: string
}

export default function Step3DetailPesanan() {
  const router = useRouter()
  const { user } = useAuth()
  console.log(user)
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
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "transfer">("qris")

  // Load draft dan init form
  const correctFormatPhone = user?.phone?.startsWith("62")
    ? "0" + user.phone.slice(2)
    : user?.phone

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
        phone: correctFormatPhone || "",
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
        useLoyaltyPoints: usePoints,

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
      quantity: 1,
      image: `/images/treatments/${treatment.id}.jpg`  // ← TAMBAHKAN ini
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

  // ✅ Perbaikan: 50% dari total (subtotal + deliveryFee)
  const maxDiscount = user ? Math.min(user.loyaltyPoints || 0, (subtotal + deliveryFee) * 0.5) : 0
  const finalDiscount = Math.min(usePoints, maxDiscount)

  // Total = subtotal + deliveryFee - diskon
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
      total,
      paymentMethod
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
    <div className="max-w-2xl mx-auto space-y-6 pb-64">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/layanan/order/steps/2-lokasi")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Detail Pesanan</h1>
      </div>

      {/* Data Pemesan */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-900">
          <UserIcon className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">Data Pemesan</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Budi Santoso"
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">Nomor WhatsApp</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="08..."
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Alamat Card */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPinIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Alamat Penjemputan</p>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                    {formData.address || draft?.customerLocation?.address || "Alamat belum dipilih"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/layanan/order/steps/2-lokasi")}
                className="text-blue-600 font-medium text-sm hover:underline flex-shrink-0"
              >
                Ubah
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: Titip di satpam, sepatu kotor sekali"
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Pilih Treatment */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-900">
          <PackageIcon className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">Pilih Treatment</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TREATMENT_OPTIONS.map((treatment) => (
            <button
              key={treatment.id}
              onClick={() => addItem(treatment)}
              className={`relative p-3 rounded-2xl border-2 transition text-left ${items.some(item => item.treatmentType === treatment.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
                }`}
            >
              {/* Checkmark if selected */}
              {items.some(item => item.treatmentType === treatment.id) && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Image Placeholder */}
              {/* <div className="aspect-square rounded-xl bg-gray-100 mb-3 overflow-hidden">
                <img
                  src={treatment.image || `/images/treatments/${treatmentType}.jpg`}
                  alt={treatment.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder-shoe.jpg';
                  }}
                />
              </div> */}

              <p className="font-semibold text-sm text-gray-900">{treatment.name}</p>
              <p className="text-blue-600 font-bold text-sm mt-1">
                Rp {treatment.price.toLocaleString('id-ID')}
              </p>
            </button>
          ))}
        </div>

        {/* Selected Items List */}
        {items.length > 0 && (
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || `/images/treatments/${item.treatmentType}.jpg`}
                      alt={item.treatmentName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{item.treatmentName}</p>
                    <p className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-1 w-8 h-8 rounded-lg text-red-500 flex items-center justify-center hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop Point Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-900">
          <StoreIcon className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">Drop Point Terdekat</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <StoreIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">
                {draft?.dropPointResult?.selectedDropPoint?.name || draft?.dropPointResult?.nearestDropPoint?.name || "Drop Point"}
              </p>
              <p className="text-xs text-gray-500">
                {draft?.dropPointResult?.selectedDropPoint?.distanceKM || draft?.dropPointResult?.nearestDropPoint?.distanceKM || "0"} km dari lokasi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {draft?.dropPointResult?.isInsideRadius ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Free Shipping
              </span>
            ) : (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                Berbayar
              </span>
            )}
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Metode Pembayaran */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-900">
          <CreditCardIcon className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">Metode Pembayaran</h2>
        </div>

        <div className="space-y-2">
          {[
            { id: "qris", label: "QRIS (Gopay, OVO, ShopeePay)", icon: "QRIS" },
            { id: "transfer", label: "Transfer Bank (Manual)", icon: "BANK" }
          ].map((method) => (
            <label
              key={method.id}
              onClick={() => setPaymentMethod(method.id as "qris" | "transfer")}
              className={`flex items-center justify-between p-4 bg-white rounded-2xl cursor-pointer transition ${paymentMethod === method.id
                ? 'border-2 border-blue-500'
                : 'border border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600">
                  {method.icon}
                </div>
                <span className={`font-medium text-sm ${paymentMethod === method.id ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                  {method.label}
                </span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === method.id ? 'border-blue-500' : 'border-gray-300'
                }`}>
                {paymentMethod === method.id && (
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
      {/* Loyalty Points */}
      {/* MAX disc = 50% dari total */}
      {user && (user.loyaltyPoints ?? 0) > -1 && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TagIcon className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold text-sm text-gray-900">Poin Loyalitas</span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              {(user.loyaltyPoints ?? 0).toLocaleString('id-ID')} poin
            </span>
          </div>

          {!showPointInput ? (
            <button
              onClick={() => setShowPointInput(true)}
              className="w-full py-3 bg-white border border-blue-200 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Gunakan Poin
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="number"
                  value={usePoints === 0 ? "" : usePoints}  // ← Jika 0, tampilkan string kosong
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setUsePoints(0);  // ← Set state 0, tapi input tampil kosong
                    } else {
                      const num = Math.min(Number(value), maxDiscount);
                      setUsePoints(num);
                    }
                  }}
                  max={maxDiscount}
                  className="w-full p-3 pr-16 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Masukkan poin"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  Max {maxDiscount.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setUsePoints(maxDiscount);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Pakai Maksimal
                </button>
                <button
                  onClick={() => {
                    setShowPointInput(false);
                    setUsePoints(0);
                  }}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {finalDiscount > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
              <span className="text-sm text-green-700">Hemat</span>
              <span className="font-bold text-green-700">
                Rp {finalDiscount.toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>
      )}



      {/* Bottom Actions - Fixed */}
      <div className="fixed bottom-0 max-w-2xl mx-auto left-0 right-0 bg-white border-t border-gray-100 p-4">
        {/* Ringkasan Pembayaran */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Subtotal ({items.length > 0
                ? `${items.reduce((sum, item) => sum + item.quantity, 0)} item`
                : '0 item'
              })
            </span>
            <span className="font-medium text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Biaya Pengantaran</span>
            {deliveryFee === 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 line-through text-xs">Rp 10.000</span>
                <span className="text-green-600 font-medium">Gratis</span>
              </div>
            ) : (
              <span className="font-medium text-gray-900">Rp {deliveryFee.toLocaleString('id-ID')}</span>
            )}
          </div>

          {finalDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Diskon Poin</span>
              <span className="font-medium text-green-600">- Rp {finalDiscount.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Pembayaran</span>
            <span className="text-xl font-bold text-blue-600">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => router.push("/layanan/order/steps/2-lokasi")}
            className="flex-1 py-3.5 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50"
          >
            Kembali
          </button>
          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || !formData.name || !formData.phone}
            className="flex-1 py-3.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            Buat Pesanan
          </button>
        </div>
      </div>
    </div>
  )
}