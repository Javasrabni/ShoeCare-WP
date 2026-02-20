// app/api/admin/orders/[id]/edit/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
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
    const { items, reason } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Items tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Alasan perubahan wajib diisi" },
        { status: 400 }
      );
    }

    // Hitung ulang harga
    const newSubtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Ambil order lama untuk history
    const oldOrder = await Order.findById(id);
    if (!oldOrder) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        items,
        "payment.subtotal": newSubtotal,
        "payment.finalAmount":
          newSubtotal +
          (oldOrder.payment.deliveryFee || 0) -
          (oldOrder.payment.discountPoints || 0),
        editedAt: new Date(),
        editedBy: admin._id,
        $push: {
          editHistory: {
            editedBy: admin._id,
            editedAt: new Date(),
            changes: {
              items: oldOrder.items,
              priceChanges: items,
              reason,
            },
          },
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Order berhasil diupdate",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Edit error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal edit order" },
      { status: 500 }
    );
  }
}