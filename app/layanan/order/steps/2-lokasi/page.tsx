// app/layanan/steps/2-lokasi/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  MapPinIcon, NavigationIcon, CheckCircle2Icon, CrosshairIcon,
  ArrowLeftIcon, StoreIcon, SearchIcon, Loader2Icon
} from "lucide-react"
import { getOrderDraft, saveOrderDraft } from "@/lib/order-storage"

const MapComponent = dynamic(
  () => import("@/components/customer/CustomerMapComponent"),
  { ssr: false }
)

type DropPointData = {
  _id: string
  name: string
  address: string
  location: { coordinates: [number, number] }
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

// Sub-steps: lokasi -> positioning -> overview -> konfirmasi
type SubStep = "lokasi" | "positioning" | "overview" | "konfirmasi"

export default function Step2Lokasi() {
  const router = useRouter()

  // State dari localStorage atau fresh
  const [subStep, setSubStep] = useState<SubStep>("lokasi")
  const [mapPhase, setMapPhase] = useState<"positioning" | "overview" | "focusing">("positioning")

  const [customerLocation, setCustomerLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)
  const [adjustedPosition, setAdjustedPosition] = useState<{ lat: number, lng: number } | null>(null)
  const [dropPointResult, setDropPointResult] = useState<DropPointResult | null>(null)
  const [selectedDropPoint, setSelectedDropPoint] = useState<DropPointData | null>(null)

  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [manualAddress, setManualAddress] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{
    lat: string
    lon: string
    display_name: string
  }>>([])
  const [isSearching, setIsSearching] = useState(false)

  // Load dari localStorage saat mount
  useEffect(() => {
    const draft = getOrderDraft()
    if (!draft) {
      router.push("/layanan/order/steps/1-pilih-layanan")
      return
    }

    // Restore state jika ada
    if (draft.customerLocation) {
      setCustomerLocation(draft.customerLocation)
      setDropPointResult(draft.dropPointResult)
      setSelectedDropPoint(draft.selectedDropPoint)

      // Determine subStep berdasarkan data tersimpan
      if (draft.selectedDropPoint) {
        setSubStep("konfirmasi")
      }
    }
  }, [router])

  // Auto-save ke localStorage
  const saveProgress = useCallback(() => {
    if (!customerLocation || !dropPointResult || !selectedDropPoint) return

    saveOrderDraft({
      step: 2,
      customerLocation,
      dropPointResult,
      selectedDropPoint,
    })
  }, [customerLocation, dropPointResult, selectedDropPoint])

  // Search address dengan debounce
  useEffect(() => {
    if (manualAddress.length < 3) {
      setSearchResults([])
      return
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/search-address?q=${encodeURIComponent(manualAddress)}`)
        const data = await res.json()
        setSearchResults(data || [])
      } catch (error) {
        console.error("Search error:", error)
      }
      setIsSearching(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [manualAddress])

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
          await findNearestDropPoint(latitude, longitude)
        } catch (error) {
          // Fallback tanpa alamat
          setCustomerLocation({
            lat: latitude,
            lng: longitude,
            address: "Lokasi saat ini",
          })
          await findNearestDropPoint(latitude, longitude)
        }

        setIsGettingLocation(false)
        setSubStep("positioning")
      },
      (error) => {
        setLocationError("Gagal mendapatkan lokasi: " + error.message)
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const findNearestDropPoint = async (lat: number, lng: number) => {
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
      } else {
        setLocationError(data.message)
      }
    } catch (error) {
      setLocationError("Gagal mencari drop point")
    }
    setIsCalculating(false)
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

    findNearestDropPoint(lat, lng)
    setSubStep("positioning")
  }

  const handlePositionChange = (lat: number, lng: number) => {
    setAdjustedPosition({ lat, lng })
  }

  const handleConfirmPosition = async () => {
    const finalPosition = adjustedPosition || customerLocation
    if (!finalPosition || !customerLocation) return

    // Update location dengan posisi adjusted
    const updatedLocation = {
      ...customerLocation,
      lat: finalPosition.lat,
      lng: finalPosition.lng
    }
    setCustomerLocation(updatedLocation)

    // Re-calculate dengan posisi baru
    setIsCalculating(true)
    await findNearestDropPoint(finalPosition.lat, finalPosition.lng)
    setIsCalculating(false)

    // Animasi: overview -> focusing -> konfirmasi
    setSubStep("overview")
    setMapPhase("overview")

    setTimeout(() => {
      setMapPhase("focusing")
      setTimeout(() => {
        setSubStep("konfirmasi")
        // Save progress
        saveOrderDraft({
          step: 2,
          customerLocation: updatedLocation,
          dropPointResult,
          selectedDropPoint,
        })
      }, 1500)
    }, 2000)
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

  const handleNext = () => {
    if (!customerLocation || !dropPointResult || !selectedDropPoint) {
      alert("Lengkapi data lokasi terlebih dahulu")
      return
    }

    saveOrderDraft({
      step: 2,
      customerLocation,
      dropPointResult,
      selectedDropPoint,
    })
    router.push("/layanan/order/steps/3-detail-pesanan")
  }

  // Render berdasarkan subStep
  return (
    <div>
      {/* SUB-STEP: LOKASI (Input/Search) */}
      {subStep === "lokasi" && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-[poppins]">Tentukan Lokasi</h2>
            <p className="text-gray-500 mt-2">Bagaimana kami menemukan Anda?</p>
          </div>

          {/* GPS Button */}
          <button
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="w-full p-6 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isGettingLocation ? (
              <Loader2Icon className="w-6 h-6 animate-spin" />
            ) : (
              <NavigationIcon className="w-6 h-6" />
            )}
            <span className="text-lg font-medium">
              {isGettingLocation ? "Mencari lokasi..." : "Gunakan Lokasi Saat Ini"}
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">atau</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ketik alamat lengkap..."
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="w-full p-4 pl-12 border rounded-xl focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <Loader2Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectAddress(item)}
                  className="w-full p-4 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-3"
                >
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {locationError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">
              {locationError}
            </div>
          )}

          <button
            onClick={() => router.push("/layanan/order/steps/1-pilih-layanan")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Kembali
          </button>
        </div>
      )}

      {/* SUB-STEP: POSITIONING (Map dengan draggable pin) */}
      {subStep === "positioning" && customerLocation && dropPointResult && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CrosshairIcon className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900">Sesuaikan Lokasi Anda</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Geser pin merah untuk menentukan titik penjemputan yang tepat
                </p>
              </div>
            </div>
          </div>

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
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg">
              <p className="text-sm text-center text-gray-700">
                💡 <span className="font-medium">Tip:</span> Zoom in dan geser peta untuk presisi maksimal
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Alamat:</span> {customerLocation.address}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Koordinat: {customerLocation.lat.toFixed(6)}, {customerLocation.lng.toFixed(6)}
            </p>
            {adjustedPosition && (
              <p className="text-xs text-orange-600 mt-1">
                *Adjusted: {adjustedPosition.lat.toFixed(6)}, {adjustedPosition.lng.toFixed(6)}
              </p>
            )}
          </div>

          <button
            onClick={handleConfirmPosition}
            disabled={isCalculating}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCalculating ? (
              <Loader2Icon className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2Icon className="w-5 h-5" />
            )}
            {isCalculating ? "Menghitung..." : "Konfirmasi Lokasi"}
          </button>

          <button
            onClick={() => setSubStep("lokasi")}
            className="w-full py-4 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
          >
            ← Cari Ulang Lokasi
          </button>
        </div>
      )}

      {/* SUB-STEP: OVERVIEW (Loading animation) */}
      {subStep === "overview" && (
        <div className="space-y-4 py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800">Mencari Drop Point Terdekat...</h3>
            <p className="text-gray-500 mt-2">Menampilkan semua lokasi drop point</p>
          </div>

          {customerLocation && dropPointResult && (
            <div className="h-64 rounded-2xl overflow-hidden border-2 border-blue-300 opacity-50">
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
          )}
        </div>
      )}

      {/* SUB-STEP: KONFIRMASI (Final review) */}
      {subStep === "konfirmasi" && customerLocation && dropPointResult && selectedDropPoint && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-[poppins]">Konfirmasi Lokasi</h2>

          {/* Map */}
          <div className="h-80 rounded-2xl overflow-hidden border">
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

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Lokasi Anda</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Drop Point Terpilih</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Drop Point Lain</span>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4" /> Alamat Penjemputan
              </h4>
              <p className="text-sm text-gray-600">{customerLocation.address}</p>
            </div>

            <div className={`p-4 rounded-xl border-2 ${dropPointResult.isInsideRadius
              ? 'border-green-300 bg-green-50'
              : 'border-yellow-300 bg-yellow-50'
              }`}>
              <div className="flex items-start gap-3">
                <StoreIcon className={`w-6 h-6 ${dropPointResult.isInsideRadius ? 'text-green-600' : 'text-yellow-600'}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{selectedDropPoint.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${dropPointResult.isInsideRadius ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                      }`}>
                      {dropPointResult.isInsideRadius ? 'GRATIS' : 'BERBAYAR'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{selectedDropPoint.address}</p>
                  <p className="text-sm mt-2">
                    Jarak: <span className="font-bold text-blue-600">{selectedDropPoint.distanceKM} km</span>
                    {' '}| Radius gratis: {selectedDropPoint.radiusMaxKM} km
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Fee Detail */}
          {!dropPointResult.isInsideRadius && dropPointResult.chargeDetails && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3">Rincian Ongkir</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kelebihan jarak</span>
                  <span>{dropPointResult.chargeDetails.excessDistance} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarif per km</span>
                  <span>Rp {dropPointResult.chargeDetails.ratePerKM.toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t border-orange-200 pt-2 flex justify-between font-bold text-orange-800">
                  <span>Total ongkir</span>
                  <span>Rp {dropPointResult.deliveryFee.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          {dropPointResult.isInsideRadius && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">✓</div>
              <div>
                <p className="font-bold text-green-800">Gratis Penjemputan!</p>
                <p className="text-sm text-green-600">
                  Lokasi Anda dalam radius {selectedDropPoint.radiusMaxKM} km
                </p>
              </div>
            </div>
          )}

          {/* Drop Point List */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Pilih drop point lain:</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
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
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">
                        {index + 1}. {dp.name}
                        {dp.isNearest && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">terdekat</span>}
                        {dp._id === selectedDropPoint._id && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">dipilih</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{dp.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{dp.distanceKM} km</p>
                      <p className={`text-xs ${dp.isInsideRadius ? 'text-green-600' : 'text-orange-600'}`}>
                        {dp.isInsideRadius ? 'Gratis' : 'Berbayar'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setSubStep("positioning")}
              className="flex-1 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
            >
              Ubah Lokasi
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
            >
              Lanjut ke Detail Pesanan →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}