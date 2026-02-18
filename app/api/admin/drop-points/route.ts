// app/api/admin/drop-points/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { DropPoint } from "@/app/models/droppoint";

/* =========================
   GET ALL DROP POINTS
========================= */
export async function GET() {
  try {
    await connectDB();
    const dropPoints = await DropPoint.find().lean();
    return NextResponse.json({ success: true, data: dropPoints });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   CREATE DROP POINT
========================= */
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name,
      address,
      location,
      capacity,
      adminDropPoint,
      radiusMaxKM,
      chargeOutsideRadius,
      status,
    } = body;

    if (typeof radiusMaxKM !== "number" || isNaN(radiusMaxKM)) {
      return NextResponse.json(
        { success: false, message: "Max radius harus number" },
        { status: 400 }
      );
    }

    if (
      !name ||
      !address ||
      !location ||
      !adminDropPoint ||
      !radiusMaxKM ||
      !chargeOutsideRadius
    ) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const dropPoint = await DropPoint.create({
      name,
      address,
      capacity,
      location,
      adminDropPoint,
      radiusMaxKM,
      chargeOutsideRadius,
    });

    return NextResponse.json({ success: true, data: dropPoint });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE MULTI DROP POINTS
========================= */
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "IDs tidak valid" },
        { status: 400 }
      );
    }

    const result = await DropPoint.deleteMany({ _id: { $in: ids } });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} drop point dihapus`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
