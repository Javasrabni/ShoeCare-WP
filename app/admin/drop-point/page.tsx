"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const MapComponent = dynamic(
    () => import("../add-drop-point/MapComponent"),
    { ssr: false }
)

// import MapComponent from "../add-drop-point/MapComponent"
import Link from "next/link"
import { PlusIcon, WarehouseIcon } from "lucide-react"
import Table from "@/components/table/table"

type DropPointType = {
    _id: string
    name: string
    address: string
    capacity: number
    location: {
        type: string
        coordinates: [number, number]
    }
    status: string
    createdAt: string
    updatedAt: string
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

    const subData = [
        { id: 1, label: "Drop point", icon: <WarehouseIcon size={16} />, data: data.length }
    ]

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-row gap-3 items-center justify-between">
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
                <Link href="/admin/add-drop-point" className="bg-(--primary) hover:bg-(--primary-hover) px-4 py-2 rounded-full text-white font-[inter] text-xs sm:text-sm">
                    <span className="flex flex-row gap-1 items-center">
                        <PlusIcon size={20} />
                        Drop Point 
                    </span>
                </Link>
            </div>

            <div className="flex flex-row gap-4 flex-wrap">
                <Table
                    title={['No', 'Map', "Nama DP", "Alamat", "Kapasitas", "Status", "Navigasi"]}
                    data={data.map((item, index) => [
                        index + 1,
                        <MapComponent
                            lat={item.location.coordinates[1]}
                            lng={item.location.coordinates[0]}
                            interactive={false}
                            widthMap="w-[180px]"
                            heightMap="h-[120px]"
                        />,
                        item.name,
                        item.address,
                        item.capacity,
                        [<div>{item.status},
                            <br />
                            Sejak {new Date(item.updatedAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        </div>],
                        <Link
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

    )
}
