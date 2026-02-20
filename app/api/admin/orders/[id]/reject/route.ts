// app/api/admin/orders/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import { getUser } from "@/lib/auth"; // ← Menggunakan auth Anda

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Cek autentikasi admin
    const admin = await getUser();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { reason } = await req.json();

    if (!reason || reason.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Alasan pembatalan wajib diisi" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hapus gambar dari Cloudinary jika ada
    if (order.payment?.proofImage) {
      try {
        const urlParts = order.payment.proofImage.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`shoecare/${publicId}`);
        }
      } catch (err) {
        console.error("Gagal hapus gambar:", err);
      }
    }

    // Kembalikan poin jika digunakan
    if (order.loyaltyPoints?.used > 0 && order.customerInfo?.userId) {
      await Users.findByIdAndUpdate(order.customerInfo.userId, {
        $inc: { loyaltyPoints: order.loyaltyPoints.used },
      });
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(id, {
      status: "cancelled",
      "adminActions.cancellationReason": reason,
      "adminActions.cancelledAt": new Date(),
      "adminActions.cancelledBy": admin._id,
      "payment.status": "failed",
      "payment.proofImage": null,
    }, { new: true });

    return NextResponse.json({
      success: true,
      message: "Order berhasil dibatalkan",
      data: updatedOrder
    });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membatalkan order" },
      { status: 500 }
    );
  }
}