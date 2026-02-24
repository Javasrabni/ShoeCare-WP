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

    const processingCount = await Order.countDocuments({
      status: { $in: ["confirmed", "courier_assigned"] }
    });

    return NextResponse.json({
      success: true,
      count: processingCount
    });

  } catch (error) {
    console.error("Processing Count API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}