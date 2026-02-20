// app/layanan/steps/1-pilih-layanan/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TruckIcon, StoreIcon, GiftIcon } from "lucide-react"
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold font-[poppins] mb-2">Pilih Layanan</h1>
        <p className="text-gray-500">Pilih cara terbaik untuk mengirim sepatu Anda</p>
      </div>

      {/* Options */}
      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => handleSelect("antar-jemput")}
          className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
            <TruckIcon className="w-8 h-8 text-blue-600 group-hover:text-white" />
          </div>
          <h3 className="text-xl font-bold mb-3">Antar Jemput</h3>
          <p className="text-gray-600 mb-4">
            Kurir akan menjemput sepatu di lokasi Anda. Gratis dalam radius drop point!
          </p>
          <ul className="space-y-2 text-sm text-gray-500">
            <li className="flex items-center gap-2">✓ Gratis ongkir (radius tertentu)</li>
            <li className="flex items-center gap-2">✓ Tracking realtime</li>
            <li className="flex items-center gap-2">✓ Jadwal fleksibel</li>
          </ul>
        </button>

        <button
          onClick={() => handleSelect("drop-point")}
          className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
        >
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
            <StoreIcon className="w-8 h-8 text-green-600 group-hover:text-white" />
          </div>
          <h3 className="text-xl font-bold mb-3">Antar ke Drop Point</h3>
          <p className="text-gray-600 mb-4">
            Anda mengantar sepatu langsung ke drop point terdekat.
          </p>
          <ul className="space-y-2 text-sm text-gray-500">
            <li className="flex items-center gap-2">✓ Proses lebih cepat</li>
            <li className="flex items-center gap-2">✓ Diskon khusus</li>
            <li className="flex items-center gap-2">✓ Banyak lokasi tersedia</li>
          </ul>
        </button>
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