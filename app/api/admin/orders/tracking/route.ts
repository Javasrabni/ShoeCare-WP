// /app/api/admin/orders/tracking/route.ts - FIX DATA PARSING
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const orders = await Order.find(query)
      .select(`
        orderNumber 
        customerInfo 
        status 
        statusHistory 
        pickupLocation 
        activeCourier 
        pickupProof
        payment
        items
        createdAt
        updatedAt
      `)
      .populate("activeCourier.courierId", "name phone courierInfo.vehicleNumber")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    // ⬅️ FIX: Better data formatting dengan null checks
    const formattedOrders = orders.map(order => {
      // Get last status history
      const lastUpdate = order.statusHistory?.length > 0 
        ? order.statusHistory[order.statusHistory.length - 1].timestamp 
        : order.updatedAt;

      // Format customer info
      const customerName = order.customerInfo?.name || "Unknown";
      const customerPhone = order.customerInfo?.phone || "-";

      // Format courier info
      const courier = order.activeCourier?.courierId ? {
        name: order.activeCourier.courierId.name || "Unknown",
        phone: order.activeCourier.courierId.phone || "-",
        vehicleNumber: order.activeCourier.courierId.courierInfo?.vehicleNumber || "-"
      } : null;

      return {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customerName,
        customerPhone,
        status: order.status,
        currentStage: getStageLabel(order.status),
        pickupAddress: order.pickupLocation?.address || "-",
        courier,
        hasPickupProof: !!order.pickupProof?.image,
        pickupProofImage: order.pickupProof?.image || null,
        pickupProofTimestamp: order.pickupProof?.timestamp || null,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : new Date().toISOString(),
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("❌ Admin tracking error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}

function getStageLabel(status: string): string {
  const labels: Record<string, string> = {
    "pending": "Menunggu Pembayaran",
    "waiting_confirmation": "Menunggu Konfirmasi", 
    "confirmed": "Dikonfirmasi",
    "courier_assigned": "Kurir Ditugaskan",
    "pickup_in_progress": "Menuju Lokasi",
    "picked_up": "Barang Diambil",
    "in_workshop": "Di Workshop",
    "processing": "Sedang Dikerjakan",
    "qc_check": "Quality Control",
    "ready_for_delivery": "Siap Diantar",
    "delivery_in_progress": "Dalam Pengantaran",
    "completed": "Selesai",
    "cancelled": "Dibatalkan"
  };
  return labels[status] || status;
}