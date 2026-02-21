// app/api/admin/orders/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getUser();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv"; // csv or json
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    await connectDB();

    let query: any = {};
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + "T23:59:59");
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("adminActions.confirmedBy", "name")
      .populate("tracking.courierId", "name")
      .lean();

    // Format for export
    const exportData = orders.map((order: any) => ({
      "Nomor Order": order.orderNumber,
      "Tanggal Order": new Date(order.createdAt).toLocaleString("id-ID"),
      "Nama Customer": order.customerInfo.name,
      Telepon: order.customerInfo.phone,
      Tipe: order.customerInfo.isGuest ? "Guest" : "Member",
      Layanan: order.serviceType,
      Status: order.status,
      Total: order.payment?.finalAmount,
      "Dikonfirmasi Oleh": order.adminActions?.confirmedBy?.name || "-",
      Kurir: order.tracking?.courierId?.name || "-",
      "Waktu Pickup": order.tracking?.pickupTime
        ? new Date(order.tracking.pickupTime).toLocaleString("id-ID")
        : "-",
      "Waktu Selesai": order.tracking?.completedTime
        ? new Date(order.tracking.completedTime).toLocaleString("id-ID")
        : "-",
      "Jumlah Edit": order.editHistory?.length || 0,
      Alamat: order.pickupLocation?.address || "-",
      "Drop Point": order.pickupLocation?.dropPointName || "-",
    }));

    if (format === "json") {
      return NextResponse.json({ success: true, data: exportData });
    }

    // CSV Format
    const headers = Object.keys(exportData[0] || {});
    const csvRows = [
      headers.join(","),
      ...exportData.map((row: any) =>
        headers
          .map((h) => {
            const val = row[h as keyof typeof row];
            // Escape quotes and wrap in quotes if contains comma
            const str = String(val || "");
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      ),
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="order-history-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
