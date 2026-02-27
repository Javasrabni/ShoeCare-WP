// /app/api/orders/[id]/route.ts - Public order tracking dengan proof
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();

    const order = await Order.findById(id)
      .select(`
        orderNumber 
        status 
        statusHistory
        customerInfo
        pickupLocation
        pickupProof
        items
        payment
        activeCourier
        createdAt
        updatedAt
      `)
      .populate("activeCourier.courierId", "name phone")
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Public safe response
    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        currentStage: getStageLabel(order.status),
        customerName: order.customerInfo?.name,
        customerPhone: maskPhone(order.customerInfo?.phone),
        pickupAddress: order.pickupLocation?.address,
        items: order.items,
        payment: {
          finalAmount: order.payment?.finalAmount,
          status: order.payment?.status
        },
        courier: order.activeCourier ? {
          name: order.activeCourier.courierId?.name,
          phone: maskPhone(order.activeCourier.courierId?.phone)
        } : null,
        hasPickupProof: !!order.pickupProof,
        pickupProof: order.pickupProof ? {
          image: order.pickupProof.image,
          timestamp: order.pickupProof.timestamp,
          location: order.pickupProof.location
        } : null,
        timeline: order.statusHistory?.map((h: any) => ({
          status: h.status,
          label: getStageLabel(h.status),
          timestamp: h.timestamp,
          notes: h.notes
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
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

function maskPhone(phone: string): string {
  if (!phone) return "";
  // Show only last 4 digits
  return phone.slice(0, -4).replace(/./g, "*") + phone.slice(-4);
}