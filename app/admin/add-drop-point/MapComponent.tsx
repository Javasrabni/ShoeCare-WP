"use client"
import "leaflet/dist/leaflet.css"


import {
  MapContainer,
  TileLayer,
  useMapEvents,
  useMap,
} from "react-leaflet"
import { useEffect } from "react"

type Props = {
  lat: number
  lng: number
  onChange?: (coords: [number, number]) => void
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
}: Props) {
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
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom
        zoomControl
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeView lat={lat} lng={lng} />
        <MapEventsHandler />
      </MapContainer>

      <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
        <div className="text-red-600 text-5xl drop-shadow-xl">
          📍
        </div>
      </div>
    </div>
  )
}
