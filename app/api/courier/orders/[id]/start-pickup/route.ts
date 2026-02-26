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
    const { location } = await request.json(); // { lat, lng }

    await connectDB();

    // Update status ke pickup_in_progress dan catat waktu mulai
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: id,
        "activeCourier.courierId": courierId,
        status: "courier_assigned"
      },
      {
        $set: {
          status: "pickup_in_progress",
          "activeCourier.startedPickupAt": new Date(),
          "activeCourier.currentLocation": location ? {
            ...location,
            updatedAt: new Date()
          } : null,
          "tracking.pickupTime": new Date(),
          $push: {
            statusHistory: {
              status: "pickup_in_progress",
              timestamp: new Date(),
              updatedBy: courierId,
              updatedByName: user.name,
              notes: "Kurir mulai menuju lokasi customer",
              location: location || null
            }
          }
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan atau status tidak valid" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status diupdate: Menuju lokasi customer (OTW)",
      data: updatedOrder
    });

  } catch (error) {
    console.error("Start pickup error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}