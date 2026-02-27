// /app/api/courier/stats/route.ts
import { NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user._id?.toString() || user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayPickups, totalPickups, activeOrder, userData] = await Promise.all([
      Order.countDocuments({
        "activeCourier.courierId": userObjectId,
        "tracking.pickupTime": { $gte: today }
      }),
      Order.countDocuments({
        "activeCourier.courierId": userObjectId,
        status: { $in: ["in_workshop", "completed"] }
      }),
      Order.findOne({
        "activeCourier.courierId": userObjectId,
        status: { $in: ["pickup_in_progress", "picked_up"] }
      }).select("orderNumber status"),
      Users.findById(userId).select("courierInfo name").lean()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        todayPickups,
        totalPickups,
        activeOrder: activeOrder ? {
          hasActive: true,
          orderNumber: activeOrder.orderNumber,
          status: activeOrder.status
        } : { hasActive: false },
        vehicleInfo: {
          type: userData?.courierInfo?.vehicleType || "motorcycle",
          number: userData?.courierInfo?.vehicleNumber || "-"
        },
        isAvailable: userData?.courierInfo?.isAvailable ?? true
      }
    });

  } catch (error) {
    console.error("Courier stats error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}