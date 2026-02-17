"use client"
import "leaflet/dist/leaflet.css"


import {
    MapContainer,
    TileLayer,
    useMapEvents,
    useMap,
} from "react-leaflet"
import { useEffect, useState } from "react"
import { MapPinIcon } from "lucide-react"

type Props = {
    lat: number
    lng: number
    onChange?: (coords: [number, number]) => void
    interactive?: boolean
    widthMap?: string
    heightMap?: string
}

function ChangeView({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap()

    useEffect(() => {
        map.setView([lat, lng])
    }, [lat, lng, map])

    return null
}

export default function MapComponent({
    lat,
    lng,
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
                zoom={16}
                dragging={interactive}
                scrollWheelZoom={interactive}
                doubleClickZoom={interactive}
                zoomControl={interactive}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    // attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ChangeView lat={lat} lng={lng} />
                <MapEventsHandler />
            </MapContainer>

            <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
                <div className="text-(--primary) text-5xl drop-shadow-xl">
                    <MapPinIcon />
                    {/* 📍 */}
                </div>
            </div>
        </div>
    )
}
