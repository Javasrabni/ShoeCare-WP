import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

// ✅ Fix: params adalah Promise di Next.js 15
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Await params untuk dapatkan id
    const { id } = await params;
    const orderId = id;

    await connectDB();

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderNumber: orderId }],
    })
      .populate("adminActions.confirmedBy", "name email")
      .populate("tracking.courierId", "name phone courierInfo")
      .populate("statusHistory.updatedBy", "name role")
      .populate("editHistory.editedBy", "name role")
      .populate("customerInfo.userId", "name email loyaltyPoints")
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Format detailed response
    const detail = {
      // Basic Info
      _id: order._id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      // Customer
      customer: {
        ...order.customerInfo,
        userDetails: order.customerInfo.userId,
      },

      // Service
      serviceType: order.serviceType,
      pickupLocation: order.pickupLocation,

      // Items & Payment
      items: order.items,
      payment: order.payment,

      // Current Status
      status: order.status,

      // Complete Timeline
      timeline: buildTimeline(order),

      // Tracking Details
      tracking: {
        courier: order.tracking?.courierId
          ? {
              id: order.tracking.courierId._id,
              name: order.tracking.courierId.name,
              phone: order.tracking.courierId.phone,
              vehicle: order.tracking.courierId.courierInfo,
            }
          : null,
        pickupTime: order.tracking?.pickupTime,
        deliveryTime: order.tracking?.deliveryTime,
        completedTime: order.tracking?.completedTime,
        stages: order.tracking?.trackingDetails || [],
      },

      // Admin Actions
      adminActions: {
        confirmedBy: order.adminActions?.confirmedBy?.name || null,
        confirmedAt: order.adminActions?.confirmedAt,
        notes: order.adminActions?.notes,
        cancellationReason: order.adminActions?.cancellationReason,
      },

      // Statistics
      stats: {
        totalEdits: order.editHistory?.length || 0,
        totalStatusChanges: order.statusHistory?.length || 0,
        processingTime: calculateProcessingTime(order),
        currentStageDuration: calculateCurrentStageDuration(order),
      },
    };

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error("Order Detail API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

function buildTimeline(order: any) {
  const events = [];

  // Creation
  events.push({
    id: "created",
    type: "created",
    timestamp: order.createdAt,
    title: "Order Dibuat",
    description: `Order ${order.orderNumber} dibuat oleh customer`,
    actor: order.customerInfo.name,
    icon: "📝",
    metadata: {
      serviceType: order.serviceType,
      initialAmount: order.payment?.subtotal,
    },
  });

  // Payment
  if (order.payment?.status === "paid" || order.payment?.proofImage) {
    events.push({
      id: "payment",
      type: "payment",
      timestamp: order.payment.paidAt || order.createdAt,
      title: "Pembayaran Diterima",
      description: `Metode: ${order.payment.method.toUpperCase()}`,
      actor: "Customer",
      icon: "💳",
      metadata: {
        method: order.payment.method,
        amount: order.payment.finalAmount,
        proofImage: order.payment.proofImage,
      },
    });
  }

  // Status History
  order.statusHistory?.forEach((h: any, idx: number) => {
    events.push({
      id: `status-${idx}`,
      type: "status_change",
      timestamp: h.timestamp,
      title: getStatusTitle(h.status),
      description: getStatusDescription(h.status),
      actor: h.updatedBy?.name || h.updatedByName || "System",
      role: h.updatedBy?.role,
      icon: getStatusIcon(h.status),
      notes: h.notes,
      location: h.location,
      metadata: {
        fromStatus: idx > 0 ? order.statusHistory[idx - 1].status : "pending",
        toStatus: h.status,
      },
    });
  });

  // Edits
  order.editHistory?.forEach((e: any, idx: number) => {
    events.push({
      id: `edit-${idx}`,
      type: "edit",
      timestamp: e.editedAt,
      title: "Order Diedit",
      description: e.changes?.reason || "Perubahan item/layanan",
      actor: e.editedBy?.name || "Unknown",
      role: e.editedBy?.role,
      icon: "✏️",
      metadata: {
        itemChanges: e.changes?.items,
        priceChanges: e.changes?.priceChanges,
      },
    });
  });

  // Sort by timestamp desc
  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function getStatusTitle(status: string): string {
  const titles: Record<string, string> = {
    pending: "Menunggu Konfirmasi",
    confirmed: "Dikonfirmasi Admin",
    courier_assigned: "Kurir Ditugaskan",
    pickup_in_progress: "Kurir Menuju Lokasi",
    picked_up: "Barang Diambil",
    in_workshop: "Sampai di Workshop",
    processing: "Sedang Dikerjakan",
    qc_check: "Quality Control",
    ready_for_delivery: "Siap Diantar",
    delivery_in_progress: "Dalam Pengantaran",
    completed: "Order Selesai",
    cancelled: "Order Dibatalkan",
  };
  return titles[status] || status;
}

function getStatusDescription(status: string): string {
  const desc: Record<string, string> = {
    pending: "Menunggu verifikasi pembayaran oleh admin",
    confirmed: "Pembayaran diverifikasi, mencari kurir",
    courier_assigned: "Kurir telah ditugaskan untuk pickup",
    pickup_in_progress: "Kurir sedang dalam perjalanan ke lokasi customer",
    picked_up: "Barang berhasil diambil dari customer",
    in_workshop: "Barang tiba di workshop, menunggu antrian",
    processing: "Teknisi sedang mengerjakan treatment",
    qc_check: "QC memeriksa kualitas hasil pengerjaan",
    ready_for_delivery: "Barang siap diantar ke customer",
    delivery_in_progress: "Kurir mengantar barang ke alamat customer",
    completed: "Barang diterima customer, order selesai",
    cancelled: "Order dibatalkan",
  };
  return desc[status] || "";
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    pending: "⏳",
    confirmed: "✅",
    courier_assigned: "👤",
    pickup_in_progress: "🚗",
    picked_up: "📦",
    in_workshop: "🏭",
    processing: "🧽",
    qc_check: "🔍",
    ready_for_delivery: "📋",
    delivery_in_progress: "🚚",
    completed: "🎉",
    cancelled: "❌",
  };
  return icons[status] || "📝";
}

function calculateProcessingTime(order: any): string | null {
  if (!order.tracking?.pickupTime || !order.tracking?.completedTime)
    return null;

  const start = new Date(order.tracking.pickupTime);
  const end = new Date(order.tracking.completedTime);
  const diff = end.getTime() - start.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari ${hours % 24} jam`;
  return `${hours} jam`;
}

function calculateCurrentStageDuration(order: any): string | null {
  const lastStatus = order.statusHistory?.[order.statusHistory.length - 1];
  if (!lastStatus) return null;

  const start = new Date(lastStatus.timestamp);
  const now = new Date();
  const diff = now.getTime() - start.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} menit`;
  }
  if (hours < 24) return `${hours} jam`;

  const days = Math.floor(hours / 24);
  return `${days} hari ${hours % 24} jam`;
}
