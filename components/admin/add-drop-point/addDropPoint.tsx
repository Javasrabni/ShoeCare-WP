"use client"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
const Map = dynamic(() => import("./MapComponent"), {
    ssr: false,
})
import { useAuth } from "@/app/context/userAuth/getUserAuthData."
import { useToast } from "@/app/context/toast/toastContext";
import { useSpinner } from "@/app/context/spinner/spinnerContext";

interface Props {
    stateShowAddNewDP: (state: boolean) => void;
}

type SearchResult = {
    lat: string
    lon: string
    display_name: string
}
interface AdminType {
    _id: string;
    createdAt: string;
    name: string;
    role: string;
    profilePhoto: string | null
}

// ✅ Helper functions untuk format Rupiah
const formatNumberInput = (value: string): string => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseRupiahToNumber = (value: string): number => {
    return parseInt(value.replace(/\./g, '')) || 0;
};

export default function AddDropPoint({ stateShowAddNewDP }: Props) {
    const { user } = useAuth()
    const { showToast } = useToast();
    const { showSpinner, hideSpinner } = useSpinner();
    const router = useRouter()

    // Default Jakarta
    const [lat, setLat] = useState(-6.1754)
    const [lng, setLng] = useState(106.8272)

    const [address, setAddress] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])

    const [name, setName] = useState("")
    const [capacity, setCapacity] = useState<number | null>(null)
    const [status, setStatus] = useState<"Aktif" | "Tidak aktif">("Aktif")
    const [alamatLengkap, setAlamatLengkap] = useState("")

    const [adminDropPoint, setAdminDropPoint] = useState("")
    const [radiusMaxKM, setRadiusMaxKM] = useState<number | null>(null)

    // ✅ State untuk input Rupiah (string dengan format) dan number (untuk API)
    const [chargeDisplay, setChargeDisplay] = useState<string>("")
    const [chargeOutsideRadius, setChargeOutsideRadius] = useState<number | null>(null)

    const [alamatMap, setAlamatMap] = useState("")

    const handleSearch = async (value: string) => {
        setAlamatMap(value)
        if (value.length < 3) {
            setResults([])
            return
        }
        const res = await fetch(`/api/search-address?q=${value}`)
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

    // ✅ Handler untuk input Rupiah
    const handleChargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.replace(/\./g, '')
        const formatted = formatNumberInput(input)
        const numeric = parseRupiahToNumber(formatted)

        setChargeDisplay(formatted)
        setChargeOutsideRadius(numeric)
    }

    const handleSave = async () => {
        try {
            showSpinner("Sedang memproses...")
            const res = await fetch("/api/admin/drop-points", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    address: alamatLengkap,
                    location: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    capacity,
                    currentLoad: 0,
                    status,
                    adminDropPoint: adminDropPoint,
                    radiusMaxKM,
                    chargeOutsideRadius // ✅ Sudah dalam bentuk number
                }),
            })
            const data = await res.json()

            if (!res.ok) {
                showToast(data.message, 'error')
                return
            } else {
                router.refresh()
                stateShowAddNewDP(false)
            }
        } catch (error) {
            showToast("Terjadi kesalahan server", 'error')
        } finally {
            hideSpinner()
        }
    }

    // GET ADMIN
    const [allAdmin, setAllAdmin] = useState<AdminType[] | null>(null)
    useEffect(() => {
        async function getAdmin() {
            try {
                const res = await fetch("/api/admin/staff-internal", {
                    credentials: "include",
                })
                const data = await res.json()
                if (res.ok) {
                    setAllAdmin(data.data)
                }
            } catch (error) {
                console.error(error)
            }
        }
        getAdmin()
    }, [])

    return (
        <div className="w-full flex flex-col h-full bg-white gap-4 z-28 pb-8">
            <div className="flex flex-row items-center justify-between">
                <h1 className="text-xl font-semibold font-[poppins]">
                    Tambah Drop Point
                </h1>
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full h-full shrink-0">
                {/* SEARCH */}
                <div className="flex flex-col gap-4 w-full h-120 md:h-full relative">
                    <div>
                        <input
                            type="text"
                            placeholder="Cari alamat untuk titik maps"
                            value={alamatMap}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                        />
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


                    <Map
                        lat={lat}
                        lng={lng}
                        radius={radiusMaxKM || undefined}  // Pass radius jika ada
                        onChange={(coords) => {
                            setLat(coords[0])
                            setLng(coords[1])
                        }}
                        fixedPin={false}
                        interactive={true}
                        widthMap="w-full"
                        heightMap="h-full"
                    />

                    <div className="text-xs md:invisible sm:text-sm text-gray-600">
                        Lat: {lat} | Lng: {lng}
                    </div>
                </div>

                {/* FORM */}
                <div className="space-y-5 w-full">
                    <input
                        placeholder="Nama drop point"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                        required
                    />
                    <input
                        placeholder="Alamat lengkap drop point"
                        value={alamatLengkap}
                        onChange={(e) => setAlamatLengkap(e.target.value)}
                        className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                        required
                    />
                    <input
                        placeholder="Maksimal radius antar jemput (Radius KM)"
                        value={radiusMaxKM ?? ""}
                        type="number"
                        inputMode="numeric"
                        onChange={(e) => setRadiusMaxKM(Number(e.target.value))}
                        className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                        required
                    />

                    {/* ✅ INPUT RUPIAH DENGAN FORMAT */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                            Rp
                        </span>
                        <input
                            placeholder="Charge jika di luar radius"
                            value={chargeDisplay}
                            type="text"
                            inputMode="numeric"
                            onChange={handleChargeChange}
                            className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full pl-10 pr-3 py-2.5 shadow-xs placeholder:text-body"
                            required
                        />
                    </div>
                    {/* Preview format lengkap */}
                    {/* {chargeOutsideRadius && chargeOutsideRadius > 0 && (
                        <p className="text-xs text-gray-500 -mt-3">
                            {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                            }).format(chargeOutsideRadius)}
                        </p>
                    )} */}

                    <select
                        value={adminDropPoint}
                        onChange={(e) => setAdminDropPoint(e.target.value)}
                        className="bg-transparent border border-default-medium text-heading text-sm rounded-base block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                    >
                        <option value="" disabled>Admin drop point</option>
                        {allAdmin?.map((adm) => (
                            <option key={adm._id} className="capitalize" value={adm._id}>
                                {adm._id == user?._id ? `${adm.name} (Saya)` : adm.name}
                            </option>
                        ))}
                    </select>

                    <div className="w-full flex flex-row items-center gap-3">
                        <button
                            className="w-full bg-(--muted) text-black hover:bg-neutral-200 py-2.5 px-4 text-xs sm:text-sm cursor-pointer rounded-lg font-semibold"
                            onClick={() => stateShowAddNewDP(false)}
                        >
                            Batal
                        </button>

                        <button
                            onClick={handleSave}
                            className="w-full cursor-pointer bg-(--primary) hover:bg-(--primary-hover) text-white py-2.5 px-4 text-xs sm:text-sm rounded-lg font-semibold"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}