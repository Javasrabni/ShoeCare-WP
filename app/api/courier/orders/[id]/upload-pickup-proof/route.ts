import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const courierId = user.id;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const notes = formData.get("notes") as string;
    const locationStr = formData.get("location") as string;
    const location = locationStr ? JSON.parse(locationStr) : null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File bukti pickup diperlukan" },
        { status: 400 }
      );
    }

    // Validasi file
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "File harus berupa gambar" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File maksimal 5MB" },
        { status: 400 }
      );
    }

    // Generate nama file unik
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `pickup-${id}-${courierId}-${timestamp}.${extension}`;
    
    // Simpan file
    const uploadDir = join(process.cwd(), "public", "uploads", "pickups");
    await mkdir(uploadDir, { recursive: true });
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/pickups/${filename}`;

    await connectDB();

    // Update order dengan bukti pickup
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: id,
        "activeCourier.courierId": courierId,
        status: "pickup_in_progress"
      },
      {
        $set: {
          pickupProof: {
            image: imageUrl,
            timestamp: new Date(),
            notes: notes || "",
            location: location || null,
            uploadedBy: courierId
          },
          status: "picked_up",
          "tracking.pickupTime": new Date(),
          $push: {
            statusHistory: {
              status: "picked_up",
              timestamp: new Date(),
              updatedBy: courierId,
              updatedByName: user.name,
              notes: `Bukti pickup diupload${notes ? ": " + notes : ""}`,
              location: location || null
            },
            "tracking.trackingDetails": {
              stage: "picked_up",
              timestamp: new Date(),
              proofImage: imageUrl,
              notes: notes || "Bukti pengambilan sepatu",
              updatedBy: courierId,
              updatedByName: user.name,
              location: location || null
            }
          }
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan atau status tidak valid" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bukti pickup berhasil diupload",
      data: {
        order: updatedOrder,
        proofUrl: imageUrl
      }
    });

  } catch (error) {
    console.error("Upload pickup proof error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}