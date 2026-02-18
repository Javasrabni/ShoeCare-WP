"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/app/context/userAuth/getUserAuthData."

const MapComponent = dynamic(
    () => import("../../../components/admin/add-drop-point/MapComponent"),
    { ssr: false }
)

import Link from "next/link"
import { PlusIcon, WarehouseIcon } from "lucide-react"
import Table from "@/components/table/table"
import AddDropPoint from "@/components/admin/add-drop-point/addDropPoint"

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

    useEffect(() => {
        fetch("/api/admin/drop-points")
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setData(res.data)
                }
            })
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

    const subData = [
        { id: 1, label: "Drop point", icon: <WarehouseIcon size={16} />, data: data.length }
    ]

    const statusStateAddNewDP = (state: boolean) => {
        setAddNewDropPoint(state)
    }

    // ✅ Helper function untuk cari nama admin
    const getAdminName = (adminId: string) => {
        const admin = adminSelected.find(a => a._id === adminId)
        return admin?.name || "-"
    }

    return (
        <>
            {addNewDropPoint && (
                <div className="relative md:fixed flex items-center justify-center md:top-[50%] md:translate-y-[-50%] md:left-[50%] sm:px-12 md:px-16 md:translate-x-[-50%] w-full h-full">
                    <div className="relative md:ml-70 md:mt-24 w-full h-full md:h-[70%] md:p-8 bg-white rounded-2xl flex items-center justify-center md:z-200">
                        <AddDropPoint stateShowAddNewDP={statusStateAddNewDP} />
                    </div>
                    <div className="fixed hidden md:flex top-0 left-0 bg-[#00000070] w-full h-full z-190" onClick={() => setAddNewDropPoint(prev => !prev)} />
                </div>
            )}

            {!addNewDropPoint && (
                <div className="flex flex-col gap-8 w-full md:w-[calc(100vw-430px)] min-h-0 overflow-x-hidden">
                    <div className="flex flex-row gap-3 w-full items-center justify-between">
                        <div>
                            <div className="flex flex-col gap-1 sm:gap-3">
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
                        <button onClick={() => setAddNewDropPoint(prev => !prev)} className="bg-(--primary) hover:bg-(--primary-hover) px-4 py-2 rounded-full text-white font-[inter] text-xs sm:text-sm shrink-0">
                            <span className="flex flex-row gap-1 items-center">
                                <PlusIcon size={20} />
                                Drop Point
                            </span>
                        </button>
                    </div>

                    <div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        <div className="overflow-x-auto">
                            <Table
                                title={['No', 'Map', "Nama DP", "Alamat", "Batas radius antar jemput (KM)", "Biaya tambahan (jika di luar radius)", "Admin DP", "Navigasi"]}
                                data={data.map((item, index) => [
                                    index + 1,
                                    <span key={`map-${index}`}>
                                        <MapComponent
                                            lat={item.location.coordinates[1]}
                                            lng={item.location.coordinates[0]}
                                            interactive={false}
                                            widthMap="w-[180px]"
                                            heightMap="h-[120px]"
                                        />
                                    </span>,
                                    item.name,
                                    item.address,
                                    item.radiusMaxKM + " KM",
                                    "Rp." + item.chargeOutsideRadius,
                                    // ✅ CARA 1: Langsung dengan find
                                    adminSelected.find(admin => admin._id === item.adminDropPoint)?.name || "-",
                                    
                                    // ✅ CARA 2: Pakai helper function (lebih clean)
                                    // getAdminName(item.adminDropPoint),
                                    
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