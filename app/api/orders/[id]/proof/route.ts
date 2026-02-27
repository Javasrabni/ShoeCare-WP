// /app/api/orders/[id]/proof/route.ts - API untuk view proof (public/authorized)
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    await connectDB();

    const order = await Order.findById(id)
      .select("pickupProof orderNumber customerInfo status")
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check authorization
    const isAuthorized = 
      !user || // Public access untuk customer dengan link
      user.role === 'admin' ||
      user.role === 'dropper' ||
      user.role === 'technician' ||
      user.role === 'qc' ||
      (user.role === 'courier' && order.activeCourier?.courierId?.toString() === user._id?.toString()) ||
      (order.customerInfo?.phone && user.phone === order.customerInfo.phone);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!order.pickupProof) {
      return NextResponse.json(
        { success: false, message: "Bukti pickup belum diupload" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: order.pickupProof.image,
        timestamp: order.pickupProof.timestamp,
        takenBy: order.pickupProof.uploadedBy,
        location: order.pickupProof.location,
        notes: order.pickupProof.notes
      }
    });

  } catch (error) {
    console.error("Get proof error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}