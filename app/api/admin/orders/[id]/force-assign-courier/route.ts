import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { courierId, notes } = await request.json();

    if (!courierId) {
      return NextResponse.json(
        { success: false, message: "Courier ID diperlukan" },
        { status: 400 }
      );
    }

    await connectDB();

    // Cek kurir exists (tidak peduli status online/offline/busy)
    const courier = await Users.findById(courierId);
    if (!courier || courier.role !== "courier") {
      return NextResponse.json(
        { success: false, message: "Kurir tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah kurir sudah ada di queue order ini (hindari duplikat)
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek duplikat
    const alreadyAssigned = existingOrder.courierQueue?.some(
      (q: any) => q.courierId.toString() === courierId && q.status === "pending"
    );

    if (alreadyAssigned) {
      return NextResponse.json(
        { success: false, message: "Kurir sudah ditugaskan ke order ini" },
        { status: 400 }
      );
    }

    // Update order dengan $push untuk atomic operation
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $push: {
          courierQueue: {
            courierId,
            assignedAt: new Date(),
            status: "pending",
            assignedBy: user.id,
            notes: notes || `Ditugaskan oleh admin: ${user.name}`,
            acceptedAt: null,
            completedAt: null
          }
        },
        $set: {
          status: "courier_assigned",
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Kurir berhasil ditugaskan ke antrian",
      data: {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        courierName: courier.name,
        queueLength: updatedOrder.courierQueue.length,
        status: updatedOrder.status
      }
    });

  } catch (error) {
    console.error("Force assign error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}