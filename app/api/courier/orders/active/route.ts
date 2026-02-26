import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user || (user.role !== "courier" && user.role !== "kurir")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Cari order yang sedang aktif untuk kurir ini (TANPA populate dulu)
    const activeOrder = await Order.findOne({
      "activeCourier.courierId": user.id,
      status: { 
        $in: [
          "pickup_in_progress", 
          "picked_up", 
          "in_workshop", 
          "processing",
          "qc_check",
          "ready_for_delivery",
          "delivery_in_progress"
        ] 
      }
    }).lean();

    if (!activeOrder) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Tidak ada order aktif"
      });
    }

    // Ambil data kurir secara terpisah
    const courierData = await Users.findById(user.id).select("name phone").lean();

    // Format response
    const formattedOrder = {
      ...activeOrder,
      activeCourier: {
        ...activeOrder.activeCourier,
        courierName: courierData?.name || "Unknown",
        courierPhone: courierData?.phone || ""
      }
    };

    return NextResponse.json({
      success: true,
      data: formattedOrder
    });

  } catch (error) {
    console.error("Fetch active order error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}