"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const MapComponent = dynamic(
  () => import("../add-drop-point/MapComponent"),
  { ssr: false }
)

// import MapComponent from "../add-drop-point/MapComponent"
import Link from "next/link"

type DropPointType = {
  _id: string
  name: string
  address: string
  capacity: number
  location: {
    type: string
    coordinates: [number, number]
  }
}

export default function Page() {
  const [data, setData] = useState<DropPointType[]>([])

  useEffect(() => {
    fetch("/api/admin/drop-points")
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data)
        }
      })
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/add-drop-point">Tambah drop point</Link>

      <div className="flex flex-row gap-4 flex-wrap">

        {data.map((item) => (
          <div
            key={item._id}
            className="bg-white p-4 rounded-xl w-120 h-fit shadow space-y-3"
          >
            <h3 className="font-semibold text-lg">
              {item.name}
            </h3>

            <MapComponent
              lat={item.location.coordinates[1]}
              lng={item.location.coordinates[0]}
            />

            <div className="text-sm text-gray-600">
              Lat: {item.location.coordinates[1]}
              <br />
              Lng: {item.location.coordinates[0]}
              <br />
              <br />
              Kapasitas: {item.capacity}
            </div>

            <a
              href={`https://www.google.com/maps?q=${item.location.coordinates[1]},${item.location.coordinates[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-(--primary) hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Buka di Google Maps
            </a>
          </div>
        ))}
      </div>
    </div>

  )
}
