// app/api/admin/orders/[id]/assign-courier/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { courierId } = await req.json();

    // Get courier info
    const courier = await Users.findById(courierId);
    if (!courier || courier.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Kurir tidak valid" },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(
      params.id,
      {
        status: "courier_assigned",
        "tracking.courierId": courierId,
        "tracking.courierName": courier.name,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal assign kurir" },
      { status: 500 }
    );
  }
}
