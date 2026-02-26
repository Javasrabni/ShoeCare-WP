import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeAssigned = searchParams.get("includeAssigned") === "true";

    await connectDB();

    // ✅ FIX: Tambah "waiting_confirmation" ke query
    // Order perlu diproses jika:
    // 1. Status waiting_confirmation (sudah bayar, belum diassign)
    // 2. Status confirmed (sudah dikonfirmasi admin, belum diassign)  
    // 3. Status courier_assigned (sudah diassign kurir)
    let query: any = {
      $or: [
        { status: "waiting_confirmation" },  // ✅ TAMBAH INI
        { status: "confirmed" },
        { status: "courier_assigned" }
      ]
    };

    // Jika tidak include assigned, filter yang belum ada courierQueue pending/accepted
    if (!includeAssigned) {
      query.$and = [
        {
          $or: [
            { courierQueue: { $exists: false } },
            { courierQueue: { $size: 0 } },
            { "courierQueue.status": { $nin: ["pending", "accepted"] } }
          ]
        }
      ];
    }

    const orders = await Order.find(query)
      .select("orderNumber customerInfo pickupLocation status courierQueue createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error("Fetch need processing error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}