// /app/api/courier/orders/[id]/arrive-workshop/route.ts - FIX PARAMS
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

    await connectDB();

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(id),
      "activeCourier.courierId": courierObjectId,
      status: "picked_up"
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan atau status tidak valid" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Update order
    await Order.findByIdAndUpdate(id, {
      $set: {
        status: "in_workshop",
        "activeCourier.completedAt": now
      },
      $push: {
        statusHistory: {
          status: "in_workshop",
          timestamp: now,
          updatedBy: courierObjectId,
          updatedByName: user.name,
          notes: "Sepatu tiba di workshop"
        }
      }
    });

    // Update courier stats
    await Users.findByIdAndUpdate(courierId, {
      $set: {
        "courierInfo.currentDeliveryId": null,
        "courierInfo.isAvailable": true,
        "courierInfo.lastLocationUpdate": now
      },
      $inc: {
        "courierInfo.todayDeliveries": 1,
        "courierInfo.totalDeliveries": 1
      }
    });

    return NextResponse.json({
      success: true,
      message: "Sepatu berhasil diantar ke workshop",
      data: { status: "in_workshop" }
    });

  } catch (error) {
    console.error("Arrive workshop error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}