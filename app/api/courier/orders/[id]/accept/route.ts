// /app/api/courier/orders/[id]/accept/route.ts - FIX PARAMS
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ⬅️ Promise
) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ⬅️ AWAIT PARAMS
    const { id } = await params;
    const courierId = user._id?.toString() || user.id;
    const courierObjectId = new mongoose.Types.ObjectId(courierId);

    console.log("✅ Accept API - Order ID:", id);
    console.log("✅ Accept API - Courier ID:", courierId);

    await connectDB();

    // Cek apakah kurir sudah punya tugas aktif
    const existingActive = await Order.findOne({
      "activeCourier.courierId": courierObjectId,
      status: { 
        $in: ["pickup_in_progress", "picked_up", "delivery_in_progress"] 
      }
    });

    if (existingActive) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Anda masih memiliki tugas aktif. Selesaikan tugas sebelumnya terlebih dahulu.",
          activeOrder: {
            orderNumber: existingActive.orderNumber,
            status: existingActive.status
          }
        },
        { status: 400 }
      );
    }

    // Cek order ada di queue dan status pending
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(id),
      "courierQueue.courierId": courierObjectId,
      "courierQueue.status": "pending"
    });

    console.log("✅ Accept API - Order found:", order ? "YES" : "NO");

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan di antrian Anda" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          activeCourier: {
            courierId: courierObjectId,
            acceptedAt: now,
            startedPickupAt: null
          },
          status: "pickup_in_progress",
          updatedAt: now
        },
        $push: {
          statusHistory: {
            status: "pickup_in_progress",
            timestamp: now,
            updatedBy: courierObjectId,
            updatedByName: user.name,
            notes: "Kurir menerima tugas dan akan menuju lokasi customer"
          }
        }
      },
      { new: true }
    );

    // Update queue entry jadi accepted
    await Order.updateOne(
      { 
        _id: new mongoose.Types.ObjectId(id), 
        "courierQueue.courierId": courierObjectId 
      },
      {
        $set: {
          "courierQueue.$.status": "accepted",
          "courierQueue.$.acceptedAt": now
        }
      }
    );

    // Update user status
    await Users.findByIdAndUpdate(courierId, {
      "courierInfo.currentDeliveryId": new mongoose.Types.ObjectId(id),
      "courierInfo.isAvailable": false
    });

    return NextResponse.json({
      success: true,
      message: "Order berhasil diterima",
      data: {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status
      }
    });

  } catch (error) {
    console.error("❌ Accept order error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}