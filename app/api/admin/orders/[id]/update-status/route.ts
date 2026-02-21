// app/api/admin/orders/[id]/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⬅️ FIX: params adalah Promise
) {
  try {
    // ⬅️ FIX: Unwrap params dengan await
    const { id: orderId } = await params;

    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { status, notes, proofImage, location } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Update status
    order.status = status;

    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: user._id,
      updatedByName: user.name,
      notes: notes || "",
      location: location || null,
    });

    // Add to tracking details if it's a tracking stage
    const trackingStages = [
      "pickup_assigned",
      "pickup_in_progress",
      "picked_up",
      "in_workshop",
      "processing",
      "qc_check",
      "ready_for_delivery",
      "delivery_assigned",
      "delivery_in_progress",
      "delivered",
    ];

    if (trackingStages.includes(status)) {
      order.tracking.trackingDetails.push({
        stage: status,
        timestamp: new Date(),
        proofImage: proofImage || null,
        notes: notes || "",
        updatedBy: user._id,
        updatedByName: user.name,
        location: location || null,
      });
      order.tracking.currentStage = status;
    }

    // Update timestamps based on status
    if (status === "picked_up") {
      order.tracking.pickupTime = new Date();
    } else if (status === "completed") {
      order.tracking.completedTime = new Date();
    }

    await order.save();

    return NextResponse.json({
      success: true,
      data: order,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Update Status API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
