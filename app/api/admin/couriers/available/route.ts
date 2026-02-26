import { NextRequest, NextResponse } from "next/server";
import { Users } from "@/app/models/users";
import { Order } from "@/app/models/orders";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    await connectDB();

    // Ambil SEMUA kurir aktif (tidak peduli status)
    const couriers = await Users.find({
      role: "courier",
      isActive: true
    }).select("name phone courierInfo").lean();

    // Cek status sibuk dari order yang sedang aktif
    const couriersWithDetails = await Promise.all(
      couriers.map(async (courier: any) => {
        let distance = null;
        
        // Hitung jarak jika koordinat tersedia
        if (lat && lng && courier.courierInfo?.currentLocation?.lat) {
          distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            courier.courierInfo.currentLocation.lat,
            courier.courierInfo.currentLocation.lng
          );
        }

        // Cek apakah sedang sibuk (punya order aktif)
        const activeOrder = await Order.findOne({
          "activeCourier.courierId": courier._id,
          status: { 
            $in: ["pickup_in_progress", "picked_up", "in_workshop", "processing", "delivery_in_progress"] 
          }
        }).select("orderNumber status");

        const isAvailable = courier.courierInfo?.isAvailable ?? true;
        const isBusy = !!activeOrder;

        return {
          _id: courier._id,
          name: courier.name,
          phone: courier.phone,
          courierInfo: courier.courierInfo,
          distance: distance ? Math.round(distance * 100) / 100 : null,
          // Status untuk UI
          status: isBusy ? "busy" : (isAvailable ? "free" : "offline"),
          statusLabel: isBusy ? "🚫 Sedang Mengantar" : (isAvailable ? "✅ Tersedia" : "⚪ Offline"),
          isActuallyBusy: isBusy,
          activeOrder: activeOrder ? {
            orderNumber: activeOrder.orderNumber,
            status: activeOrder.status
          } : null,
          // ⬅️ TAMBAHKAN: Tetap bisa di-assign meski busy
          canBeAssigned: true // Selalu true untuk force assign
        };
      })
    );

    // Sort by distance (yang null di akhir)
    couriersWithDetails.sort((a: any, b: any) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return NextResponse.json({
      success: true,
      data: couriersWithDetails,
      count: couriersWithDetails.length
    });

  } catch (error) {
    console.error("Couriers API Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}