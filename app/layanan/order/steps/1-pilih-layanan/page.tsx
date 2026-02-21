// app/layanan/steps/1-pilih-layanan/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TruckIcon, StoreIcon, GiftIcon, CheckIcon } from "lucide-react";
import { getOrderDraft, saveOrderDraft, clearOrderDraft } from "@/lib/order-storage"
import { useAuth } from "@/app/context/userAuth/getUserAuthData."

export default function Step1PilihLayanan() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Cek draft lama
    const draft = getOrderDraft()
    if (draft?.step && draft.step > 1) {
      // Sudah ada progress, tapi tetap di step 1 karena user bisa ganti layanan
      // Tidak auto-redirect agar user bisa mulai baru
    }
  }, [])

  const handleSelect = (type: "antar-jemput" | "drop-point") => {
    // Clear draft lama jika ada, mulai fresh
    clearOrderDraft()
    
    saveOrderDraft({
      step: 1,
      serviceType: type,
    })

    if (type === "drop-point") {
      router.push("/layanan/order/drop-point-list")
    } else {
      router.push("/layanan/order/steps/2-lokasi")
    }
  }

  return (
   <div className="space-y-6">
  {/* Header */}
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Pilih Layanan</h1>
    <p className="text-gray-500">Pilih metode pengiriman yang paling nyaman untuk Anda.</p>
  </div>

  {/* Options */}
  <div className="space-y-4">
    {/* Antar Jemput */}
    <button
      onClick={() => handleSelect("antar-jemput")}
      className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left relative"
    >
      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <TruckIcon className="w-7 h-7 text-blue-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Antar Jemput</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Kurir akan menjemput sepatu di lokasi Anda. Gratis dalam radius drop point!
        </p>
      </div>
      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
        <CheckIcon className="w-4 h-4 text-white" />
      </div>
    </button>

    {/* Antar ke Drop Point */}
    <button
      onClick={() => handleSelect("drop-point")}
      className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left relative"
    >
      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <StoreIcon className="w-7 h-7 text-blue-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Antar ke Drop Point</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Anda mengantar sepatu langsung ke drop point terdekat.
        </p>
      </div>
      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
        <CheckIcon className="w-4 h-4 text-white" />
      </div>
    </button>
  </div>

  {/* Promo Banner */}
  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-400 to-gray-600">
    <img 
      src="/images/shoe-clean.jpg" 
      alt="Shoe cleaning"
      className="w-full h-48 object-cover opacity-80"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    <div className="absolute bottom-4 left-4 text-white">
      <p className="text-sm font-medium mb-1">Kualitas Terjamin</p>
      <h3 className="text-xl font-bold">Hasil Cuci Seperti Baru</h3>
    </div>
  </div>

  {/* Member Benefits */}
  {!user && (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <GiftIcon className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h4 className="font-bold text-purple-900">Jadilah Member</h4>
          <p className="text-sm text-purple-700">Dapatkan poin loyalitas & tracking mudah</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={() => router.push("/auth?tab=login")}
          className="flex-1 py-3 bg-white text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-50 font-medium"
        >
          Login
        </button>
        <button 
          onClick={() => router.push("/auth?tab=register")}
          className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium"
        >
          Daftar Gratis
        </button>
      </div>
    </div>
  )}
</div>
  )
}


// components/customer/pilih-layanan/pilihLayanan.tsx (Opsional - untuk quick access)
// "use client"

// import { useRouter } from "next/navigation"
// import { TruckIcon, StoreIcon } from "lucide-react"

// export default function PilihLayananQuick() {
//   const router = useRouter()

//   const handleSelect = (type: "antar-jemput" | "drop-point") => {
//     localStorage.removeItem("shoecare_order_draft")
//     localStorage.setItem("shoecare_order_draft", JSON.stringify({
//       step: 1,
//       serviceType: type,
//       timestamp: new Date().toISOString()
//     }))
    
//     if (type === "drop-point") {
//       router.push("/layanan/drop-point-list")
//     } else {
//       router.push("/layanan/order/steps/2-lokasi")
//     }
//   }

//   return (
//     <div className="grid md:grid-cols-2 gap-4">
//       <button
//         onClick={() => handleSelect("antar-jemput")}
//         className="p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition text-left"
//       >
//         <TruckIcon className="w-8 h-8 text-blue-600 mb-3" />
//         <h3 className="font-bold text-lg">Antar Jemput</h3>
//         <p className="text-sm text-gray-500">Kurir jemput ke lokasi Anda</p>
//       </button>

//       <button
//         onClick={() => handleSelect("drop-point")}
//         className="p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-lg transition text-left"
//       >
//         <StoreIcon className="w-8 h-8 text-green-600 mb-3" />
//         <h3 className="font-bold text-lg">Drop Point</h3>
//         <p className="text-sm text-gray-500">Antar ke lokasi kami</p>
//       </button>
//     </div>
//   )
// }