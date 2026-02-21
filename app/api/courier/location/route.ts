// app/api/courier/location/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Users } from "@/app/models/users";
import { Order } from "@/app/models/orders";
import  connectDB  from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getUser();
    if (!session || session.user.role !== "courier") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { lat, lng, orderId } = await req.json();

    await connectDB();

    // Update courier location
    await Users.findByIdAndUpdate(session.user.id, {
      "courierInfo.currentLocation": { lat, lng },
      "courierInfo.lastLocationUpdate": new Date()
    });

    // If delivering order, add location to order tracking
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        $push: {
          "tracking.trackingDetails": {
            stage: "location_update",
            timestamp: new Date(),
            location: { lat, lng },
            updatedBy: session.user.id,
            updatedByName: session.user.name
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}