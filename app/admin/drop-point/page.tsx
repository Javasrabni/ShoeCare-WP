"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const MapComponent = dynamic(
    () => import("../../../components/admin/add-drop-point/MapComponent"),
    { ssr: false }
)

// import MapComponent from "../add-drop-point/MapComponent"
import Link from "next/link"
import { PlusIcon, WarehouseIcon } from "lucide-react"
import Table from "@/components/table/table"
import AddDropPoint from "@/components/admin/add-drop-point/addDropPoint"



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
    const [addNewDropPoint, setAddNewDropPoint] = useState<boolean>(false)

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

    const statusStateAddNewDP = (state: boolean) => {
        setAddNewDropPoint(state)
    }

    return (
        <>
            {addNewDropPoint && (
                <div className="relative md:fixed flex items-center justify-center md:top-[50%] md:translate-y-[-50%] md:left-[50%] sm:px-12 md:px-16 md:translate-x-[-50%] w-full h-full">
                    <div className="relative md:ml-70 md:mt-24 w-full h-full md:h-[70%] md:p-8 bg-white rounded-2xl flex items-center justify-center md:z-200 ">
                        <AddDropPoint stateShowAddNewDP={statusStateAddNewDP} />
                    </div>
                    <div className="fixed hidden md:flex top-0 left-0 bg-[#00000070] w-full h-full z-190" onClick={() => setAddNewDropPoint(prev => !prev)} />

                </div>
            )}

            {!addNewDropPoint && (

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
                        <button onClick={() => setAddNewDropPoint(prev => !prev)} className="bg-(--primary) hover:bg-(--primary-hover) px-4 py-2 rounded-full text-white font-[inter] text-xs sm:text-sm">
                            <span className="flex flex-row gap-1 items-center">
                                <PlusIcon size={20} />
                                Drop Point
                            </span>
                        </button>
                    </div>

                    <div className="flex flex-row gap-4 flex-wrap">
                        <Table
                            title={['No', 'Map', "Nama DP", "Alamat", "Kapasitas", "Status", "Navigasi"]}
                            data={data.map((item, index) => [
                                index + 1,
                                <span>

                                    {!addNewDropPoint && (

                                        <MapComponent
                                            lat={item.location.coordinates[1]}
                                            lng={item.location.coordinates[0]}
                                            interactive={false}
                                            widthMap="w-[180px]"
                                            heightMap="h-[120px]"
                                        />
                                    )}
                                </span>

                                ,
                                item.name,
                                item.address,
                                item.capacity,
                                item.status,
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
            )}
        </>
    )
}
