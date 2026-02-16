"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

const Map = dynamic(() => import("./MapComponent"), {
  ssr: false,
})

type SearchResult = {
  lat: string
  lon: string
  display_name: string
}

export default function AddDropPoint() {
  // Default Jakarta
  const [lat, setLat] = useState(-6.1754)
  const [lng, setLng] = useState(106.8272)

  const [address, setAddress] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState(50)
  const [status, setStatus] =
    useState<"active" | "inactive">("active")

  const [saving, setSaving] = useState(false)

  const handleSearch = async (value: string) => {
    setAddress(value)

    if (value.length < 3) {
      setResults([])
      return
    }

    const res = await fetch(
      `/api/search-address?q=${value}`
    )
    const data = await res.json()
    setResults(data)
  }

  const handleSelect = (item: SearchResult) => {
    const newLat = parseFloat(item.lat)
    const newLng = parseFloat(item.lon)

    setLat(newLat)
    setLng(newLng)
    setAddress(item.display_name)
    setResults([])
  }

  const handleSave = async () => {
    setSaving(true)

    await fetch("/api/admin/drop-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        location: {
          type: "Point",
          coordinates: [lng, lat], // lng dulu!
        },
        capacity,
        currentLoad: 0,
        status,
      }),
    })

    setSaving(false)
    alert("Berhasil disimpan")
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      <h2 className="text-2xl font-bold">
        Tambah Drop Point
      </h2>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow border space-y-3">
        <input
          placeholder="Cari alamat..."
          value={address}
          onChange={(e) =>
            handleSearch(e.target.value)
          }
          className="w-full border rounded-lg p-3"
        />

        {results.length > 0 && (
          <div className="border rounded-lg max-h-56 overflow-y-auto">
            {results.map((item, i) => (
              <div
                key={i}
                onClick={() => handleSelect(item)}
                className="p-3 hover:bg-blue-50 cursor-pointer text-sm"
              >
                {item.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAP ALWAYS SHOW */}
      <Map
        lat={lat}
        lng={lng}
        onChange={(coords) => {
          setLat(coords[0])
          setLng(coords[1])
        }}
      />

      {/* INFO */}
      <div className="text-sm text-gray-600">
        Lat: {lat} | Lng: {lng}
      </div>

      {/* FORM */}
      <div className="bg-white p-6 rounded-xl shadow border space-y-4">
        <input
          placeholder="Nama Drop Point"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg p-3"
        />

        <input
          type="number"
          placeholder="Capacity"
          value={capacity}
          onChange={(e) =>
            setCapacity(Number(e.target.value))
          }
          className="w-full border rounded-lg p-3"
        />

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value as "active" | "inactive"
            )
          }
          className="w-full border rounded-lg p-3"
        >
          <option value="active">Active</option>
          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>

      <button
        disabled={!name || saving}
        onClick={handleSave}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
      >
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  )
}
