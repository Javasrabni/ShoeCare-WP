// app/api/admin/couriers/available/route.ts
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Users } from "@/app/models/users"

export async function GET() {
  try {
    await connectDB()
    
    const couriers = await Users.find({
      role: "courier",
      "courierInfo.isAvailable": true,
      isActive: true
    })
    .select("_id name phone courierInfo")
    .lean()

    return NextResponse.json({
      success: true,
      data: couriers
    })

  } catch (error) {
    console.error("Get couriers error:", error)
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data kurir" },
      { status: 500 }
    )
  }
}