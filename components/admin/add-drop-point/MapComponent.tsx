"use client"
import "leaflet/dist/leaflet.css"
import {
    MapContainer,
    TileLayer,
    useMapEvents,
    useMap,
    Circle,
} from "react-leaflet"
import { useEffect, useState, useRef } from "react"
import { MapPinIcon } from "lucide-react"
import * as L from 'leaflet'

type Props = {
    lat: number
    lng: number
    radius?: number
    onChange?: (coords: [number, number]) => void
    interactive?: boolean
    widthMap?: string
    heightMap?: string
}

// Component untuk handle zoom berdasarkan radius (hanya sekali saat radius berubah)
function SetInitialZoom({ radius }: { radius?: number }) {
    const map = useMap()
    const hasZoomed = useRef(false)
    
    useEffect(() => {
        // Hanya jalankan sekali saat radius pertama kali ada
        if (radius && !hasZoomed.current) {
            const radiusMeters = radius * 1000
            const bounds = L.latLng(map.getCenter()).toBounds(radiusMeters * 1)
            map.fitBounds(bounds, { padding: [20, 20] })
            hasZoomed.current = true
        }
    }, [radius, map])
    
    return null
}

// Component untuk update center saat lat/lng berubah (tanpa ubah zoom)
function UpdateCenter({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap()
    const prevCenter = useRef<L.LatLng | null>(null)
    
    useEffect(() => {
        const newCenter = L.latLng(lat, lng)
        
        // Hanya update jika center benar-benar berubah signifikan
        // dan jangan ubah zoom level
        if (!prevCenter.current || !prevCenter.current.equals(newCenter, 0.0001)) {
            map.setView(newCenter, map.getZoom(), { animate: false })
            prevCenter.current = newCenter
        }
    }, [lat, lng, map])
    
    return null
}

export default function MapComponent({
    lat,
    lng,
    radius,
    onChange,
    interactive = true,
    widthMap = "w-full",
    heightMap = "h-[400px]"
}: Props) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const radiusInMeters = radius ? radius * 1000 : undefined

    function MapEventsHandler() {
        useMapEvents({
            dragend: (e) => {
                const center = e.target.getCenter()
                onChange?.([center.lat, center.lng])
            },
        })
        return null
    }

    return (
        <div className={`relative scaleMap ${widthMap} ${heightMap} rounded-xl overflow-hidden`}>
            <MapContainer
                center={[lat, lng]}
                zoom={15}
                dragging={interactive}
                scrollWheelZoom={interactive}
                doubleClickZoom={interactive}
                zoomControl={interactive}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {radiusInMeters && (
                    <Circle
                        center={[lat, lng]}
                        radius={radiusInMeters}
                        pathOptions={{
                            color: '#3b82f6',
                            fillColor: '#3b82f6',
                            fillOpacity: 0.15,
                            weight: 2,
                        }}
                    />
                )}

                {/* Pisahkan komponen: zoom hanya saat radius berubah, center saat lat/lng berubah */}
                <SetInitialZoom radius={radius} />
                <UpdateCenter lat={lat} lng={lng} />
                <MapEventsHandler />
            </MapContainer>

            <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
                <div className="text-(--primary) text-5xl drop-shadow-xl">
                    <MapPinIcon />
                </div>
            </div>

            {radius && (
                <div className="absolute z-20 bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-700">
                    Radius: {radius} KM
                </div>
            )}
        </div>
    )
}