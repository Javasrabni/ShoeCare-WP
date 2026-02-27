// /app/api/courier/orders/[id]/pickup/route.ts - FIX UPLOAD HANDLING
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const courierId = user._id?.toString() || user.id;

    console.log("📸 Pickup API - Order ID:", id);
    console.log("📸 Pickup API - Courier ID:", courierId);

    await connectDB();

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(id),
      "activeCourier.courierId": new mongoose.Types.ObjectId(courierId),
      status: "pickup_in_progress"
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan atau status tidak valid" },
        { status: 404 }
      );
    }

    // ⬅️ FIX: Parse form data dengan benar
    const formData = await request.formData();
    
    console.log("📸 Pickup API - FormData keys:", Array.from(formData.keys()));
    
    const photo = formData.get("photo") as File | null;
    const notes = formData.get("notes") as string || "";
    const lat = formData.get("lat") as string;
    const lng = formData.get("lng") as string;

    console.log("📸 Pickup API - Photo:", photo ? {
      name: photo.name,
      type: photo.type,
      size: photo.size
    } : "NULL");

    if (!photo || photo.size === 0) {
      return NextResponse.json(
        { success: false, message: "Foto bukti diperlukan" },
        { status: 400 }
      );
    }

    // ⬅️ FIX: Convert File ke Buffer dengan benar
    let buffer: Buffer;
    try {
      const arrayBuffer = await photo.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      console.log("📸 Pickup API - Buffer size:", buffer.length);
    } catch (err) {
      console.error("📸 Buffer conversion error:", err);
      return NextResponse.json(
        { success: false, message: "Gagal membaca file foto" },
        { status: 400 }
      );
    }

    // Upload ke Cloudinary
    let uploadResult: any;
    try {
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: "shoecare/pickup_proofs",
            resource_type: "auto",
            format: "jpg"
          },
          (error, result) => {
            if (error) {
              console.error("📸 Cloudinary error:", error);
              reject(error);
            } else {
              console.log("📸 Cloudinary success:", result?.public_id);
              resolve(result);
            }
          }
        );
        
        uploadStream.end(buffer);
      });
    } catch (uploadErr: any) {
      console.error("📸 Upload error:", uploadErr);
      return NextResponse.json(
        { success: false, message: `Gagal upload: ${uploadErr.message}` },
        { status: 500 }
      );
    }

    const now = new Date();

    // Update order
    await Order.findByIdAndUpdate(id, {
      $set: {
        pickupProof: {
          image: uploadResult.secure_url,
          timestamp: now,
          notes: notes,
          location: lat && lng ? {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
          } : null,
          uploadedBy: new mongoose.Types.ObjectId(courierId)
        },
        status: "picked_up",
        "tracking.pickupTime": now
      },
      $push: {
        statusHistory: {
          status: "picked_up",
          timestamp: now,
          updatedBy: new mongoose.Types.ObjectId(courierId),
          updatedByName: user.name,
          notes: "Sepatu berhasil dijemput, menuju workshop"
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Bukti pickup berhasil diupload, sepatu menuju workshop",
      data: {
        photoUrl: uploadResult.secure_url,
        status: "picked_up"
      }
    });

  } catch (error: any) {
    console.error("❌ Pickup upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}