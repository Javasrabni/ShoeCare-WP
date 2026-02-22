// app/api/customer/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { getUser } from "@/lib/auth";

// Helper: 08... ↔ 628...
const formatPhone = (phone: string): { to62: string; to08: string } => {
  const clean = phone.replace(/[\s-]/g, "");
  
  if (clean.startsWith("0")) {
    return { to62: "62" + clean.slice(1), to08: clean };
  }
  if (clean.startsWith("62")) {
    return { to62: clean, to08: "0" + clean.slice(2) };
  }
  return { to62: clean, to08: clean };
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const phone = searchParams.get("phone");

    console.log("Fetching orders for:", { userId, phone });

    if (!userId && !phone) {
      return NextResponse.json(
        { success: false, message: "User ID atau Phone diperlukan" },
        { status: 400 }
      );
    }

    let query: any;

    if (userId) {
      // Member: cari berdasarkan userId
      query = { "customerInfo.userId": userId };
    } else if (phone) {
      // Guest: cari berdasarkan phone (format 08... atau 628...)
      const { to62, to08 } = formatPhone(phone);
      
      // Cari dengan kedua format (OR)
      query = {
        $or: [
          { "customerInfo.phone": to08 },   // 0812...
          { "customerInfo.phone": to62 },   // 62812...
        ],
        "customerInfo.isGuest": true
      };
      
      console.log("Searching phone formats:", { to08, to62 });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    console.log(`Found ${orders.length} orders`);

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data order" },
      { status: 500 }
    );
  }
}