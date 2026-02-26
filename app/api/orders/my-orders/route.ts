import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    let query: any = {};

    // Jika customer, cari berdasarkan phone atau userId
    if (user.role === "customer") {
      query = {
        $or: [
          { "customerInfo.userId": user.id },
          { "customerInfo.phone": user.phone }
        ]
      };
    } else if (user.role === "kurir" || user.role === "courier") {
      // Untuk kurir, return order di queue mereka
      query = {
        "courierQueue.courierId": user.id
      };
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid role" },
        { status: 403 }
      );
    }

    const orders = await Order.find(query)
      .select("orderNumber customerInfo pickupLocation status payment items createdAt courierQueue activeCourier pickupProof tracking")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error("My orders error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}