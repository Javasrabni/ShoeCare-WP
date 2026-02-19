// app/api/admin/orders/pending/count/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";

export async function GET() {
  try {
    await connectDB();

    const count = await Order.countDocuments({
      status: { $in: ["pending", "waiting_confirmation"] },
    });

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get pending count error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil jumlah pesanan" },
      { status: 500 }
    );
  }
}
