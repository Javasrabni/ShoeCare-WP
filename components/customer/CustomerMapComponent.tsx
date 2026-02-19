// components/customer/CustomerMapComponent.tsx
"use client"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, Polyline } from "react-leaflet"
import { useEffect, useRef, useState, useCallback } from "react"
import L from "leaflet"

// Type definitions
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

type CustomerLocation = {
    lat: number
    lng: number
    address?: string
}

// Custom icon modern menggunakan SVG
const createCustomIcon = (color: string, size: number = 25): L.DivIcon => L.divIcon({
    className: "custom-marker",
    html: `
        <svg width="${size}" height="${size * 1.4}" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z" fill="${color}"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
        </svg>
    `,
    iconSize: [size, size * 1.4],
    iconAnchor: [size / 2, size * 1.4],
    popupAnchor: [0, -size * 1.4],
})

const customerIcon = createCustomIcon("#ef4444", 28)
const dropPointIcon = createCustomIcon("#3b82f6", 25)
const nearestDropPointIcon = createCustomIcon("#10b981", 28)

// Component untuk kontrol zoom dengan animasi berurutan
function MapController({
    phase,
    customerLocation,
    nearestDropPoint,
    allDropPoints,
    onPositionChange,
    onAnimationComplete
}: {
    phase: "positioning" | "overview" | "focusing"
    customerLocation: CustomerLocation
    nearestDropPoint: DropPointData | null
    allDropPoints: DropPointData[]
    onPositionChange?: (lat: number, lng: number) => void
    onAnimationComplete?: () => void
}) {
    const map = useMap()
    const hasInitialized = useRef(false)

    useEffect(() => {
        if (phase === "positioning" && !hasInitialized.current) {
            map.setView([customerLocation.lat, customerLocation.lng], 18, {
                animate: true,
                duration: 1
            })
            hasInitialized.current = true

        } else if (phase === "overview" && nearestDropPoint) {
            // Step 1: Zoom out lihat semua drop point
            const allBounds = L.latLngBounds([
                L.latLng(customerLocation.lat, customerLocation.lng)
            ])

            allDropPoints.forEach((dp) => {
                allBounds.extend(L.latLng(
                    dp.location.coordinates[1],
                    dp.location.coordinates[0]
                ))
            })

            map.fitBounds(allBounds, {
                padding: [50, 50],
                animate: true,
                duration: 1.5
            })

        } else if (phase === "focusing" && nearestDropPoint) {
            // Step 2: Zoom ke customer + nearest drop point
            const focusBounds = L.latLngBounds([
                L.latLng(customerLocation.lat, customerLocation.lng),
                L.latLng(
                    nearestDropPoint.location.coordinates[1],
                    nearestDropPoint.location.coordinates[0]
                )
            ])

            map.fitBounds(focusBounds, {
                padding: [100, 100],
                animate: true,
                duration: 1.2
            })
        }
    }, [phase, customerLocation, nearestDropPoint, allDropPoints, map])

    // Update posisi saat peta bergerak (hanya di phase positioning)
    useEffect(() => {
        if (phase !== "positioning") return

        const handleMove = () => {
            const center = map.getCenter()
            onPositionChange?.(center.lat, center.lng)
        }

        map.on('move', handleMove)
        return () => {
            map.off('move', handleMove)
        }
    }, [phase, map, onPositionChange])

    return null
}

interface CustomerMapComponentProps {
    phase: "positioning" | "overview" | "focusing"
    customerLat: number
    customerLng: number
    allDropPoints: DropPointData[]
    selectedDropPointId: string
    onSelectDropPoint: (dp: DropPointData) => void
    nearestDropPoint?: DropPointData | null
    onCustomerPositionChange?: (lat: number, lng: number) => void
    draggable?: boolean
    onAnimationComplete?: () => void
}

