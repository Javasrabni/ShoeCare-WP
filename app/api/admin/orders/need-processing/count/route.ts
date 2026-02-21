// app/api/admin/orders/need-processing/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();

    // ⬅️ FIX: Cek user.role langsung
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const count = await Order.countDocuments({
      status: { $in: ["confirmed", "courier_assigned"] },
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Need Processing Count API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
