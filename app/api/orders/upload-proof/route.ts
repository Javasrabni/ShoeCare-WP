// app/api/orders/upload-proof/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const orderId = formData.get("orderId") as string;

    if (!file || !orderId) {
      return NextResponse.json(
        { success: false, message: "File and orderId required" },
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

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: "shoecare/payments",
      public_id: `payment_${orderId}_${Date.now()}`,
    });

    const imageUrl = uploadResult.secure_url;

    // Update order payment
    order.payment.proofImage = imageUrl;
    order.payment.status = "waiting_confirmation";
    order.status = "waiting_confirmation";
    
    // ⬅️ TAMBAHKAN KE STATUS HISTORY
    order.statusHistory.push({
      status: "waiting_confirmation",
      timestamp: new Date(),
      updatedBy: user?._id || null,
      updatedByName: user?.name || "Customer",
      notes: "Bukti pembayaran diupload, menunggu konfirmasi admin",
      location: null
    });

    // Update tracking current stage
    order.tracking.currentStage = "waiting_confirmation";

    await order.save();

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        orderId,
        status: "waiting_confirmation",
      },
    });
  } catch (error) {
    console.error("Upload Proof API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}