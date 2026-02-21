// app/api/admin/orders/[id]/assign-courier/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import connectDB  from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ⬅️ FIX: params adalah Promise
) {
  try {
    // ⬅️ FIX: Unwrap params
    const { id: orderId } = await params;
    
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { courierId } = await req.json();

    if (!orderId || !courierId) {
      return NextResponse.json(
        { success: false, message: "Order ID and Courier ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get courier details
    const courier = await Users.findById(courierId);
    if (!courier || courier.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Courier not found" },
        { status: 404 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Update order dengan kurir
    order.status = "courier_assigned";
    order.tracking.courierId = courierId;
    order.tracking.courierName = courier.name;
    
    // Add to status history
    order.statusHistory.push({
      status: "courier_assigned",
      timestamp: new Date(),
      updatedBy: user._id,
      updatedByName: user.name,
      notes: `Kurir ${courier.name} ditugaskan`,
      location: null
    });

    // Update tracking
    order.tracking.currentStage = "courier_assigned";

    // Update courier status
    courier.courierInfo.isAvailable = false;
    courier.courierInfo.currentDeliveryId = orderId;
    await courier.save();
    await order.save();

    return NextResponse.json({
      success: true,
      data: order,
      message: "Courier assigned successfully"
    });
  } catch (error) {
    console.error("Assign Courier API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}