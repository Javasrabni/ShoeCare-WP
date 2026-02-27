// /app/dashboard/kurir/active-order/page.tsx - FIX VIDEO REF ISSUE
"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
    PhoneIcon,
    MapPinIcon,
    NavigationIcon,
    UserIcon,
    BuildingIcon,
    CameraIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    Loader2Icon,
    PackageIcon,
    MessageCircleIcon,
    AlertCircleIcon,
    XIcon,
    RefreshCcwIcon,
    ImageIcon,
    SmartphoneIcon,
    ClockIcon,
    ChevronRightIcon,
    InfoIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const MapWithNoSSR = dynamic(
    () => import("@/components/map/CourierMap"),
    {
        ssr: false,
        loading: () => (
            <div className="h-64 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
                <Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }
)

interface Order {
    _id: string
    orderNumber: string
    customerInfo: {
        name: string
        phone: string
        address: string
        coordinates: { lat: number; lng: number }
        notes?: string
    }
    adminInfo: {
        name: string
        assignedAt: string
        notes?: string
    }
    status: string
    payment: { finalAmount: number }
    items: Array<{ itemType: string; treatmentType: string; quantity: number }>
    courierContacted: boolean
    pickupProof?: {
        image: string
        timestamp: string
    }
}

export default function CourierActiveOrderPage() {
    const router = useRouter()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [showContactModal, setShowContactModal] = useState(false)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [capturedFile, setCapturedFile] = useState<File | null>(null)
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [updating, setUpdating] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [isCameraReady, setIsCameraReady] = useState(false)

    // ⬅️ FIX: State untuk kontrol modal dan mounting
    const [showCamera, setShowCamera] = useState(false)
    const [isCameraMounted, setIsCameraMounted] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const cameraTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const [useFrontCamera, setUseFrontCamera] = useState(false)

    useEffect(() => {
        fetchActiveOrder()
        getCurrentLocation()

        return () => {
            stopCamera()
            if (cameraTimeoutRef.current) {
                clearTimeout(cameraTimeoutRef.current)
            }
        }
    }, [])

    // ⬅️ FIX: Effect untuk setup camera setelah modal mounted
    useEffect(() => {
        if (showCamera && isCameraMounted) {
            console.log("📷 Camera mounted, starting setup...")
            startCameraSetup()
        }
    }, [showCamera, isCameraMounted])

    const stopCamera = useCallback(() => {
        console.log("📷 Stopping camera...")
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setShowCamera(false)
        setIsCameraMounted(false)
        setIsCameraReady(false)
        setCameraError(null)
        if (cameraTimeoutRef.current) {
            clearTimeout(cameraTimeoutRef.current)
        }
    }, [])

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => console.error("Location error:", error),
                { enableHighAccuracy: true }
            )
        }
    }

    const fetchActiveOrder = async () => {
        try {
            const res = await fetch("/api/courier/orders/active")
            const data = await res.json()

            if (data.success && data.data) {
                setOrder(data.data)
                if (!data.data.courierContacted && data.data.status === "pickup_in_progress") {
                    setShowContactModal(true)
                }
            } else {
                router.push("/dashboard/kurir/queue")
            }
        } catch (error) {
            console.error("Fetch error:", error)
        }
        setLoading(false)
    }

    const handleContactCustomer = async () => {
        if (!order) return

        try {
            const res = await fetch(`/api/courier/orders/${order._id}/contact-customer`, {
                method: "POST"
            })
            const data = await res.json()

            if (data.success && data.waUrl) {
                window.open(data.waUrl, '_blank')
                setShowContactModal(false)
                setTimeout(fetchActiveOrder, 1000)
            }
        } catch (error) {
            console.error("Contact error:", error)
        }
    }

    // ⬅️ FIX: Open camera modal dengan mounting state
    const openCamera = () => {
        console.log("📷 Opening camera modal...")
        setCameraError(null)
        setIsCameraReady(false)
        setShowCamera(true)
        // isCameraMounted akan di-set oleh onMount callback di video element
    }

    // ⬅️ FIX: Setup camera setelah element mounted
    const startCameraSetup = async () => {
        console.log("📷 Starting camera setup, video ref:", videoRef.current)

        if (!videoRef.current) {
            console.error("📷 Video ref not available, retrying in 100ms...")
            setTimeout(startCameraSetup, 100)
            return
        }

        // Timeout 10 detik
        cameraTimeoutRef.current = setTimeout(() => {
            if (!isCameraReady) {
                console.log("📷 Camera timeout")
                stopCamera()
                setCameraError("Kamera timeout. Coba lagi atau gunakan upload file.")
                fileInputRef.current?.click()
            }
        }, 10000)

        const tryCamera = async (constraints: MediaStreamConstraints): Promise<MediaStream | null> => {
            try {
                return await navigator.mediaDevices.getUserMedia(constraints)
            } catch (err) {
                return null
            }
        }

        let stream: MediaStream | null = null

        // Attempt 1: Back camera exact
        stream = await tryCamera({
            video: { facingMode: { exact: "environment" } },
            audio: false
        })

        // Attempt 2: Back camera ideal
        if (!stream) {
            stream = await tryCamera({
                video: { facingMode: { ideal: "environment" } },
                audio: false
            })
        }

        // Attempt 3: Front camera
        if (!stream) {
            stream = await tryCamera({
                video: { facingMode: "user" },
                audio: false
            })
        }

        // Attempt 4: Any camera
        if (!stream) {
            stream = await tryCamera({
                video: true,
                audio: false
            })
        }

        if (stream) {
            await setupVideoStream(stream)
        } else {
            if (cameraTimeoutRef.current) clearTimeout(cameraTimeoutRef.current)
            setCameraError("Tidak dapat mengakses kamera. Gunakan upload file.")
            fileInputRef.current?.click()
        }
    }

    const setupVideoStream = async (stream: MediaStream) => {
        console.log("📷 Stream obtained:", stream.getVideoTracks()[0]?.label)
        streamRef.current = stream

        const video = videoRef.current
        if (!video) {
            console.error("📷 Video element not found!")
            return
        }

        const track = stream.getVideoTracks()[0]
        const settings = track.getSettings()

        if (settings.facingMode === 'user') {
            // Front camera - perlu flip untuk preview
            if (videoRef.current) {
                videoRef.current.style.transform = 'scaleX(-1)'
            }
        }

        video.srcObject = stream

        // Tunggu video ready
        video.onloadedmetadata = () => {
            console.log("📷 Video metadata loaded")
            video.play().then(() => {
                console.log("📷 Video playing")
                setIsCameraReady(true)
                if (cameraTimeoutRef.current) {
                    clearTimeout(cameraTimeoutRef.current)
                }
            }).catch(err => {
                console.error("📷 Video play error:", err)
            })
        }

        video.oncanplay = () => {
            console.log("📷 Video can play")
            setIsCameraReady(true)
        }

        // Fallback: cek manual setelah delay
        setTimeout(() => {
            if (video.videoWidth > 0 && !isCameraReady) {
                console.log("📷 Video ready (fallback check)")
                setIsCameraReady(true)
                if (cameraTimeoutRef.current) {
                    clearTimeout(cameraTimeoutRef.current)
                }
            }
        }, 1000)
    }

    const capturePhoto = () => {
        const video = videoRef.current
        const canvas = canvasRef.current

        if (!video || !canvas) {
            console.error("📷 Video or canvas not available")
            alert("Kamera belum siap, tunggu sebentar...")
            return
        }

        if (!video.videoWidth || !video.videoHeight) {
            console.error("📷 Video dimensions not available:", video.videoWidth, video.videoHeight)
            alert("Kamera belum siap, tunggu sebentar...")
            return
        }

        console.log("📷 Capturing photo:", video.videoWidth, "x", video.videoHeight)

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
            if (!blob) {
                console.error("📷 Failed to create blob")
                return
            }

            const file = new File([blob], `pickup_${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
            })

            setCapturedFile(file)
            setCapturedImage(URL.createObjectURL(blob))
            stopCamera()
        }, 'image/jpeg', 0.95)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('File harus berupa gambar')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran file maksimal 5MB')
            return
        }

        setCapturedFile(file)
        setCapturedImage(URL.createObjectURL(file))
    }

    const handleUploadPickup = async () => {
        if (!order || !capturedFile) {
            alert('Foto belum diambil')
            return
        }

        setUpdating(true)

        try {
            const formData = new FormData()
            formData.append('photo', capturedFile, capturedFile.name)

            if (currentLocation) {
                formData.append('lat', currentLocation.lat.toString())
                formData.append('lng', currentLocation.lng.toString())
            }

            const res = await fetch(`/api/courier/orders/${order._id}/pickup`, {
                method: "POST",
                body: formData
            })

            const data = await res.json()

            if (data.success) {
                if (capturedImage) URL.revokeObjectURL(capturedImage)
                setCapturedImage(null)
                setCapturedFile(null)
                fetchActiveOrder()
            } else {
                alert(data.message || 'Gagal upload foto')
            }
        } catch (error) {
            alert('Terjadi kesalahan saat upload')
        } finally {
            setUpdating(false)
        }
    }

    const handleArriveWorkshop = async () => {
        if (!order) return

        setUpdating(true)
        try {
            const res = await fetch(`/api/courier/orders/${order._id}/arrive-workshop`, {
                method: "POST"
            })

            const data = await res.json()
            if (data.success) {
                alert("Sepatu berhasil diantar ke workshop!")
                router.push("/dashboard/kurir")
            } else {
                alert(data.message)
            }
        } catch (error) {
            alert("Gagal update status")
        } finally {
            setUpdating(false)
        }
    }

    const openGoogleMaps = () => {
        if (order?.customerInfo.coordinates) {
            const { lat, lng } = order.customerInfo.coordinates
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2Icon className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!order) return null

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <canvas ref={canvasRef} className="hidden" />

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircleIcon className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Hubungi Customer</h3>
                        <p className="text-slate-600 mb-4">
                            Sebelum melanjutkan, hubungi <strong>{order.customerInfo.name}</strong> terlebih dahulu via WhatsApp
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={handleContactCustomer}
                                className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                            >
                                <MessageCircleIcon size={20} />
                                Hubungi via WhatsApp
                            </button>
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="w-full py-3 text-slate-500 text-sm hover:text-slate-700"
                            >
                                Nanti saja
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
                        <button
                            onClick={stopCamera}
                            className="p-2 text-white rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <XIcon size={24} />
                        </button>
                        <span className="text-white font-medium">Ambil Foto Bukti</span>
                        <div className="w-10" />
                    </div>

                    <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                        {!isCameraReady && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="text-center">
                                    <Loader2Icon className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
                                    <p className="text-white">Memuat kamera...</p>
                                    <p className="text-white/60 text-sm mt-2">Mohon izinkan akses kamera</p>
                                </div>
                            </div>
                        )}

                        {/* ⬅️ FIX: Video element dengan ref callback untuk mounting detection */}
                        <video
                            ref={(el) => {
                                videoRef.current = el
                                if (el && !isCameraMounted) {
                                    console.log("📷 Video element mounted")
                                    setIsCameraMounted(true)
                                }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraReady ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{
                                minHeight: '100%',
                                minWidth: '100%'
                            }}
                        />

                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-80 border-2 border-white/70 rounded-2xl relative">
                                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white/90 text-sm font-medium bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
                                        Posisikan sepatu di tengah
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-black/80 backdrop-blur-sm flex justify-center items-center gap-8 pb-10">
                        <button
                            onClick={capturePhoto}
                            disabled={!isCameraReady}
                            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isCameraReady
                                ? 'border-white bg-white hover:scale-105 active:scale-95 shadow-lg shadow-white/20'
                                : 'border-gray-600 bg-gray-800 cursor-not-allowed'
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-full ${isCameraReady ? 'bg-white' : 'bg-gray-700'}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={() => router.push("/dashboard/kurir")}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeftIcon size={24} className="text-slate-700" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Tugas Aktif</h1>
                        <p className="text-sm text-slate-500 font-mono">{order.orderNumber}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4 max-w-3xl mx-auto">
                {/* Status Card */}
                <div className={`p-4 rounded-2xl border ${order.status === 'pickup_in_progress'
                    ? 'bg-blue-50 border-blue-200'
                    : order.status === 'picked_up'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${order.status === 'pickup_in_progress' ? 'bg-blue-100' : 'bg-amber-100'
                            }`}>
                            {order.status === 'pickup_in_progress' ? (
                                <NavigationIcon size={24} className="text-blue-600" />
                            ) : (
                                <PackageIcon size={24} className="text-amber-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Status Saat Ini</p>
                            <p className={`text-lg font-bold ${order.status === 'pickup_in_progress' ? 'text-blue-900' : 'text-amber-900'
                                }`}>
                                {order.status === 'pickup_in_progress' ? 'Menuju Lokasi Customer' : 'Menuju Workshop'}
                            </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full animate-pulse ${order.status === 'pickup_in_progress' ? 'bg-blue-500' : 'bg-amber-500'
                            }`} />
                    </div>
                </div>

                {/* Admin Info */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <BuildingIcon size={20} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-indigo-600 font-medium">Ditugaskan oleh Admin</p>
                            <p className="font-semibold text-slate-900">{order.adminInfo.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">
                                {new Date(order.adminInfo.assignedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-slate-400">
                                {new Date(order.adminInfo.assignedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                    </div>
                    {order.adminInfo.notes && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-sm text-slate-600 flex items-start gap-2">
                                <InfoIcon size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                {order.adminInfo.notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Map */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                    <div className="h-64 relative">
                        <MapWithNoSSR
                            customerLocation={order.customerInfo.coordinates}
                            courierLocation={currentLocation}
                        />
                    </div>
                    <div className="p-4 border-t border-slate-100">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                                <MapPinIcon size={20} className="text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-900">Lokasi Penjemputan</p>
                                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{order.customerInfo.address}</p>
                            </div>
                        </div>
                        <button
                            onClick={openGoogleMaps}
                            className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <NavigationIcon size={18} />
                            Buka Navigasi
                        </button>
                    </div>
                </div>

                {/* Customer Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Info Customer</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon size={28} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-lg text-slate-900">{order.customerInfo.name}</p>
                            <a href={`tel:${order.customerInfo.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                                <PhoneIcon size={14} />
                                {order.customerInfo.phone}
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                        <a
                            href={`tel:${order.customerInfo.phone}`}
                            className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <PhoneIcon size={18} />
                            Telepon
                        </a>
                        <button
                            onClick={handleContactCustomer}
                            className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-sm"
                        >
                            <MessageCircleIcon size={18} />
                            WhatsApp
                        </button>
                    </div>
                </div>

                {/* Order Details */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Detail Pesanan</h3>
                    <div className="space-y-3">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                <span className="text-slate-700">
                                    {item.quantity}x {item.itemType}
                                </span>
                                <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {item.treatmentType}
                                </span>
                            </div>
                        ))}
                        <div className="pt-3 mt-2 border-t border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Total Bayar</span>
                                <span className="text-xl font-bold text-slate-900">
                                    Rp {order.payment.finalAmount.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pickup Proof Section */}
                {order.status === 'pickup_in_progress' && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <CameraIcon size={18} />
                            Bukti Penjemputan
                        </h3>

                        {cameraError && (
                            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
                                <SmartphoneIcon size={20} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">{cameraError}</p>
                                    <p className="text-xs text-amber-600 mt-1">Silakan gunakan opsi upload file di bawah</p>
                                </div>
                            </div>
                        )}

                        {!capturedImage ? (
                            <div className="space-y-3">
                                <button
                                    onClick={openCamera}
                                    className="w-full py-6 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center gap-2 text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95 bg-blue-50/30"
                                >
                                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                                        <CameraIcon size={28} className="text-blue-600" />
                                    </div>
                                    <span className="font-semibold">Ambil Foto dengan Kamera</span>
                                    <span className="text-xs text-slate-500">Ketuk untuk membuka kamera</span>
                                </button>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-px bg-slate-200" />
                                    <span className="text-xs text-slate-400 font-medium">ATAU</span>
                                    <div className="flex-1 h-px bg-slate-200" />
                                </div>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center gap-2 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-1">
                                        <ImageIcon size={24} className="text-slate-500" />
                                    </div>
                                    <span className="font-medium">Pilih dari Galeri</span>
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative rounded-xl overflow-hidden">
                                    <img
                                        src={capturedImage}
                                        alt="Preview"
                                        className="w-full h-64 object-cover"
                                    />
                                    <button
                                        onClick={() => {
                                            if (capturedImage) URL.revokeObjectURL(capturedImage)
                                            setCapturedImage(null)
                                            setCapturedFile(null)
                                        }}
                                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                        <RefreshCcwIcon size={18} />
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            if (capturedImage) URL.revokeObjectURL(capturedImage)
                                            setCapturedImage(null)
                                            setCapturedFile(null)
                                        }}
                                        className="flex-1 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                                    >
                                        Ulangi
                                    </button>
                                    <button
                                        onClick={handleUploadPickup}
                                        disabled={updating}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        {updating ? (
                                            <>
                                                <Loader2Icon className="w-5 h-5 animate-spin" />
                                                Mengupload...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircleIcon className="w-5 h-5" />
                                                Upload & Lanjutkan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Arrive Workshop Button */}
                {order.status === 'picked_up' && (
                    <button
                        onClick={handleArriveWorkshop}
                        disabled={updating}
                        className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:bg-green-700 transition-colors"
                    >
                        {updating ? (
                            <Loader2Icon className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <CheckCircleIcon className="w-6 h-6" />
                                Sampai di Workshop
                            </>
                        )}
                    </button>
                )}

                {/* Proof Uploaded */}
                {order.pickupProof && (
                    <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
                        <div className="flex items-center gap-2 text-green-800 mb-4">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircleIcon size={18} className="text-green-600" />
                            </div>
                            <div>
                                <p className="font-semibold">Bukti pickup berhasil</p>
                                <p className="text-xs text-green-600">
                                    {new Date(order.pickupProof.timestamp).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                        <a
                            href={order.pickupProof.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative group rounded-xl overflow-hidden"
                        >
                            <img
                                src={order.pickupProof.image}
                                alt="Pickup proof"
                                className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-medium flex items-center gap-2">
                                    <ImageIcon size={18} />
                                    Lihat Full Size
                                </span>
                            </div>
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}