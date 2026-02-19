// app/api/admin/orders/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server"
import  connectDB from "@/lib/mongodb"
import { Order } from "@/app/models/orders"
import { getUser } from "@/lib/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // <-- params adalah Promise
) {
  try {
    await connectDB()
    
    // Unwrap params dengan await
    const { id } = await params  // <-- Tambahkan await
    
    const admin = await getUser()

    const order = await Order.findByIdAndUpdate(
      id,  // <-- Gunakan id yang sudah di-unwrap
      {
        status: "confirmed",
        "adminActions.confirmedBy": admin?._id,
        "adminActions.confirmedAt": new Date()
      },
      { 
        new: true,  // <-- Masih bisa dipakai, atau ganti:
        // returnDocument: 'after'  // <-- Alternatif untuk mongoose 8+
      }
    )

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
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