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
    const [capacity, setCapacity] = useState<number | null>(null)
    const [status, setStatus] =
        useState<"Aktif" | "Tidak aktif">("Aktif")

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
        <div className="w-full flex flex-col h-full gap-4">

            <div className="flex flex-row items-center justify-between">
                <h1 className="text-xl font-semibold font-[poppins]">
                    Tambah Drop Point
                </h1>

            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full h-full shrink-0">
                {/* SEARCH */}
                <div className="flex flex-col gap-4 w-full h-120 md:h-full relative">
                    <div className="">
                        <input type="text" placeholder="Cari alamat untuk titik maps"
                            value={address}
                            onChange={(e) =>
                                handleSearch(e.target.value)
                            } className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body" required />
                    </div>


                    {results.length > 0 && (
                        <div className="absolute z-9999 top-12 bg-white border border-(--border) rounded-lg max-h-56 overflow-y-auto">
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

                    {/* MAP ALWAYS SHOW */}
                    <Map
                        lat={lat}
                        lng={lng}
                        onChange={(coords) => {
                            setLat(coords[0])
                            setLng(coords[1])
                        }}
                        widthMap="w-full"
                        heightMap="h-full"
                    />

                    {/* INFO */}
                    <div className="text-sm text-gray-600">
                        Lat: {lat} | Lng: {lng}
                    </div>
                </div>

                {/* FORM */}
                <div className="space-y-5 w-full">
                    <input
                        placeholder="Nama drop point"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body" required />
                    <input
                        placeholder="Alamat lengkap drop point"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body" required />

                    {/* <input
                        type="number"
                        placeholder="Kapasitas drop point"
                        value={capacity}
                        onChange={(e) =>
                            setCapacity(Number(e.target.value))
                        }
                        className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body" /> */}

                    {/* <select
                        value={status}
                        onChange={(e) =>
                            setStatus(
                                e.target.value as "Aktif" | "Tidak aktif"
                            )
                        }
                        className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">
                            Inactive
                        </option>
                    </select> */}
                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(
                                e.target.value as "Aktif" | "Tidak aktif"
                            )
                        }
                        className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">
                            Inactive
                        </option>
                    </select>

                    <div className="w-full flex flex-row items-center gap-3">
                        <button className="w-full bg-stone-200 text-black hover:bg-neutral-200 py-2.5 px-4 text-xs sm:text-sm rounded-xl font-semibold">
                            Batal
                        </button>

                        <button
                            disabled={!name || saving}
                            onClick={handleSave}
                            className="w-full bg-(--primary) hover:bg-(--primary-hover) text-white py-2.5 px-4 text-xs sm:text-sm rounded-xl font-semibold"
                        >
                            {saving ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>

                </div>
            </div>

        </div>
    )
}
