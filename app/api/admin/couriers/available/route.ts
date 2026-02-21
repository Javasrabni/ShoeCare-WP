// app/api/admin/couriers/available/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Users } from "@/app/models/users";
import connectDB from "@/lib/mongodb";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    
    // ⬅️ FIX: Cek user.role langsung
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    await connectDB();

    const query: any = {
      role: "courier",
      isActive: true
    };

    const couriers = await Users.find(query)
      .select("name phone courierInfo")
      .lean();

    const formattedCouriers = couriers.map((courier: any) => {
      let distance = null;
      
      if (lat && lng && courier.courierInfo?.currentLocation?.lat) {
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          courier.courierInfo.currentLocation.lat,
          courier.courierInfo.currentLocation.lng
        );
      }

      const isAvailable = courier.courierInfo?.isAvailable ?? true;
      const isBusy = courier.courierInfo?.currentDeliveryId ? true : false;

      return {
        _id: courier._id,
        name: courier.name,
        phone: courier.phone,
        courierInfo: courier.courierInfo,
        distance: distance ? Math.round(distance * 100) / 100 : null,
        status: isBusy ? "busy" : (isAvailable ? "free" : "offline"),
        statusLabel: isBusy ? "🚫 Sedang Mengantar" : (isAvailable ? "✅ Tersedia" : "⚪ Offline")
      };
    });

    formattedCouriers.sort((a: any, b: any) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return NextResponse.json({ success: true, data: formattedCouriers });
  } catch (error) {
    console.error("Couriers API Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

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