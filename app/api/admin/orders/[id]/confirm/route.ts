// app/api/admin/orders/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Order } from "@/app/models/orders"
import { getUser } from "@/lib/auth" // ← Menggunakan auth Anda

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    // Cek autentikasi admin
    const admin = await getUser()
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Cek order exists
    const existingOrder = await Order.findById(id)
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      )
    }

    // Validasi: hanya bisa confirm order dengan status pending/waiting_confirmation
    if (!["pending", "waiting_confirmation"].includes(existingOrder.status)) {
      return NextResponse.json(
        { success: false, message: "Order tidak dapat dikonfirmasi" },
        { status: 400 }
      )
    }

    // Update order
    const order = await Order.findByIdAndUpdate(
      id,
      {
        status: "confirmed",
        "adminActions.confirmedBy": admin._id,
        "adminActions.confirmedAt": new Date(),
        "payment.status": "paid"
      },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      message: "Order berhasil dikonfirmasi",
      data: order
    })

  } catch (error) {
    console.error("Confirm error:", error)
    return NextResponse.json(
      { success: false, message: "Gagal konfirmasi order" },
      { status: 500 }
    )
  }
}