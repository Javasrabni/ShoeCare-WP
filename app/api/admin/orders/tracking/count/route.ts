import { NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Hitung order yang sedang in progress (aktif, belum selesai/cancel)
    const count = await Order.countDocuments({
      status: { 
        $in: [
          "waiting_confirmation",
          "confirmed", 
          "courier_assigned",
          "pickup_in_progress",
          "picked_up",
          "in_workshop",
          "processing",
          "qc_check",
          "ready_for_delivery",
          "delivery_in_progress"
        ] 
      }
    });

    // Breakdown by status untuk detail tambahan (optional)
    const breakdown = await Order.aggregate([
      {
        $match: {
          status: { 
            $in: [
              "waiting_confirmation",
              "confirmed", 
              "courier_assigned",
              "pickup_in_progress",
              "picked_up",
              "in_workshop",
              "processing",
              "qc_check",
              "ready_for_delivery",
              "delivery_in_progress"
            ] 
          }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      count,
      breakdown: breakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (error) {
    console.error("Tracking count error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}