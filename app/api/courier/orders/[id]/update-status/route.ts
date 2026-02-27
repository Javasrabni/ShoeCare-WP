import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import mongoose from "mongoose";

// Upload ke Cloudinary (reuse logic dari payment proof)
async function uploadToCloudinary(imageBase64: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = "shoecare_proofs"; // Buat preset ini di Cloudinary
  
  const formData = new FormData();
  formData.append("file", imageBase64);
  formData.append("upload_preset", uploadPreset);
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData
  });
  
  const data = await res.json();
  return data.secure_url;
}

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
    const { status, proofImage, notes, location } = await request.json();
    const courierId = user._id?.toString() || user.id;

    await connectDB();

    // Verifikasi order milik kurir ini
    const order = await Order.findOne({
      _id: id,
      "activeCourier.courierId": new mongoose.Types.ObjectId(courierId)
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    let proofUrl = null;
    if (proofImage) {
      // Upload ke Cloudinary
      proofUrl = await uploadToCloudinary(proofImage);
    }

    const now = new Date();
    const updateData: any = {
      $set: {
        status,
        updatedAt: now
      },
      $push: {
        statusHistory: {
          status,
          timestamp: now,
          updatedBy: new mongoose.Types.ObjectId(courierId),
          updatedByName: user.name,
          notes: notes || `Status diupdate ke ${status}`,
          location: location || null
        }
      }
    };

    // Jika status picked_up, simpan proof
    if (status === "picked_up" && proofUrl) {
      updateData.$set.pickupProof = {
        image: proofUrl,
        timestamp: now,
        notes: notes || "Bukti penjemputan",
        location: location || null,
        uploadedBy: new mongoose.Types.ObjectId(courierId)
      };
      updateData.$set["tracking.pickupTime"] = now;
    }

    // Jika status completed
    if (status === "completed") {
      updateData.$set["tracking.completedTime"] = now;
      updateData.$set["activeCourier"] = null; // Reset active courier
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json({
      success: true,
      message: "Status berhasil diupdate",
      data: {
        orderId: updatedOrder._id,
        status: updatedOrder.status,
        proofUrl
      }
    });

  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}