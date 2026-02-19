"use client"

import { useState, useEffect } from "react"
import { MapPinIcon, PhoneIcon, UserIcon, PackageIcon, CreditCardIcon, QrCodeIcon, BanknoteIcon, MinusIcon, PlusIcon, TagIcon } from "lucide-react"

interface OrderFormProps {
    customerLocation: {
        lat: number
        lng: number
        address: string
    } | null
    selectedDropPoint: {
        _id: string
        name: string
        distanceKM: number
        radiusMaxKM: number
    } | null
    deliveryFee: number
    user: {
        _id: string
        name: string
        phone: string
        loyaltyPoints: number
    } | null
    onSubmit: (orderData: any) => void
    onBack: () => void
}

const TREATMENT_OPTIONS = [
    { id: "deep-clean", name: "Deep Clean", price: 50000, description: "Pembersihan menyeluruh" },
    { id: "repaint", name: "Repaint", price: 150000, description: "Pengecatan ulang" },
    { id: "unyellowing", name: "Unyellowing", price: 80000, description: "Hilangkan kekuningan" },
    { id: "sole-repair", name: "Sole Repair", price: 100000, description: "Perbaikan sol" },
]

export default function OrderForm({
    customerLocation,
    selectedDropPoint,
    deliveryFee,
    user,
    onSubmit,
    onBack
}: OrderFormProps) {
    // Form state
    const [formData, setFormData] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        address: customerLocation?.address || "",
        notes: ""
    })

    // Items state
    const [items, setItems] = useState<Array<{
        id: string
        itemType: string
        treatmentType: string
        treatmentName: string
        price: number
        quantity: number
    }>>([])

    // Payment & loyalty
    const [paymentMethod, setPaymentMethod] = useState<"qris" | "transfer" | null>(null)
    const [usePoints, setUsePoints] = useState(0)
    const [showPointInput, setShowPointInput] = useState(false)

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const maxDiscount = Math.min(user?.loyaltyPoints || 0, subtotal * 0.5) // Max 50% diskon
    const finalDiscount = Math.min(usePoints, maxDiscount)
    const total = subtotal + deliveryFee - finalDiscount

    // Add item
    const addItem = (treatment: typeof TREATMENT_OPTIONS[0]) => {
        const newItem = {
            id: Date.now().toString(),
            itemType: "Sepatu",
            treatmentType: treatment.id,
            treatmentName: treatment.name,
            price: treatment.price,
            quantity: 1
        }
        setItems([...items, newItem])
    }

    // Update quantity
    const updateQuantity = (id: string, delta: number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    // Remove item
    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id))
    }

    // Handle submit
    const handleSubmit = () => {
        if (!formData.name || !formData.phone || !formData.address) {
            alert("Lengkapi data diri terlebih dahulu")
            return
        }
        if (items.length === 0) {
            alert("Pilih minimal 1 layanan")
            return
        }
        if (!paymentMethod) {
            alert("Pilih metode pembayaran")
            return
        }

        onSubmit({
            customerInfo: {
                name: formData.name,
                phone: formData.phone,
                isGuest: !user,
                userId: user?._id || null
            },
            address: formData.address,
            notes: formData.notes,
            items: items.map(({ id, ...rest }) => rest),
            paymentMethod,
            useLoyaltyPoints: finalDiscount,
            subtotal,
            deliveryFee,
            discount: finalDiscount,
            total
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold font-[poppins]">Detail Pesanan</h1>

            {/* Section 1: Data Diri */}
            <div className="bg-white rounded-2xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    Data Pemesan
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
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
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap Penjemputan</label>
                    <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Contoh: Jl. Mawar No. 5, RT 02/RW 03, Kelurahan Cipocok Jaya, Serang, Banten"
                        rows={3}
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                    {customerLocation && (
                        <p className="text-xs text-gray-500 mt-1">
                            Koordinat: {customerLocation.lat.toFixed(6)}, {customerLocation.lng.toFixed(6)}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                    <input
                        type="text"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Contoh: Rumah pagar hijau, sebelah warung pak budi"
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Section 2: Pilih Layanan */}
            <div className="bg-white rounded-2xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <PackageIcon className="w-5 h-5 text-blue-600" />
                    Pilih Treatment
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TREATMENT_OPTIONS.map((treatment) => (
                        <button
                            key={treatment.id}
                            onClick={() => addItem(treatment)}
                            className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-left"
                        >
                            <p className="font-semibold text-sm">{treatment.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{treatment.description}</p>
                            <p className="text-blue-600 font-bold mt-2">
                                Rp {treatment.price.toLocaleString("id-ID")}
                            </p>
                        </button>
                    ))}
                </div>

                {/* List Items */}
                {items.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="font-medium text-sm">Item yang dipilih:</p>
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <p className="font-medium">{item.treatmentName}</p>
                                    <p className="text-xs text-gray-500">Rp {item.price.toLocaleString("id-ID")}/pcs</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                                    >
                                        <MinusIcon className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Section 3: Drop Point Info */}
            {selectedDropPoint && (
                <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-800">
                        <MapPinIcon className="w-5 h-5" />
                        Drop Point Terdekat
                    </h2>
                    <div className="mt-3 space-y-1">
                        <p className="font-medium">{selectedDropPoint.name}</p>
                        <p className="text-sm text-gray-600">Jarak: {selectedDropPoint.distanceKM} km</p>
                        <p className="text-sm text-gray-600">
                            Radius gratis: {selectedDropPoint.radiusMaxKM} km
                        </p>
                        <p className="text-lg font-bold text-blue-600 mt-2">
                            Ongkir: Rp {deliveryFee.toLocaleString("id-ID")}
                        </p>
                        {deliveryFee === 0 && (
                            <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                Gratis Ongkir!
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Section 4: Loyalty Points (Khusus Member) */}
            {user && user.loyaltyPoints > 0 && (
                <div className="bg-purple-50 rounded-2xl border border-purple-200 p-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-800">
                        <TagIcon className="w-5 h-5" />
                        Poin Loyalitas
                    </h2>
                    <p className="text-sm text-gray-600 mt-2">
                        Anda memiliki <span className="font-bold">{user.loyaltyPoints.toLocaleString("id-ID")} poin</span>
                    </p>
                    <p className="text-xs text-gray-500">1 poin = Rp 1 (Maksimal diskon 50% dari subtotal)</p>

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
                                onClick={() => setShowPointInput(false)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Batal
                            </button>
                        </div>
                    )}

                    {finalDiscount > 0 && (
                        <p className="mt-2 text-purple-700 font-medium">
                            Diskon: Rp {finalDiscount.toLocaleString("id-ID")}
                        </p>
                    )}
                </div>
            )}

            {/* Section 5: Metode Pembayaran */}
            <div className="bg-white rounded-2xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCardIcon className="w-5 h-5 text-blue-600" />
                    Metode Pembayaran
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setPaymentMethod("qris")}
                        className={`p-4 border-2 rounded-xl flex items-center gap-3 transition ${
                            paymentMethod === "qris"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                        }`}
                    >
                        <QrCodeIcon className="w-8 h-8 text-blue-600" />
                        <div className="text-left">
                            <p className="font-semibold">QRIS</p>
                            <p className="text-xs text-gray-500">Scan dengan aplikasi e-wallet</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setPaymentMethod("transfer")}
                        className={`p-4 border-2 rounded-xl flex items-center gap-3 transition ${
                            paymentMethod === "transfer"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                        }`}
                    >
                        <BanknoteIcon className="w-8 h-8 text-green-600" />
                        <div className="text-left">
                            <p className="font-semibold">Transfer Bank</p>
                            <p className="text-xs text-gray-500">BCA, BNI, Mandiri</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Section 6: Ringkasan & Submit */}
            <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-3">
                <h2 className="text-lg font-semibold">Ringkasan Pembayaran</h2>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Ongkir</span>
                        <span>{deliveryFee === 0 ? "Gratis" : `Rp ${deliveryFee.toLocaleString("id-ID")}`}</span>
                    </div>
                    {finalDiscount > 0 && (
                        <div className="flex justify-between text-purple-400">
                            <span>Diskon Poin</span>
                            <span>- Rp {finalDiscount.toLocaleString("id-ID")}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-700 pt-2 flex justify-between text-lg font-bold">
                        <span>Total Bayar</span>
                        <span>Rp {total.toLocaleString("id-ID")}</span>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onBack}
                        className="flex-1 py-3 border border-white/30 rounded-xl hover:bg-white/10"
                    >
                        Kembali
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={items.length === 0 || !paymentMethod}
                        className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Buat Pesanan
                    </button>
                </div>
            </div>
        </div>
    )
}