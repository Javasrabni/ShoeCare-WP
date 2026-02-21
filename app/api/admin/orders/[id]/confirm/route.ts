// app/api/admin/orders/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
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

    // Update status ke confirmed
    order.status = "confirmed";
    order.payment.status = "paid";
    order.payment.paidAt = new Date();
    order.adminActions.confirmedBy = user._id;
    order.adminActions.confirmedAt = new Date();

    // Add to status history
    order.statusHistory.push({
      status: "confirmed",
      timestamp: new Date(),
      updatedBy: user._id,
      updatedByName: user.name,
      notes: "Pembayaran diverifikasi, order diterima",
      location: null
    });

    order.tracking.currentStage = "confirmed";

    await order.save();

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order confirmed successfully"
    });
  } catch (error) {
    console.error("Confirm Order API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}