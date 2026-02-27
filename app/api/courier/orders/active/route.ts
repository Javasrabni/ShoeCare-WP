// /app/api/courier/orders/active/route.ts - FIX PARAMS & QUERY
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user._id?.toString() || user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await connectDB();

    const order = await Order.findOne({
      "activeCourier.courierId": userObjectId,
      status: { 
        $in: ["pickup_in_progress", "picked_up", "delivery_in_progress"] 
      }
    }).lean();

    if (!order) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Tidak ada order aktif"
      });
    }

    // Cari info admin yang assign dari queue
    const queueEntry = order.courierQueue?.find(
      (q: any) => {
        const qId = q.courierId?.toString?.() || q.courierId;
        return qId === userId && q.status === "accepted";
      }
    );

    let adminInfo = { 
      name: "Admin", 
      assignedAt: order.activeCourier?.acceptedAt,
      notes: ""
    };
    
    if (queueEntry?.assignedBy) {
      try {
        const admin = await Users.findById(queueEntry.assignedBy).select("name").lean();
        if (admin) {
          adminInfo = {
            name: admin.name,
            assignedAt: queueEntry.assignedAt || order.activeCourier?.acceptedAt,
            notes: queueEntry.notes || ""
          };
        }
      } catch (e) {
        console.log("Admin not found, using default");
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerInfo: {
          name: order.customerInfo?.name || "",
          phone: order.customerInfo?.phone || "",
          address: order.pickupLocation?.address || "",
          coordinates: order.pickupLocation?.coordinates,
          notes: order.pickupLocation?.notes
        },
        adminInfo,
        payment: order.payment || { finalAmount: 0 },
        items: order.items || [],
        pickupProof: order.pickupProof,
        courierContacted: order.activeCourier?.customerContacted || false,
        estimatedTime: order.estimatedDeliveryTime
      }
    });

  } catch (error) {
    console.error("❌ Fetch active order error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}