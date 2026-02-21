// app/api/admin/orders/[id]/edit/route.ts
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

    const { items, reason } = await req.json();

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

    // Simpan data lama untuk history
    const oldItems = [...order.items];

    // Hitung ulang harga
    const newSubtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    const newFinalAmount = newSubtotal + order.pickupLocation.deliveryFee - order.payment.discountPoints;

    // Update order
    order.items = items;
    order.payment.subtotal = newSubtotal;
    order.payment.finalAmount = newFinalAmount;
    order.payment.amount = newFinalAmount + order.payment.discountPoints;

    // Add edit history
    order.editHistory.push({
      editedBy: user._id,
      editedAt: new Date(),
      changes: {
        items: oldItems,
        priceChanges: items,
        reason: reason
      }
    });

    // Add status history
    order.statusHistory.push({
      status: order.status, // Status tetap, tapi ada perubahan
      timestamp: new Date(),
      updatedBy: user._id,
      updatedByName: user.name,
      notes: `Order diedit: ${reason}`,
      location: null
    });

    await order.save();

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order edited successfully"
    });
  } catch (error) {
    console.error("Edit Order API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}