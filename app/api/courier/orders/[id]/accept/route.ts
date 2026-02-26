import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const courierId = user.id;

    await connectDB();

    // Cek apakah kurir sudah punya order aktif yang sedang dikerjakan
    const activeOrder = await Order.findOne({
      "activeCourier.courierId": courierId,
      status: { $in: ["pickup_in_progress", "picked_up", "in_workshop", "processing"] }
    });

    if (activeOrder) {
      return NextResponse.json(
        { success: false, message: "Anda masih memiliki order aktif. Selesaikan terlebih dahulu." },
        { status: 400 }
      );
    }

    // Update order: set activeCourier dan update queue status
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: id,
        "courierQueue.courierId": courierId,
        "courierQueue.status": "pending"
      },
      {
        $set: {
          "courierQueue.$.status": "accepted",
          "courierQueue.$.acceptedAt": new Date(),
          activeCourier: {
            courierId,
            acceptedAt: new Date(),
            startedPickupAt: null,
            currentLocation: null
          },
          status: "pickup_in_progress",
          "tracking.courierId": courierId,
          "tracking.courierName": user.name,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan atau sudah diambil kurir lain" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tugas diterima. Silakan menuju lokasi customer.",
      data: updatedOrder
    });

  } catch (error) {
    console.error("Accept task error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}