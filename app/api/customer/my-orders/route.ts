// app/api/customer/my-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getUser();

    // Jika tidak login, return error
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login" },
        { status: 401 }
      );
    }

    await connectDB();

    // Cari order berdasarkan userId atau phone
    const query: any = {
      $or: [
        { "customerInfo.userId": session.user.id },
        { "customerInfo.phone": session.user.phone },
      ],
    };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .select("orderNumber status createdAt payment.tracking items")
      .lean();

    // Format response
    const formattedOrders = orders.map((order: any) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: getStatusLabel(order.status),
      createdAt: order.createdAt,
      total: order.payment?.finalAmount,
      itemCount: order.items?.length || 0,
      canTrack: true,
      canReview: order.status === "completed",
      canReorder: order.status === "completed" || order.status === "cancelled",
    }));

    return NextResponse.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error("My Orders API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Menunggu Konfirmasi",
    confirmed: "Dikonfirmasi",
    courier_assigned: "Kurir Ditugaskan",
    pickup_in_progress: "Kurir Menuju Lokasi",
    picked_up: "Barang Diambil",
    in_workshop: "Di Workshop",
    processing: "Sedang Dikerjakan",
    qc_check: "Quality Control",
    ready_for_delivery: "Siap Diantar",
    delivery_in_progress: "Dalam Pengantaran",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return labels[status] || status;
}