export default function CustomerMapComponent({
    phase,
    customerLat,
    customerLng,
    allDropPoints,
    selectedDropPointId,
    onSelectDropPoint,
    nearestDropPoint,
    onCustomerPositionChange,
    draggable = false,
    onAnimationComplete
}: CustomerMapComponentProps) {
    const [position, setPosition] = useState<CustomerLocation>({
        lat: customerLat,
        lng: customerLng
    })

    useEffect(() => {
        setPosition({ lat: customerLat, lng: customerLng })
    }, [customerLat, customerLng])

    const handleDragEnd = useCallback((e: L.DragEndEvent) => {
        const marker = e.target
        const newPos = marker.getLatLng()
        setPosition({ lat: newPos.lat, lng: newPos.lng })
        onCustomerPositionChange?.(newPos.lat, newPos.lng)
    }, [onCustomerPositionChange])

    const handlePositionChange = useCallback((lat: number, lng: number) => {
        setPosition({ lat, lng })
        onCustomerPositionChange?.(lat, lng)
    }, [onCustomerPositionChange])

    const selectedDP = allDropPoints.find(dp => dp._id === selectedDropPointId) || nearestDropPoint

    const linePositions: [number, number][] = selectedDP ? [
        [position.lat, position.lng],
        [selectedDP.location.coordinates[1], selectedDP.location.coordinates[0]]
    ] : []

    const distance = selectedDP?.distanceKM || 0

    return (
        <MapContainer
            center={[position.lat, position.lng]}
            zoom={18}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Garis penghubung - tampil di overview dan focusing */}
            {(phase === "overview" || phase === "focusing") && selectedDP && linePositions.length === 2 && (
                <>
                    <Polyline
                        positions={linePositions}
                        pathOptions={{
                            color: '#3b82f6',
                            weight: 4,
                            opacity: 0.9,
                            dashArray: phase === "focusing" ? '0' : '10, 10',
                        }}
                    />
                    {/* Label jarak */}
                    <Marker
                        position={[
                            (position.lat + selectedDP.location.coordinates[1]) / 2,
                            (position.lng + selectedDP.location.coordinates[0]) / 2
                        ]}
                        icon={L.divIcon({
                            className: "distance-label",
                            html: `
                                <div style="
                                    background: ${phase === "focusing" ? "#10b981" : "#3b82f6"};
                                    color: white;
                                    padding: 6px 14px;
                                    border-radius: 20px;
                                    font-size: 13px;
                                    font-weight: bold;
                                    white-space: nowrap;
                                    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
                                    border: 2px solid white;
                                ">
                                    ${distance} km
                                </div>
                            `,
                            iconSize: [70, 28],
                            iconAnchor: [35, 14],
                        })}
                    />
                </>
            )}

            {/* Customer Marker */}
            <Marker
                position={[position.lat, position.lng]}
                icon={customerIcon}
                zIndexOffset={1000}
                draggable={draggable && phase === "positioning"}
                eventHandlers={{
                    dragend: handleDragEnd,
                }}
            >
                <Popup>
                    <div className="text-sm">
                        <p className="font-bold text-red-600">Lokasi Anda</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                        </p>
                    </div>
                </Popup>
            </Marker>

            {/* Semua Drop Point */}
            {allDropPoints.map((dp) => {
                const lat = dp.location.coordinates[1]
                const lng = dp.location.coordinates[0]
                const isSelected = dp._id === selectedDropPointId
                const isNearest = dp.isNearest

                return (
                    <div key={dp._id}>
                        <Marker
                            position={[lat, lng]}
                            icon={isSelected ? nearestDropPointIcon : dropPointIcon}
                            eventHandlers={{
                                click: () => onSelectDropPoint(dp),
                            }}
                            zIndexOffset={isSelected ? 500 : 0}
                        >
                            <Popup>
                                <div className="text-sm max-w-xs p-2">
                                    <p className={`font-bold ${isSelected ? 'text-green-600' : 'text-blue-600'}`}>
                                        {dp.name}
                                        {isSelected && ' (Terpilih)'}
                                        {isNearest && !isSelected && ' (Terdekat)'}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1">{dp.address}</p>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-sm">
                                            Jarak: <span className="font-bold">{dp.distanceKM} km</span>
                                        </p>
                                        <p className="text-xs">
                                            Radius gratis: {dp.radiusMaxKM} km
                                        </p>
                                    </div>
                                    <div className={`mt-2 text-xs font-medium ${dp.isInsideRadius ? 'text-green-600' : 'text-orange-600'
                                        }`}>
                                        {dp.isInsideRadius ? '✓ Dalam area gratis' : '⚠ Luar area gratis'}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Radius circle - selalu tampil di phase focusing */}
                        {(isSelected || phase === "focusing") && (
                            <Circle
                                center={[lat, lng]}
                                radius={dp.radiusMaxKM * 1000}
                                pathOptions={{
                                    color: isSelected ? '#10b981' : '#3b82f6',
                                    fillColor: isSelected ? '#10b981' : '#3b82f6',
                                    fillOpacity: phase === "focusing" ? 0.15 : 0.1,
                                    weight: isSelected ? 3 : 2,
                                    dashArray: isSelected ? '0' : '5, 5',
                                }}
                            />
                        )}
                    </div>
                )
            })}

            <MapController
                phase={phase}
                customerLocation={position}
                nearestDropPoint={nearestDropPoint || null}
                allDropPoints={allDropPoints}
                onPositionChange={handlePositionChange}
                onAnimationComplete={onAnimationComplete}
            />
        </MapContainer>
    )
}