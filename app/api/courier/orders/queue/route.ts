import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    // ✅ DEBUG: Lihat semua field yang tersedia
    console.log("🔍 Queue API - Full user object:", user);
    console.log("🔍 Available fields:", Object.keys(user || {}));

    if (!user || user.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ FIX: Coba beberapa kemungkinan field ID
    const userId = user.id || user._id || user.userId;
    
    if (!userId) {
      console.error("❌ No user ID found in token");
      return NextResponse.json(
        { success: false, message: "Invalid user session" },
        { status: 401 }
      );
    }

    console.log("✅ Using userId:", userId);

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Query dengan $elemMatch
    const orders = await Order.find({
      courierQueue: {
        $elemMatch: {
          courierId: userObjectId,
          status: "pending"
        }
      }
    })
    .select("orderNumber customerInfo pickupLocation status courierQueue payment.finalAmount createdAt activeCourier")
    .sort({ createdAt: -1 })
    .lean();

    console.log("✅ Orders found:", orders.length);

    // Format response
    const formattedOrders = orders.map(order => {
      const queueEntry = order.courierQueue.find(
        (q: any) => q.courierId.toString() === userId && q.status === "pending"
      );
      
      return {
        ...order,
        queueInfo: queueEntry,
        isActive: order.activeCourier?.courierId?.toString() === userId
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedOrders
    });

  } catch (error) {
    console.error("Fetch queue error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}