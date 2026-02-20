// app/api/customer/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const phone = searchParams.get("phone");
    
    // Cek autentikasi jika mengakses sebagai member
    const currentUser = await getUser();
    
    // Jika user login, hanya bisa lihat order sendiri
    if (currentUser && userId && currentUser._id.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!userId && !phone) {
      return NextResponse.json(
        { success: false, message: "User ID atau Phone diperlukan" },
        { status: 400 }
      );
    }
    
    // Query untuk member (userId) atau guest (phone)
    const query: any = userId 
      ? { "customerInfo.userId": userId }
      : { "customerInfo.phone": phone, "customerInfo.isGuest": true };
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      data: orders
    });
    
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data order" },
      { status: 500 }
    );
  }
}