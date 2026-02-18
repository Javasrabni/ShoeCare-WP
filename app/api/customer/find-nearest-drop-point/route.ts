// app/api/customer/find-nearest-drop-point/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { DropPoint } from "@/app/models/droppoint";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { lat, lng } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, message: "Koordinat tidak valid" },
        { status: 400 }
      );
    }

    // Cari semua drop point aktif dengan jaraknya
    const allDropPoints = await DropPoint.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distance",
          spherical: true,
          query: { status: "Aktif" },
        },
      },
      {
        $addFields: {
          distanceKM: { $divide: ["$distance", 1000] },
        },
      },
      { $sort: { distance: 1 } },
    ]);

    if (allDropPoints.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada drop point aktif" },
        { status: 404 }
      );
    }

    const nearest = allDropPoints[0];
    const distanceKM = nearest.distanceKM;
    const radiusKM = nearest.radiusMaxKM;
    const isInsideRadius = distanceKM <= radiusKM;
    
    let deliveryFee = 0;
    let chargeDetails = null;
    
    if (!isInsideRadius) {
      const excessKM = Math.ceil(distanceKM - radiusKM);
      deliveryFee = excessKM * nearest.chargeOutsideRadius;
      chargeDetails = {
        baseRadius: radiusKM,
        actualDistance: Math.round(distanceKM * 100) / 100,
        excessDistance: excessKM,
        ratePerKM: nearest.chargeOutsideRadius,
        totalFee: deliveryFee,
      };
    }

    // Format semua drop point untuk ditampilkan di map
    const allDropPointsFormatted = allDropPoints.map((dp: any) => ({
      _id: dp._id,
      name: dp.name,
      address: dp.address,
      location: dp.location,
      distanceKM: Math.round(dp.distanceKM * 100) / 100,
      radiusMaxKM: dp.radiusMaxKM,
      chargeOutsideRadius: dp.chargeOutsideRadius,
      isInsideRadius: dp.distanceKM <= dp.radiusMaxKM,
      isNearest: dp._id.toString() === nearest._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        nearestDropPoint: allDropPointsFormatted[0],
        allDropPoints: allDropPointsFormatted, // Semua drop point
        deliveryFee,
        chargeDetails,
        isInsideRadius,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}