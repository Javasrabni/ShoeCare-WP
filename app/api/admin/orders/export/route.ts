import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const serviceType = searchParams.get("serviceType");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    await connectDB();

    // Build query
    let query: any = {};
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(query)
      .select("orderNumber customerInfo serviceType status payment createdAt tracking")
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV
    const headers = [
      "Order Number",
      "Customer Name",
      "Customer Phone",
      "Service Type",
      "Status",
      "Payment Status",
      "Amount",
      "Courier",
      "Created At"
    ].join(",");

    const rows = orders.map(order => [
      order.orderNumber,
      `"${order.customerInfo.name}"`,
      order.customerInfo.phone,
      order.serviceType,
      order.status,
      order.payment.status,
      order.payment.finalAmount,
      `"${order.tracking?.courierName || '-'}"`,
      new Date(order.createdAt).toISOString()
    ].join(","));

    const csv = [headers, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}