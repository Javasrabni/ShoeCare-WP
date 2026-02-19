// app/api/admin/orders/pending/route.ts
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Order } from "@/app/models/orders"

export async function GET() {
  try {
    await connectDB()
    
    const orders = await Order.find({ 
      status: { $in: ["pending", "waiting_confirmation"] } 
    })
    .select("orderNumber customerInfo payment status createdAt") // Pastikan payment termasuk
    .sort({ createdAt: -1 })
    .lean()

    return NextResponse.json({
      success: true,
      data: orders
    })

  } catch (error) {
    console.error("Get pending orders error:", error)
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data pesanan" },
      { status: 500 }
    )
  }
}