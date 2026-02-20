// app/api/admin/orders/[id]/assign-courier/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import { getUser } from "@/lib/auth"; // ← Menggunakan auth Anda

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
    const { courierId } = await req.json();

    // Validasi order exists dan status sesuai
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    if (order.status !== "confirmed") {
      return NextResponse.json(
        { success: false, message: "Order belum dikonfirmasi" },
        { status: 400 }
      );
    }

    // Get courier info
    const courier = await Users.findById(courierId);
    if (!courier || courier.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Kurir tidak valid" },
        { status: 400 }
      );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: "courier_assigned",
        "tracking.courierId": courierId,
        "tracking.courierName": courier.name,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Kurir berhasil ditugaskan",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error assigning courier:", error);
    return NextResponse.json(
      { success: false, message: "Gagal assign kurir" },
      { status: 500 }
    );
  }
}