// /app/api/courier/orders/queue/route.ts - FIX QUERY
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
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
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Invalid user session" },
        { status: 401 }
      );
    }

    console.log("📋 Queue API - Courier ID:", userId);

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // ⬅️ CEK: Apakah kurir sudah punya tugas aktif?
    const activeOrder = await Order.findOne({
      "activeCourier.courierId": userObjectId,
      status: { 
        $in: ["pickup_in_progress", "picked_up", "delivery_in_progress"] 
      }
    }).lean();

    console.log("📋 Queue API - Active order:", activeOrder ? "YES" : "NO");

    // ⬅️ FIX: Query yang lebih sederhana tanpa $exists yang bermasalah
    const orders = await Order.find({
      courierQueue: {
        $elemMatch: {
          courierId: userObjectId,
          status: "pending"
        }
      }
    })
    .populate({
      path: "courierQueue.assignedBy",
      select: "name",
      model: "users"
    })
    .select("orderNumber customerInfo pickupLocation status courierQueue payment.finalAmount createdAt activeCourier")
    .sort({ createdAt: -1 })
    .lean();

    console.log("📋 Queue API - Found orders:", orders.length);

    // Filter manual: exclude yang sudah punya activeCourier (sudah di-accept)
    const availableOrders = orders.filter(order => {
      // Cek apakah order ini sudah di-accept oleh kurir ini
      const myQueueEntry = order.courierQueue?.find(
        (q: any) => q.courierId?.toString?.() === userId || q.courierId?.equals?.(userObjectId)
      );
      
      // Jika sudah accepted, jangan tampilkan
      if (myQueueEntry?.status === "accepted") return false;
      
      // Jika ada activeCourier dan bukan saya, jangan tampilkan
      if (order.activeCourier && order.activeCourier.courierId?.toString() !== userId) {
        return false;
      }
      
      return true;
    });

    console.log("📋 Queue API - Available orders:", availableOrders.length);

    // Format response
    const formattedOrders = availableOrders.map(order => {
      const queueEntry = order.courierQueue?.find(
        (q: any) => {
          const qId = q.courierId?.toString?.() || q.courierId;
          return qId === userId && q.status === "pending";
        }
      );
      
      return {
        ...order,
        queueInfo: queueEntry ? {
          assignedAt: queueEntry.assignedAt,
          assignedBy: queueEntry.assignedBy?.name || "Admin",
          notes: queueEntry.notes
        } : null,
        isActive: false // Karena sudah difilter
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedOrders,
      hasActiveTask: !!activeOrder,
      activeOrder: activeOrder ? {
        _id: activeOrder._id,
        orderNumber: activeOrder.orderNumber,
        status: activeOrder.status
      } : null
    });

  } catch (error) {
    console.error("❌ Fetch queue error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}