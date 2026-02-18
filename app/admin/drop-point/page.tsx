"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/app/context/userAuth/getUserAuthData."

const MapComponent = dynamic(
    () => import("../../../components/admin/add-drop-point/MapComponent"),
    { ssr: false }
)

import Link from "next/link"
import { PlusIcon, WarehouseIcon, Trash2Icon, XIcon } from "lucide-react" // Tambah XIcon
import Table from "@/components/table/table"
import AddDropPoint from "@/components/admin/add-drop-point/addDropPoint"
import { formatRupiah } from "@/utils/formatRupiah"

type DropPointType = {
    _id: string
    name: string
    address: string
    capacity?: number
    location: {
        type: string
        coordinates: [number, number]
    }
    status?: string
    createdAt?: string
    updatedAt?: string
    radiusMaxKM: string
    chargeOutsideRadius: string
    adminDropPoint: string
}

type AdminType = {
    _id: string
    name: string
}

export default function Page() {
    const [data, setData] = useState<DropPointType[]>([])
    const [addNewDropPoint, setAddNewDropPoint] = useState<boolean>(false)
    const [adminSelected, setAdminSelected] = useState<AdminType[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isSelecting, setIsSelecting] = useState<boolean>(false)

    // State untuk preview map
    const [previewMap, setPreviewMap] = useState<{
        isOpen: boolean;
        lat: number;
        lng: number;
        radius: number;
        name: string;
    } | null>(null)

    const fetchDropPoints = () => {
        fetch("/api/admin/drop-points")
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setData(res.data)
                }
            })
    }

    useEffect(() => {
        fetchDropPoints()
    }, [])

    useEffect(() => {
        fetch("/api/admin/staff-internal")
            .then(res => res.json())
            .then(res => {
                const mapped = res.data.map((i: any) => ({
                    _id: i._id,
                    name: i.name
                }))
                setAdminSelected(mapped)
            })
    }, [])

    // Handler buka preview map
    const handleOpenPreview = (item: DropPointType) => {
        setPreviewMap({
            isOpen: true,
            lat: item.location.coordinates[1],
            lng: item.location.coordinates[0],
            radius: Number(item.radiusMaxKM),
            name: item.name,
        })
    }

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(data.map(item => item._id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id])
        } else {
            setSelectedIds(prev => prev.filter(itemId => itemId !== id))
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return
        if (!confirm(`Hapus ${selectedIds.length} drop point?`)) return

        try {
            const res = await fetch("/api/admin/drop-points", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds }),
            })

            const result = await res.json()

            if (result.success) {
                setSelectedIds([])
                setIsSelecting(false)
                fetchDropPoints()
            } else {
                alert("Gagal menghapus: " + result.message)
            }
        } catch (error) {
            alert("Terjadi kesalahan")
        }
    }

    const subData = [
        { id: 1, label: "Drop point", icon: <WarehouseIcon size={16} />, data: data.length }
    ]

    const statusStateAddNewDP = (state: boolean) => {
        setAddNewDropPoint(state)
        if (!state) fetchDropPoints()
    }

    return (
        <>
            {/* Modal Preview Map */}
            {previewMap?.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setPreviewMap(null)}
                    />
                    <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold font-[poppins]">
                                {previewMap.name}
                            </h3>
                            <button
                                onClick={() => setPreviewMap(null)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>

                        <div className="h-100">
                            <MapComponent
                                lat={previewMap.lat}
                                lng={previewMap.lng}
                                radius={previewMap.radius}
                                interactive={true}  // ✅ Non-interactive saat preview
                                fixedPin={true}
                                // Hapus onChange prop atau set ke undefined
                                widthMap="w-full"
                                heightMap="h-full"
                            />
                        </div>

                        <div className="p-4 bg-gray-50 flex gap-4 text-sm">
                            <span>Lat: {previewMap.lat.toFixed(6)}</span>
                            <span>Lng: {previewMap.lng.toFixed(6)}</span>
                            <span>Radius: {previewMap.radius} KM</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Add Drop Point */}
            {addNewDropPoint && (
                <div className="relative md:fixed flex items-center justify-center md:top-[50%] md:translate-y-[-50%] md:left-[50%] sm:px-12 md:px-16 md:translate-x-[-50%] w-full h-full">
                    <div className="relative md:ml-70 md:mt-24 w-full h-full md:h-[70%] md:p-8 bg-white rounded-2xl flex items-center justify-center md:z-200">
                        <AddDropPoint stateShowAddNewDP={statusStateAddNewDP} />
                    </div>
                    <div className="fixed hidden md:flex top-0 left-0 bg-[#00000070] w-full h-full z-190" onClick={() => setAddNewDropPoint(false)} />
                </div>
            )}

            {!addNewDropPoint && (
                <div className="flex flex-col gap-8 w-full md:w-[calc(100vw-430px)] min-h-0 overflow-x-hidden">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:items-center justify-between">
                        <div>
                            <div className="flex flex-col gap-1 sm:gap-1">
                                <h1 className="text-lg md:text-3xl font-bold text-(--foreground) font-[poppins]">Data Drop Point</h1>
                                <div>
                                    {subData.map((i, idx) =>
                                        <span key={idx} className="flex flex-row gap-1 items-center text-(--secondary) text-sm sm:text-sm">
                                            {i.icon} <span className="font-[inter]">{i.data} {i.label}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row gap-2 mt-1 md:mt-0">
                            {isSelecting && selectedIds.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-white font-[inter] text-xs sm:text-sm flex cursor-pointer items-center gap-2"
                                >
                                    <Trash2Icon size={16} />
                                    Hapus ({selectedIds.length})
                                </button>
                            )}

                            {isSelecting && (
                                <button
                                    onClick={() => {
                                        setIsSelecting(false)
                                        setSelectedIds([])
                                    }}
                                    className="bg-gray-300 shrink-0 hover:bg-gray-400 px-4 py-2 rounded-full text-black font-[inter] cursor-pointer text-xs sm:text-sm"
                                >
                                    Batal
                                </button>
                            )}

                            {!isSelecting && (
                                <button
                                    onClick={() => setIsSelecting(true)}
                                    className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full text-gray-700 font-[inter] cursor-pointer shrink-0 text-xs sm:text-sm"
                                >
                                    Pilih
                                </button>
                            )}

                            <button
                                onClick={() => setAddNewDropPoint(true)}
                                className="bg-(--primary) hover:bg-(--primary-hover) px-4 py-2 rounded-full text-white font-[inter] cursor-pointer shrink-0 text-xs sm:text-sm flex items-center gap-1"
                            >
                                <PlusIcon size={20} />
                                Drop Point
                            </button>
                        </div>
                    </div>

                    <div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        <div className="overflow-x-auto">
                            <Table
                                title={[
                                    isSelecting ? (
                                        <input
                                            key="select-all"
                                            type="checkbox"
                                            checked={selectedIds.length === data.length && data.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4"
                                        />
                                    ) : "No",
                                    'Map',
                                    "Nama DP",
                                    "Alamat",
                                    "Batas radius",
                                    "Charge jika melewati radius",
                                    "Admin DP",
                                    "Navigasi"
                                ]}
                                data={data.map((item, index) => [
                                    isSelecting ? (
                                        <input
                                            key={`checkbox-${item._id}`}
                                            type="checkbox"
                                            checked={selectedIds.includes(item._id)}
                                            onChange={(e) => handleSelectOne(item._id, e.target.checked)}
                                            className="w-4 h-4"
                                        />
                                    ) : (
                                        index + 1
                                    ),
                                    // Map yang bisa diklik untuk preview
                                    <button
                                        key={`map-${index}`}
                                        onClick={() => handleOpenPreview(item)}
                                        className="block hover:opacity-80 transition-opacity cursor-pointer"
                                        title="Klik untuk preview"
                                    >
                                        <MapComponent
                                            lat={item.location.coordinates[1]}
                                            lng={item.location.coordinates[0]}
                                            radius={Number(item.radiusMaxKM) || undefined}
                                            interactive={false}
                                            widthMap="w-[180px]"
                                            heightMap="h-[120px]"
                                        />
                                    </button>,
                                    item.name,
                                    item.address,
                                    item.radiusMaxKM + " KM",
                                    formatRupiah(item.chargeOutsideRadius),
                                    adminSelected.find(admin => admin._id === item.adminDropPoint)?.name || "-",
                                    <Link
                                        key={`link-${index}`}
                                        href={`https://www.google.com/maps?q=${item.location.coordinates[1]},${item.location.coordinates[0]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <p className="font-[inter] font-medium text-center text-(--primary) underline">
                                            Buka Maps
                                        </p>
                                    </Link>
                                ])}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}