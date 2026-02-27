// /app/api/courier/orders/[id]/contact-customer/route.ts - FIX PARAMS
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
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

    await connectDB();

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(id),
      "activeCourier.courierId": new mongoose.Types.ObjectId(courierId),
      status: "pickup_in_progress"
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Mark sudah kontak customer
    await Order.findByIdAndUpdate(id, {
      $set: {
        "activeCourier.customerContacted": true,
        "activeCourier.contactedAt": now
      },
      $push: {
        statusHistory: {
          status: "courier_contacted_customer",
          timestamp: now,
          updatedBy: new mongoose.Types.ObjectId(courierId),
          updatedByName: user.name,
          notes: "Kurir menghubungi customer via WhatsApp"
        }
      }
    });

    // Generate WA URL
    const phone = order.customerInfo.phone.replace(/^0/, '62').replace(/\D/g, '');
    const message = `Halo ${order.customerInfo.name}, saya kurir dari ShoeCare. Saya akan menjemput sepatu Anda untuk order ${order.orderNumber}. Terima kasih!`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({
      success: true,
      message: "Kontak customer tercatat",
      waUrl
    });

  } catch (error) {
    console.error("Contact customer error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}