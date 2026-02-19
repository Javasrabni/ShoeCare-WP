// app/api/orders/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Order } from "@/app/models/orders";
import { Users } from "@/app/models/users";
import { generateOrderNumber } from "@/lib/order-utils";
// import { DropPoint } from "@/app/models/droppoint";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      customerInfo,
      serviceType,
      pickupLocation,
      items,
      payment,
      useLoyaltyPoints = 0, // Jumlah poin yang ingin digunakan
    } = body;

    // Hitung subtotal
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Hitung poin yang didapat (1% dari subtotal)
    const pointsEarned = Math.floor(subtotal * 0.01);

    // Hitung diskon dari poin (1 poin = Rp 1)
    const discountPoints = Math.min(useLoyaltyPoints, subtotal * 0.5); // Max 50% diskon
    const finalAmount = subtotal + pickupLocation.deliveryFee - discountPoints;

    // Generate nomor order
    const orderNumber = generateOrderNumber();

    // Buat order
    const order = await Order.create({
      orderNumber,
      customerInfo,
      serviceType,
      pickupLocation,
      items,
      payment: {
        ...payment,
        amount: finalAmount + discountPoints, // Total sebelum diskon
        subtotal,
        deliveryFee: pickupLocation.deliveryFee,
        discountPoints,
        finalAmount,
      },
      loyaltyPoints: {
        earned: pointsEarned,
        used: discountPoints,
        rate: 0.01,
      },
      status: "pending",
    });

    // Jika user login (bukan guest), kurangi poin yang digunakan
    if (!customerInfo.isGuest && customerInfo.userId && useLoyaltyPoints > 0) {
      await Users.findByIdAndUpdate(customerInfo.userId, {
        $inc: { loyaltyPoints: -useLoyaltyPoints },
      });
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal membuat order" },
      { status: 500 }
    );
  }
}
