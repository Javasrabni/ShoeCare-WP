// pilihLayanan.tsx

"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { MapPinIcon, TruckIcon, StoreIcon, NavigationIcon, CheckCircle2Icon, CrosshairIcon } from "lucide-react"
import PaymentPage from "../PaymentPage"
import OrderForm from "../OrderForm"

const MapComponent = dynamic(
    () => import("@/components/customer/CustomerMapComponent"),
    { ssr: false }
)

type DropPointData = {
    _id: string
    name: string
    address: string
    location: {
        coordinates: [number, number]
    }
    distanceKM: number
    radiusMaxKM: number
    chargeOutsideRadius: number
    isInsideRadius: boolean
    isNearest: boolean
}

type DropPointResult = {
    nearestDropPoint: DropPointData
    allDropPoints: DropPointData[]
    deliveryFee: number
    chargeDetails: {
        baseRadius: number
        actualDistance: number
        excessDistance: number
        ratePerKM: number
        totalFee: number
    } | null
    isInsideRadius: boolean
}

type Step = "pilih" | "lokasi" | "positioning" | "overview" | "konfirmasi"

export default function PilihLayananPage() {
    const router = useRouter()

    // State definitions
    const [step, setStep] = useState<Step>("pilih")
    const [layanan, setLayanan] = useState<"antar-jemput" | "drop-point" | null>(null)
    const [mapPhase, setMapPhase] = useState<"positioning" | "overview" | "focusing">("positioning")

    const [customerLocation, setCustomerLocation] = useState<{
        lat: number
        lng: number
        address: string
    } | null>(null)

    const [adjustedPosition, setAdjustedPosition] = useState<{
        lat: number
        lng: number
    } | null>(null)

    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const [locationError, setLocationError] = useState<string | null>(null)
    const [dropPointResult, setDropPointResult] = useState<DropPointResult | null>(null)
    const [isCalculating, setIsCalculating] = useState(false)
    const [selectedDropPoint, setSelectedDropPoint] = useState<DropPointData | null>(null)

    const [manualAddress, setManualAddress] = useState("")
    const [searchResults, setSearchResults] = useState<Array<{
        lat: string
        lon: string
        display_name: string
    }>>([])

    // Handler saat pin digeser
    const handlePositionChange = (lat: number, lng: number) => {
        setAdjustedPosition({ lat, lng })
    }

    // Handler konfirmasi posisi dengan animasi berurutan (SATU FUNGSI SAJA)
    const handleConfirmPosition = async () => {
        const finalPosition = adjustedPosition || customerLocation

        if (finalPosition && customerLocation) {
            // Update customer location dengan posisi yang sudah di-adjust
            setCustomerLocation({
                ...customerLocation,
                lat: finalPosition.lat,
                lng: finalPosition.lng
            })

            // Re-calculate dengan posisi baru (jangan auto advance ke konfirmasi)
            await findNearestDropPoint(finalPosition.lat, finalPosition.lng, false)

            // Mulai animasi: overview → focusing
            setStep("overview")
            setMapPhase("overview")

            // Delay 2 detik untuk lihat semua DP, lalu zoom ke terdekat
            setTimeout(() => {
                setMapPhase("focusing")

                // Delay lagi untuk animasi focusing, lalu ke konfirmasi
                setTimeout(() => {
                    setStep("konfirmasi")
                }, 1500)

            }, 2000)
        }
        // setStep("konfirmasi") // Ganti dengan form order
        // setShowOrderForm(true)
    }

    const handlePilihLayanan = (jenis: "antar-jemput" | "drop-point") => {
        setLayanan(jenis)
        if (jenis === "drop-point") {
            router.push("/layanan/drop-point-list")
        } else {
            setStep("lokasi")
        }
    }

    const handleGetLocation = () => {
        setIsGettingLocation(true)
        setLocationError(null)

        if (!navigator.geolocation) {
            setLocationError("Browser tidak mendukung geolokasi")
            setIsGettingLocation(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    )
                    const data = await res.json()

                    const locationData = {
                        lat: latitude,
                        lng: longitude,
                        address: data.display_name || "Lokasi saat ini",
                    }

                    setCustomerLocation(locationData)
                    await findNearestDropPoint(latitude, longitude, false)

                    setIsGettingLocation(false)
                    setStep("positioning")

                } catch (error) {
                    const locationData = {
                        lat: latitude,
                        lng: longitude,
                        address: "Lokasi saat ini",
                    }

                    setCustomerLocation(locationData)
                    await findNearestDropPoint(latitude, longitude, false)
                    setIsGettingLocation(false)
                    setStep("positioning")
                }
            },
            (error) => {
                setLocationError("Gagal mendapatkan lokasi: " + error.message)
                setIsGettingLocation(false)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }

    const findNearestDropPoint = async (lat: number, lng: number, autoAdvance: boolean = true) => {
        setIsCalculating(true)
        try {
            const res = await fetch("/api/customer/find-nearest-drop-point", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lat, lng }),
            })
            const data = await res.json()

            if (data.success) {
                setDropPointResult(data.data)
                setSelectedDropPoint(data.data.nearestDropPoint)
                if (autoAdvance) {
                    setStep("konfirmasi")
                }
            } else {
                setLocationError(data.message)
            }
        } catch (error) {
            setLocationError("Gagal mencari drop point")
        }
        setIsCalculating(false)
    }

    const handleSelectDropPoint = (dp: DropPointData) => {
        setSelectedDropPoint(dp)

        const distanceKM = dp.distanceKM
        const radiusKM = dp.radiusMaxKM
        const isInsideRadius = distanceKM <= radiusKM

        let deliveryFee = 0
        let chargeDetails = null

        if (!isInsideRadius) {
            const excessKM = Math.ceil(distanceKM - radiusKM)
            const ratePerKM = dp.chargeOutsideRadius
            deliveryFee = excessKM * ratePerKM
            chargeDetails = {
                baseRadius: radiusKM,
                actualDistance: Math.round(distanceKM * 100) / 100,
                excessDistance: excessKM,
                ratePerKM: ratePerKM,
                totalFee: deliveryFee,
            }
        }

        if (dropPointResult) {
            setDropPointResult({
                ...dropPointResult,
                nearestDropPoint: dp,
                deliveryFee,
                chargeDetails,
                isInsideRadius,
            })
        }
    }

    const handleSearchAddress = async (value: string) => {
        setManualAddress(value)
        if (value.length < 3) {
            setSearchResults([])
            return
        }

        const res = await fetch(`/api/search-address?q=${value}`)
        const data = await res.json()
        setSearchResults(data)
    }

    const handleSelectAddress = (item: typeof searchResults[0]) => {
        const lat = parseFloat(item.lat)
        const lng = parseFloat(item.lon)

        setCustomerLocation({
            lat,
            lng,
            address: item.display_name,
        })
        setManualAddress(item.display_name)
        setSearchResults([])

        findNearestDropPoint(lat, lng, false)
        setStep("positioning")
    }

    const [customerForm, setCustomerForm] = useState({
        name: "",
        phone: "",
        address: "", // Input manual alamat lengkap
        useLoyaltyPoints: 0
    });

    // ORDER LAYANAN
    const [showOrderForm, setShowOrderForm] = useState(false)
    const [createdOrder, setCreatedOrder] = useState<any>(null)
    const [user, setUser] = useState<any>(null) // Fetch user data jika login
    const [paymentMethod, setPaymentMethod] = useState<"qris" | "transfer" | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [orderSummary, setOrderSummary] = useState<any>(null);

    // Handler submit order
    const handleSubmitOrder = async (formData: any) => {
        const res = await fetch("/api/orders/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerInfo: formData.customerInfo,
                serviceType: "antar-jemput",
                pickupLocation: {
                    address: formData.address,
                    coordinates: customerLocation,
                    dropPointId: selectedDropPoint?._id,
                    dropPointName: selectedDropPoint?.name,
                    distanceKM: selectedDropPoint?.distanceKM,
                    deliveryFee: dropPointResult?.deliveryFee
                },
                items: formData.items,
                payment: {
                    method: formData.paymentMethod,
                },
                useLoyaltyPoints: formData.useLoyaltyPoints
            })
        })

        const data = await res.json()
        if (data.success) {
            setCreatedOrder(data.data)
            setShowOrderForm(false)
            setShowPayment(true)
        }
    }

    // Render kondisional
    if (showOrderForm) {
        return (
            <OrderForm
                customerLocation={customerLocation}
                selectedDropPoint={selectedDropPoint}
                deliveryFee={dropPointResult?.deliveryFee || 0}
                user={user}
                onSubmit={handleSubmitOrder}
                onBack={() => setShowOrderForm(false)}
            />
        )
    }

    if (showPayment && createdOrder) {
        return (
            <PaymentPage
                orderData={createdOrder}
                onPaymentComplete={() => router.push("/layanan/pesanan-sukses")}
            />
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Step 1: Pilih Layanan */}
            {step === "pilih" && (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold font-[poppins] text-center">
                        Pilih Layanan
                    </h1>

                    <div className="grid md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handlePilihLayanan("antar-jemput")}
                            className="p-6 border-2 border-gray-200 rounded-2xl hover:border-(--primary) hover:bg-blue-50 transition group text-left"
                        >
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-(--primary)">
                                <TruckIcon className="w-7 h-7 text-(--primary) group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Antar Jemput</h3>
                            <p className="text-gray-600 text-sm">
                                Kurir akan menjemput sepatu di lokasi Anda.
                                Gratis dalam radius drop point!
                            </p>
                        </button>

                        <button
                            onClick={() => handlePilihLayanan("drop-point")}
                            className="p-6 border-2 border-gray-200 rounded-2xl hover:border-(--primary) hover:bg-blue-50 transition group text-left"
                        >
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-(--primary)">
                                <StoreIcon className="w-7 h-7 text-(--primary) group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Antar ke Drop Point</h3>
                            <p className="text-gray-600 text-sm">
                                Anda mengantar sepatu langsung ke drop point terdekat.
                            </p>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Input Lokasi */}
            {step === "lokasi" && layanan === "antar-jemput" && (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold font-[poppins]">
                        Tentukan Lokasi Penjemputan
                    </h1>

                    <button
                        onClick={handleGetLocation}
                        disabled={isGettingLocation}
                        className="w-full p-4 bg-(--primary) text-white rounded-xl flex items-center justify-center gap-2 hover:bg-(--primary-hover) disabled:opacity-50"
                    >
                        <NavigationIcon className="w-5 h-5" />
                        {isGettingLocation ? "Mencari lokasi..." : "Gunakan Lokasi Saat Ini"}
                    </button>

                    <div className="relative">
                        <p className="text-center text-gray-500 my-4">atau</p>

                        <input
                            type="text"
                            placeholder="Ketik alamat lengkap..."
                            value={manualAddress}
                            onChange={(e) => handleSearchAddress(e.target.value)}
                            className="w-full p-4 border rounded-xl"
                        />

                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border rounded-xl mt-2 max-h-60 overflow-y-auto shadow-lg">
                                {searchResults.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectAddress(item)}
                                        className="w-full p-3 text-left hover:bg-gray-100 border-b last:border-b-0"
                                    >
                                        <div className="flex items-start gap-2">
                                            <MapPinIcon className="w-4 h-4 mt-1 text-gray-400" />
                                            <span className="text-sm">{item.display_name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {locationError && (
                        <p className="text-red-500 text-sm">{locationError}</p>
                    )}

                    <button
                        onClick={() => setStep("pilih")}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ← Kembali
                    </button>
                </div>
            )}

            {/* Step Positioning: Atur Pin dengan Presisi */}
            {step === "positioning" && customerLocation && dropPointResult && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CrosshairIcon className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                                <h3 className="font-bold text-blue-800">Sesuaikan Lokasi Anda</h3>
                                <p className="text-sm text-blue-600 mt-1">
                                    Posisikan pin merah pada lokasi Anda secara akurat.
                                    Geser peta untuk memindahkan pin ke titik penjemputan yang tepat.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Map Phase Positioning */}
                    <div className="h-96 rounded-2xl overflow-hidden border-2 border-blue-300 relative">
                        <MapComponent
                            phase="positioning"
                            customerLat={customerLocation.lat}
                            customerLng={customerLocation.lng}
                            allDropPoints={dropPointResult.allDropPoints}
                            selectedDropPointId={selectedDropPoint?._id || ""}
                            onSelectDropPoint={() => { }}
                            draggable={true}
                            onCustomerPositionChange={handlePositionChange}
                        />

                        {/* Overlay hint */}
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg">
                            <p className="text-sm text-center text-gray-700">
                                <span className="font-medium">💡 Tip:</span> Zoom in dan geser peta untuk presisi maksimal
                            </p>
                        </div>
                    </div>

                    {/* Info lokasi saat ini */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Alamat terdeteksi:</span><br />
                            {customerLocation.address}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Koordinat: {customerLocation.lat.toFixed(6)}, {customerLocation.lng.toFixed(6)}
                        </p>
                    </div>

                    {/* Tombol Konfirmasi */}
                    <button
                        onClick={handleConfirmPosition}
                        className="w-full p-4 bg-(--primary) text-white rounded-xl font-medium hover:bg-(--primary-hover) flex items-center justify-center gap-2"
                    >
                        <CheckCircle2Icon className="w-5 h-5" />
                        Lokasi Sudah Benar - Lihat Drop Point
                    </button>

                    <button
                        onClick={() => setStep("lokasi")}
                        className="w-full p-4 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
                    >
                        ← Cari Ulang Lokasi
                    </button>
                </div>
            )}

            {/* Step Overview: Animasi transisi */}
            {step === "overview" && customerLocation && dropPointResult && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <div>
                                <h3 className="font-bold text-blue-800">Mencari Drop Point Terdekat...</h3>
                                <p className="text-sm text-blue-600">
                                    Menampilkan semua lokasi drop point
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="h-96 rounded-2xl overflow-hidden border-2 border-blue-300">
                        <MapComponent
                            phase={mapPhase}
                            customerLat={customerLocation.lat}
                            customerLng={customerLocation.lng}
                            allDropPoints={dropPointResult.allDropPoints}
                            selectedDropPointId={selectedDropPoint?._id || ""}
                            onSelectDropPoint={() => { }}
                            nearestDropPoint={dropPointResult.nearestDropPoint}
                        />
                    </div>
                </div>
            )}

            {/* Step Konfirmasi */}
            {step === "konfirmasi" && customerLocation && dropPointResult && selectedDropPoint && (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold font-[poppins]">
                        Konfirmasi Lokasi
                    </h1>

                    <div className="h-96 rounded-2xl overflow-hidden border">
                        <MapComponent
                            phase="focusing"
                            customerLat={customerLocation.lat}
                            customerLng={customerLocation.lng}
                            allDropPoints={dropPointResult.allDropPoints}
                            selectedDropPointId={selectedDropPoint._id}
                            onSelectDropPoint={handleSelectDropPoint}
                            nearestDropPoint={dropPointResult.nearestDropPoint}
                        />
                    </div>

                    {/* Legenda */}
                    <div className="flex flex-wrap gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-5 bg-red-500 rounded-full shadow-sm"></div>
                            <span>Lokasi Anda</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-5 bg-green-500 rounded-full shadow-sm"></div>
                            <span>Drop Point Terpilih</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                            <span>Drop Point Lain</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-blue-500 border-t-2 border-dashed"></div>
                            <span>Jarak {selectedDropPoint.distanceKM} km</span>
                        </div>
                    </div>

                    {/* Info Lokasi Customer */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <h3 className="font-semibold mb-2">Alamat Penjemputan:</h3>
                        <p className="text-sm text-gray-600">{customerLocation.address}</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Lat: {customerLocation.lat.toFixed(6)}, Lng: {customerLocation.lng.toFixed(6)}
                        </p>
                    </div>

                    {/* Info Drop Point Terpilih */}
                    <div className={`p-4 rounded-xl border-2 ${dropPointResult.isInsideRadius
                        ? 'border-green-300 bg-green-50'
                        : 'border-yellow-300 bg-yellow-50'
                        }`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <StoreIcon className={`w-6 h-6 mt-1 ${dropPointResult.isInsideRadius ? 'text-green-600' : 'text-yellow-600'
                                    }`} />
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {selectedDropPoint.name}
                                        {selectedDropPoint.isNearest && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">
                                                Terdekat
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600">{selectedDropPoint.address}</p>
                                    <div className="mt-2 flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">Jarak dari Anda:</span>
                                        <span className="font-bold text-lg text-blue-600">
                                            {selectedDropPoint.distanceKM} km
                                        </span>
                                        <span className="text-gray-400">|</span>
                                        <span className="text-gray-500">
                                            Radius gratis: {selectedDropPoint.radiusMaxKM} km
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${dropPointResult.isInsideRadius
                                ? 'bg-green-500 text-white'
                                : 'bg-yellow-500 text-white'
                                }`}>
                                {dropPointResult.isInsideRadius ? 'GRATIS' : 'BERBAYAR'}
                            </div>
                        </div>
                    </div>

                    {/* Rincian Biaya */}
                    {!dropPointResult.isInsideRadius && dropPointResult.chargeDetails && (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                            <h4 className="font-semibold text-orange-800 mb-3">Rincian Biaya Penjemputan</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Radius gratis</span>
                                    <span>{dropPointResult.chargeDetails.baseRadius} km</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Jarak lokasi Anda</span>
                                    <span>{dropPointResult.chargeDetails.actualDistance} km</span>
                                </div>
                                <div className="flex justify-between text-orange-600">
                                    <span>Kelebihan jarak</span>
                                    <span>{dropPointResult.chargeDetails.excessDistance} km</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tarif per km</span>
                                    <span>Rp {dropPointResult.chargeDetails.ratePerKM.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="border-t border-orange-200 pt-2 flex justify-between font-bold text-lg">
                                    <span>Total biaya penjemputan</span>
                                    <span className="text-orange-700">
                                        Rp {dropPointResult.deliveryFee.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {dropPointResult.isInsideRadius && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                                ✓
                            </div>
                            <div>
                                <p className="font-bold text-green-800">Gratis Penjemputan!</p>
                                <p className="text-sm text-green-600">
                                    Lokasi Anda berada dalam radius {selectedDropPoint.radiusMaxKM} km dari drop point
                                </p>
                            </div>
                        </div>
                    )}

                    {/* List Semua Drop Point */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                            Pilih drop point lain (opsional):
                        </p>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {dropPointResult.allDropPoints.map((dp, index) => (
                                <button
                                    key={dp._id}
                                    onClick={() => handleSelectDropPoint(dp)}
                                    className={`w-full p-3 rounded-lg border-2 text-left transition ${dp._id === selectedDropPoint._id
                                        ? 'border-blue-500 bg-blue-50'
                                        : dp.isInsideRadius
                                            ? 'border-green-200 hover:bg-green-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm">
                                                {index + 1}. {dp.name}
                                                {dp.isNearest && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-2">
                                                        terdekat
                                                    </span>
                                                )}
                                                {dp._id === selectedDropPoint._id && (
                                                    <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded ml-2">
                                                        dipilih
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{dp.address}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm">{dp.distanceKM} km</p>
                                            <p className={`text-xs ${dp.isInsideRadius ? 'text-green-600' : 'text-orange-600'
                                                }`}>
                                                {dp.isInsideRadius ? 'Gratis' : 'Berbayar'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setStep("positioning")}
                            className="flex-1 p-4 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                        >
                            Ubah Lokasi
                        </button>
                        {/* <button
                            onClick={() => {
                                const orderData = {
                                    layanan: "antar-jemput",
                                    customerLocation,
                                    dropPoint: selectedDropPoint,
                                    deliveryFee: dropPointResult.deliveryFee,
                                }
                                localStorage.setItem("orderDraft", JSON.stringify(orderData))
                                setShowOrderForm(true)
                            }}
                            className="flex-1 p-4 bg-(--primary) text-white rounded-xl hover:bg-(--primary-hover) font-medium"
                        >
                            Lanjutkan Pesanan →
                        </button> */}
                        <button
                            onClick={() => setShowOrderForm(true)}  // ← BUKAN router.push
                            className="flex-1 p-4 bg-(--primary) text-white rounded-xl hover:bg-(--primary-hover) font-medium"
                        >
                            Lanjutkan Pesanan →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}