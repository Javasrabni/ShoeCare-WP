import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const pendingCount = await Order.countDocuments({
      status: { $in: ["pending", "waiting_confirmation"] }
    });

    return NextResponse.json({
      success: true,
      count: pendingCount
    });

  } catch (error) {
    console.error("Pending Count API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}