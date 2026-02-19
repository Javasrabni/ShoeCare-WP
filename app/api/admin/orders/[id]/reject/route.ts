// app/api/admin/orders/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- Promise
) {
  try {
    await connectDB();

    const { id } = await params; // <-- Unwrap dengan await
    const { reason } = await req.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hapus gambar dari Cloudinary
    if (order.payment?.publicId) {
      try {
        await cloudinary.uploader.destroy(order.payment.publicId);
      } catch (err) {
        console.error("Gagal hapus gambar:", err);
      }
    }

    // Kembalikan poin
    if (order.loyaltyPoints?.used > 0 && order.customerInfo?.userId) {
      await Users.findByIdAndUpdate(order.customerInfo.userId, {
        $inc: { loyaltyPoints: order.loyaltyPoints.used },
      });
    }

    await Order.findByIdAndUpdate(id, {
      status: "cancelled",
      "adminActions.cancellationReason": reason,
      "adminActions.cancelledAt": new Date(),
      "payment.status": "failed",
      "payment.proofImage": null,
    });

    return NextResponse.json({
      success: true,
      message: "Order berhasil dibatalkan",
    });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membatalkan order" },
      { status: 500 }
    );
  }
}
