import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Cari order by orderNumber atau _id
    const order = await Order.findOne({
      $or: [
        { orderNumber: id },
        { _id: id }
      ]
    })
    .select("orderNumber status statusHistory tracking customerInfo pickupProof activeCourier courierQueue createdAt updatedAt")
    .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Build timeline dari statusHistory
    const timeline = buildTimeline(order);

    // Format response
    const response = {
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        currentStage: order.status,
        customerInfo: order.customerInfo,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        
        // Timeline lengkap
        timeline: timeline,
        
        // Tracking info
        tracking: {
          courierId: order.tracking?.courierId,
          courierName: order.tracking?.courierName,
          pickupTime: order.tracking?.pickupTime,
          deliveryTime: order.tracking?.deliveryTime,
          completedTime: order.tracking?.completedTime,
          currentStage: order.tracking?.currentStage || order.status
        },

        // Active courier (jika ada)
        activeCourier: order.activeCourier,

        // Pickup proof (jika sudah diambil)
        pickupProof: order.pickupProof,

        // Queue info
        courierQueue: order.courierQueue?.map((q: any) => ({
          courierId: q.courierId,
          status: q.status,
          assignedAt: q.assignedAt,
          acceptedAt: q.acceptedAt
        }))
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Tracking API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// Helper: Build timeline dari statusHistory
function buildTimeline(order: any) {
  const statusMap: Record<string, { label: string; description: string; icon: string }> = {
    pending: { 
      label: "Menunggu Pembayaran", 
      description: "Menunggu upload bukti pembayaran",
      icon: "⏳"
    },
    waiting_confirmation: { 
      label: "Menunggu Konfirmasi", 
      description: "Pembayaran sedang diverifikasi admin",
      icon: "🔄"
    },
    confirmed: { 
      label: "Pesanan Dikonfirmasi", 
      description: "Pembayaran berhasil diverifikasi",
      icon: "✅"
    },
    courier_assigned: { 
      label: "Kurir Ditugaskan", 
      description: "Kurir telah ditugaskan ke pesanan",
      icon: "🚚"
    },
    pickup_in_progress: { 
      label: "Kurir Menuju Lokasi", 
      description: "Kurir sedang dalam perjalanan",
      icon: "🛵"
    },
    picked_up: { 
      label: "Sepatu Diambil", 
      description: "Sepatu telah dijemput kurir",
      icon: "📦"
    },
    in_workshop: { 
      label: "Di Workshop", 
      description: "Sepatu sedang dalam antrian pengerjaan",
      icon: "🏭"
    },
    processing: { 
      label: "Sedang Diproses", 
      description: "Treatment sedang dilakukan",
      icon: "🧼"
    },
    qc_check: { 
      label: "Quality Check", 
      description: "Pengecekan kualitas hasil treatment",
      icon: "🔍"
    },
    ready_for_delivery: { 
      label: "Siap Dikirim", 
      description: "Sepatu siap dikirim ke customer",
      icon: "📋"
    },
    delivery_in_progress: { 
      label: "Dalam Pengiriman", 
      description: "Kurir mengantar sepatu ke lokasi",
      icon: "🚚"
    },
    completed: { 
      label: "Pesanan Selesai", 
      description: "Pesanan telah berhasil diselesaikan",
      icon: "🎉"
    },
    cancelled: { 
      label: "Dibatalkan", 
      description: "Pesanan telah dibatalkan",
      icon: "❌"
    }
  };

  // Jika ada statusHistory, gunakan itu
  if (order.statusHistory && order.statusHistory.length > 0) {
    return order.statusHistory.map((history: any, index: number) => {
      const statusInfo = statusMap[history.status] || { 
        label: history.status, 
        description: "",
        icon: "📍"
      };

      return {
        id: index + 1,
        status: history.status,
        label: statusInfo.label,
        description: history.notes || statusInfo.description,
        timestamp: history.timestamp,
        updatedBy: history.updatedByName,
        icon: statusInfo.icon,
        isActive: history.status === order.status,
        isCompleted: new Date(history.timestamp) <= new Date()
      };
    });
  }

  // Fallback: buat timeline dasar dari status saat ini
  const currentStatus = statusMap[order.status] || { 
    label: order.status, 
    description: "",
    icon: "📍"
  };

  return [{
    id: 1,
    status: order.status,
    label: currentStatus.label,
    description: currentStatus.description,
    timestamp: order.createdAt,
    icon: currentStatus.icon,
    isActive: true,
    isCompleted: false
  }];
}