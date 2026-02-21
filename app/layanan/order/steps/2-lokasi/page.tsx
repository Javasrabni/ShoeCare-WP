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
          {/* Header */}
          <div className="space-y-2">
            <button
              onClick={() => router.push("/layanan/order/steps/1-pilih-layanan")}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm">Kembali</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Tentukan Lokasi Penjemputan</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Pilih lokasi agar kurir kami dapat menjemput sepatu Anda dengan tepat.
            </p>
          </div>

          {/* GPS Button */}
          <button
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="w-full py-4 bg-blue-600 text-white rounded-full flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200"
          >
            {isGettingLocation ? (
              <Loader2Icon className="w-5 h-5 animate-spin" />
            ) : (
              <NavigationIcon className="w-5 h-5" />
            )}
            <span className="text-base font-semibold">
              {isGettingLocation ? "Mencari lokasi..." : "Gunakan Lokasi Saat Ini"}
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <span className="relative px-4 bg-white text-sm text-gray-400 uppercase tracking-wide">
              Atau
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ketik alamat lengkap..."
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="w-full py-4 pl-12 pr-4 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
            />
            {isSearching && (
              <Loader2Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectAddress(item)}
                  className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                >
                  <MapPinIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 leading-relaxed">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Map Preview (if available) */}
          {customerLocation && (
            <div className="rounded-2xl overflow-hidden border border-gray-200 h-48 bg-gray-100 relative">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <MapPinIcon className="w-8 h-8 text-blue-500" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <p className="text-white text-sm font-medium truncate">{customerLocation.address}</p>
              </div>
            </div>
          )}

          {locationError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {locationError}
            </div>
          )}

          {/* Help Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Butuh bantuan?{" "}
              <button className="text-blue-600 font-medium hover:underline">
                Hubungi CS Kami
              </button>
            </p>
          </div>
        </div>
      )}

      {/* SUB-STEP: POSITIONING (Map dengan draggable pin) */}
      {subStep === "positioning" && customerLocation && dropPointResult && (
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <button
              onClick={() => setSubStep("lokasi")}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm">Kembali</span>
            </button>
            <h2 className="text-xl font-bold text-gray-900">Sesuaikan Lokasi</h2>
            <p className="text-gray-500 text-sm">
              Geser pin untuk menentukan titik penjemputan yang tepat
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <CrosshairIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Pastikan pin berada di lokasi penjemputan yang benar
            </p>
          </div>

          {/* Map */}
          <div className="h-80 rounded-2xl overflow-hidden border-2 border-blue-200 relative">
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
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
              <p className="text-xs text-center text-gray-600">
                <span className="font-medium">Tip:</span> Zoom in dan geser peta untuk presisi maksimal
              </p>
            </div>
          </div>

          {/* Address Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Alamat:</span> {customerLocation.address}
            </p>
            <p className="text-xs text-gray-400">
              {customerLocation.lat.toFixed(6)}, {customerLocation.lng.toFixed(6)}
            </p>
            {adjustedPosition && (
              <p className="text-xs text-orange-600">
                *Adjusted: {adjustedPosition.lat.toFixed(6)}, {adjustedPosition.lng.toFixed(6)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleConfirmPosition}
              disabled={isCalculating}
              className="w-full py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
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
              className="w-full py-4 text-gray-600 font-medium hover:text-gray-800"
            >
              Cari Ulang Lokasi
            </button>
          </div>
        </div>
      )}

      {/* SUB-STEP: OVERVIEW (Loading animation) */}
      {subStep === "overview" && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-gray-900">Mencari Drop Point Terdekat...</h3>
            <p className="text-gray-500 text-sm">Menampilkan semua lokasi drop point</p>
          </div>

          {customerLocation && dropPointResult && (
            <div className="w-full h-48 rounded-2xl overflow-hidden border border-gray-200 opacity-50">
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
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Konfirmasi Lokasi</h2>
            <p className="text-gray-500 text-sm">Pastikan lokasi penjemputan sudah benar</p>
          </div>

          {/* Map */}
          <div className="h-64 rounded-2xl overflow-hidden border border-gray-200">
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
          <div className="flex flex-wrap gap-4 text-xs bg-gray-50 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Lokasi Anda</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Drop Point Terpilih</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Drop Point Lain</span>
            </div>
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            {/* Pickup Location */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPinIcon className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Lokasi Penjemputan</p>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    {customerLocation.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Drop Point */}
            <div className={`rounded-xl border-2 p-4 ${dropPointResult.isInsideRadius
                ? 'border-green-200 bg-green-50/50'
                : 'border-orange-200 bg-orange-50/50'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${dropPointResult.isInsideRadius ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                  <StoreIcon className={`w-5 h-5 ${dropPointResult.isInsideRadius ? 'text-green-600' : 'text-orange-600'
                    }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{selectedDropPoint.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dropPointResult.isInsideRadius
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 text-white'
                      }`}>
                      {dropPointResult.isInsideRadius ? 'GRATIS' : 'BERBAYAR'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{selectedDropPoint.address}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-600">
                      Jarak: <span className="font-semibold text-gray-900">{selectedDropPoint.distanceKM} km</span>
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">
                      Radius gratis: {selectedDropPoint.radiusMaxKM} km
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Fee Detail */}
          {!dropPointResult.isInsideRadius && dropPointResult.chargeDetails && (
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-orange-800 mb-3 text-sm">Rincian Ongkir</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Kelebihan jarak</span>
                  <span>{dropPointResult.chargeDetails.excessDistance} km</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tarif per km</span>
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
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">Gratis Penjemputan!</p>
                <p className="text-xs text-green-600">
                  Lokasi Anda dalam radius {selectedDropPoint.radiusMaxKM} km
                </p>
              </div>
            </div>
          )}

          {/* Drop Point List */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Pilih drop point lain:</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {dropPointResult.allDropPoints.map((dp, index) => (
                <button
                  key={dp._id}
                  onClick={() => handleSelectDropPoint(dp)}
                  className={`w-full p-3 rounded-xl border text-left transition ${dp._id === selectedDropPoint._id
                      ? 'border-blue-500 bg-blue-50'
                      : dp.isInsideRadius
                        ? 'border-green-200 hover:bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{dp.name}</span>
                        {dp.isNearest && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            terdekat
                          </span>
                        )}
                        {dp._id === selectedDropPoint._id && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            dipilih
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{dp.address}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-medium text-sm text-gray-900">{dp.distanceKM} km</p>
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
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setSubStep("positioning")}
              className="flex-1 py-4 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 font-medium text-sm"
            >
              Ubah Lokasi
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium text-sm shadow-lg shadow-blue-200"
            >
              Lanjut →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}