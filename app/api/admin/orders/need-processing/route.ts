// app/api/admin/orders/need-processing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    
    // ⬅️ FIX: Cek user.role langsung, bukan user.user.role
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const orders = await Order.find({
      status: { $in: ["confirmed", "courier_assigned"] }
    })
      .sort({ "adminActions.confirmedAt": -1 })
      .select("orderNumber customerInfo serviceType pickupLocation status payment tracking")
      .lean();

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Need Processing API Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}