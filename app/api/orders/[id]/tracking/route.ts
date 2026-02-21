// app/api/orders/[id]/tracking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ⬅️ FIX: params adalah Promise
) {
  try {
    // ⬅️ FIX: Unwrap params dengan await
    const { id: orderId } = await params;
    
    console.log("Tracking request for:", orderId);

    if (!orderId || orderId.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    let order;

    // Coba cari berdasarkan orderNumber (format: SC-XXXXXX-XXXX)
    if (orderId.startsWith("SC-")) {
      console.log("Searching by orderNumber:", orderId);
      order = await Order.findOne({ orderNumber: orderId }).lean();
    } 
    // Coba cari berdasarkan MongoDB _id
    else if (mongoose.Types.ObjectId.isValid(orderId)) {
      console.log("Searching by _id:", orderId);
      order = await Order.findById(orderId).lean();
    }
    // Fallback: cari di kedua field
    else {
      console.log("Fallback search for:", orderId);
      order = await Order.findOne({
        $or: [{ orderNumber: orderId }, { _id: orderId }]
      }).lean();
    }

    console.log("Order found:", order ? "YES" : "NO");

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Order not found", 
          searchedId: orderId 
        }, 
        { status: 404 }
      );
    }

    // Buat timeline dari status history atau default
    let timeline = [];
    
    if (order.statusHistory && order.statusHistory.length > 0) {
      timeline = order.statusHistory.map((h: any, idx: number) => ({
        id: h._id?.toString() || `status-${idx}`,
        status: h.status,
        timestamp: h.timestamp,
        label: getStatusLabel(h.status),
        description: getStatusDescription(h.status),
        updatedBy: h.updatedByName || "System",
        notes: h.notes || "",
        icon: getStatusIcon(h.status)
      }));
    } else {
      // Default timeline
      timeline = [
        {
          id: "created",
          status: "created",
          timestamp: order.createdAt,
          label: "Order Dibuat",
          description: "Pesanan berhasil dibuat",
          updatedBy: order.customerInfo?.name || "Customer",
          notes: "",
          icon: "📝"
        }
      ];

      if (order.status && order.status !== "created") {
        timeline.push({
          id: "current",
          status: order.status,
          timestamp: order.updatedAt || order.createdAt,
          label: getStatusLabel(order.status),
          description: getStatusDescription(order.status),
          updatedBy: "System",
          notes: "",
          icon: getStatusIcon(order.status)
        });
      }
    }

    const currentStage = order.tracking?.currentStage || order.status || "pending";

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status || "pending",
        currentStage,
        timeline,
        trackingDetails: order.tracking?.trackingDetails || [],
        courier: order.tracking?.courierName ? {
          name: order.tracking.courierName,
          pickupTime: order.tracking.pickupTime,
          deliveryTime: order.tracking.deliveryTime
        } : null
      }
    });
  } catch (error) {
    console.error("Tracking API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: String(error) }, 
      { status: 500 }
    );
  }
}

// Helper functions tetap sama...
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    "pending": "Menunggu Konfirmasi",
    "waiting_confirmation": "Menunggu Konfirmasi",
    "confirmed": "Dikonfirmasi Admin",
    "courier_assigned": "Kurir Ditugaskan",
    "pickup_in_progress": "Kurir Menuju Lokasi",
    "picked_up": "Barang Diambil",
    "in_workshop": "Sampai di Workshop",
    "processing": "Sedang Dikerjakan",
    "qc_check": "Quality Control",
    "ready_for_delivery": "Siap Diantar",
    "delivery_in_progress": "Dalam Pengantaran",
    "completed": "Selesai",
    "cancelled": "Dibatalkan",
    "created": "Order Dibuat"
  };
  return labels[status] || status;
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    "pending": "Pesanan menunggu verifikasi pembayaran dari admin",
    "waiting_confirmation": "Menunggu admin memverifikasi bukti pembayaran",
    "confirmed": "Pembayaran telah diverifikasi, menunggu penugasan kurir",
    "courier_assigned": "Kurir telah ditugaskan untuk mengambil pesanan",
    "pickup_in_progress": "Kurir sedang dalam perjalanan ke lokasi Anda",
    "picked_up": "Barang telah diambil oleh kurir",
    "in_workshop": "Barang telah sampai di workshop dan akan diproses",
    "processing": "Teknisi sedang mengerjakan treatment sepatu Anda",
    "qc_check": "Quality control sedang memeriksa hasil pengerjaan",
    "ready_for_delivery": "Barang siap diantar ke alamat Anda",
    "delivery_in_progress": "Kurir sedang mengantar barang ke lokasi Anda",
    "completed": "Pesanan telah selesai dan barang telah diterima",
    "cancelled": "Pesanan telah dibatalkan",
    "created": "Pesanan berhasil dibuat dan menunggu pembayaran"
  };
  return descriptions[status] || "";
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    "pending": "⏳",
    "waiting_confirmation": "⏳",
    "confirmed": "✅",
    "courier_assigned": "👤",
    "pickup_in_progress": "🚗",
    "picked_up": "📦",
    "in_workshop": "🏭",
    "processing": "🧽",
    "qc_check": "🔍",
    "ready_for_delivery": "📋",
    "delivery_in_progress": "🚚",
    "completed": "🎉",
    "cancelled": "❌",
    "created": "📝"
  };
  return icons[status] || "📍";
}