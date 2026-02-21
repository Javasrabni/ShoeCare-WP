// app/api/admin/orders/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const adminId = searchParams.get("admin");
    const orderNumber = searchParams.get("orderNumber");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    await connectDB();

    // Build query
    let query: any = {};

    if (status) query.status = status;
    if (orderNumber) query.orderNumber = { $regex: orderNumber, $options: "i" };
    if (adminId) {
      query.$or = [
        { "adminActions.confirmedBy": adminId },
        { "statusHistory.updatedBy": adminId },
        { "editHistory.editedBy": adminId },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + "T23:59:59");
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("adminActions.confirmedBy", "name")
        .populate("statusHistory.updatedBy", "name")
        .populate("editHistory.editedBy", "name")
        .lean(),
      Order.countDocuments(query),
    ]);

    // Format data dengan log lengkap
    const formattedOrders = orders.map((order: any) => {
      // ⬅️ PASTIKAN CUSTOMER INFO ADALAH STRING, BUKAN OBJECT
      const customerName = typeof order.customerInfo?.name === 'string' 
        ? order.customerInfo.name 
        : order.customerInfo?.name?.name || 'Unknown';
      
      const customerPhone = typeof order.customerInfo?.phone === 'string'
        ? order.customerInfo.phone
        : order.customerInfo?.phone?.toString() || '-';

      return {
        _id: order._id.toString(), // ⬅️ CONVERT ObjectId KE STRING
        orderNumber: order.orderNumber,
        customerInfo: {
          name: customerName,
          phone: customerPhone,
          isGuest: order.customerInfo?.isGuest ?? true,
        },
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        // Summary counts
        totalEdits: order.editHistory?.length || 0,
        totalStatusChanges: order.statusHistory?.length || 0,

        // Latest action - ⬅️ PASTIKAN updatedBy ADALAH STRING
        latestAction: order.statusHistory?.length > 0 
          ? {
              status: order.statusHistory[order.statusHistory.length - 1].status,
              timestamp: order.statusHistory[order.statusHistory.length - 1].timestamp,
              updatedBy: typeof order.statusHistory[order.statusHistory.length - 1].updatedBy === 'string'
                ? order.statusHistory[order.statusHistory.length - 1].updatedBy
                : order.statusHistory[order.statusHistory.length - 1].updatedBy?.name 
                  || order.statusHistory[order.statusHistory.length - 1].updatedByName 
                  || 'System',
            }
          : null,

        // All logs combined & sorted
        logs: [
          ...(order.statusHistory?.map((h: any) => ({
            type: "status_change",
            timestamp: h.timestamp,
            status: h.status,
            // ⬅️ PASTIKAN updatedBy SELALU STRING
            updatedBy: typeof h.updatedBy === 'string' 
              ? h.updatedBy 
              : h.updatedBy?.name || h.updatedByName || "System",
            notes: h.notes || "",
            icon: getStatusIcon(h.status),
          })) || []),
          ...(order.editHistory?.map((e: any) => ({
            type: "edit",
            timestamp: e.editedAt,
            // ⬅️ PASTIKAN updatedBy SELALU STRING
            updatedBy: typeof e.editedBy === 'string'
              ? e.editedBy
              : e.editedBy?.name || "Unknown",
            changes: e.changes ? JSON.stringify(e.changes) : null, // ⬅️ CONVERT OBJECT KE STRING
            notes: e.changes?.reason || "",
          })) || []),
          {
            type: "created",
            timestamp: order.createdAt,
            updatedBy: "Customer",
            notes: "Order dibuat",
          },
        ].sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
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