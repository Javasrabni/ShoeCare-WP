"use client"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet"
import { useEffect } from "react"
import L from "leaflet"

// Custom icons
const customerIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

const selectedDropPointIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [30, 46],
    iconAnchor: [15, 46],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

const otherDropPointIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [20, 33],
    iconAnchor: [10, 33],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

function FitBounds({ 
    customerLat, 
    customerLng, 
    allDropPoints 
}: { 
    customerLat: number
    customerLng: number
    allDropPoints: Array<{
        location: { coordinates: [number, number] }
    }>
}) {
    const map = useMap()
    
    useEffect(() => {
        const bounds = L.latLngBounds([[customerLat, customerLng]])
        
        allDropPoints.forEach(dp => {
            bounds.extend([
                dp.location.coordinates[1],
                dp.location.coordinates[0]
            ])
        })
        
        map.fitBounds(bounds, { padding: [80, 80] })
    }, [customerLat, customerLng, allDropPoints, map])
    
    return null
}

interface Props {
    customerLat: number
    customerLng: number
    allDropPoints: Array<{
        _id: string
        name: string
        address: string
        location: { coordinates: [number, number] }
        radiusMaxKM: number
        distanceKM: number
        isInsideRadius: boolean
        isNearest: boolean
    }>
    selectedDropPointId: string
    onSelectDropPoint: (dp: any) => void
}

export default function CustomerMapComponent({
    customerLat,
    customerLng,
    allDropPoints,
    selectedDropPointId,
    onSelectDropPoint
}: Props) {
    return (
        <MapContainer
            center={[customerLat, customerLng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* Customer Marker */}
            <Marker position={[customerLat, customerLng]} icon={customerIcon}>
                <Popup>
                    <div className="text-sm">
                        <p className="font-semibold">Lokasi Anda</p>
                    </div>
                </Popup>
            </Marker>
            
            {/* Semua Drop Point */}
            {allDropPoints.map((dp) => {
                const lat = dp.location.coordinates[1]
                const lng = dp.location.coordinates[0]
                const isSelected = dp._id === selectedDropPointId
                
                return (
                    <div key={dp._id}>
                        <Marker 
                            position={[lat, lng]} 
                            icon={isSelected ? selectedDropPointIcon : otherDropPointIcon}
                            eventHandlers={{
                                click: () => onSelectDropPoint(dp),
                            }}
                        >
                            <Popup>
                                <div className="text-sm max-w-xs">
                                    <p className={`font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                                        {dp.name} {isSelected && '(Terpilih)'}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1">{dp.address}</p>
                                    <p className="mt-1">
                                        Jarak: <span className="font-medium">{dp.distanceKM} km</span>
                                    </p>
                                    <p className="text-xs mt-1">
                                        {dp.isInsideRadius ? (
                                            <span className="text-green-600">✓ Dalam radius gratis</span>
                                        ) : (
                                            <span className="text-orange-600">⚠ Di luar radius</span>
                                        )}
                                    </p>
                                    {!isSelected && (
                                        <button 
                                            onClick={() => onSelectDropPoint(dp)}
                                            className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                        >
                                            Pilih Drop Point Ini
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                        
                        {/* Radius circle hanya untuk yang terpilih agar tidak terlalu ramai */}
                        {isSelected && (
                            <Circle
                                center={[lat, lng]}
                                radius={dp.radiusMaxKM * 1000}
                                pathOptions={{
                                    color: '#3b82f6',
                                    fillColor: '#3b82f6',
                                    fillOpacity: 0.15,
                                    weight: 2,
                                }}
                            />
                        )}
                    </div>
                )
            })}
            
            <FitBounds 
                customerLat={customerLat}
                customerLng={customerLng}
                allDropPoints={allDropPoints}
            />
        </MapContainer>
    )
}