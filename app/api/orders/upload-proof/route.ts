// app/api/orders/upload-proof/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const orderId = formData.get("orderId") as string;

    if (!file || !orderId) {
      return NextResponse.json(
        { success: false, message: "File dan Order ID diperlukan" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload ke Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64File, {
      folder: "shoecare/payments",
      public_id: `order_${orderId}_${Date.now()}`,
    });

    // Update order
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        "payment.proofImage": uploadResult.secure_url,
        "payment.status": "waiting_confirmation",
        status: "waiting_confirmation", // ← Update status order juga
      },
      { new: true }
    );

    if (!order) {
      // Hapus gambar jika order tidak ditemukan
      await cloudinary.uploader.destroy(uploadResult.public_id);
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil diupload",
      data: order
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal upload bukti pembayaran" },
      { status: 500 }
    );
  }
}