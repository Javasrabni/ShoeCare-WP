// app/api/orders/upload-proof/route.ts
import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import connectDB  from "@/lib/mongodb"
import { Order } from "@/app/models/orders"

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const formData = await req.formData()
    const file = formData.get("file") as File
    const orderId = formData.get("orderId") as string

    if (!file || !orderId) {
      return NextResponse.json(
        { success: false, message: "File dan orderId diperlukan" },
        { status: 400 }
      )
    }

    // Validasi file
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Format file harus JPG atau PNG" },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Ukuran file maksimal 5MB" },
        { status: 400 }
      )
    }

    // Convert file ke base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataURI = `data:${file.type};base64,${base64}`

    // Upload ke Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "shoecare/payments",
      public_id: `payment-${orderId}-${Date.now()}`,
      resource_type: "image",
      transformation: [
        { width: 1200, crop: "limit" },
        { quality: "auto:good" },
      ],
    })

    // Update database
    await Order.findByIdAndUpdate(orderId, {
      "payment.proofImage": uploadResult.secure_url,
      "payment.status": "waiting_confirmation",
      "payment.publicId": uploadResult.public_id, // Simpan untuk hapus nanti jika perlu
    })

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil diupload",
      data: { 
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id
      }
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: false, message: "Gagal upload bukti pembayaran" },
      { status: 500 }
    )
  }
}