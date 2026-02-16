import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { DropPoint } from "@/app/models/droppoint";

/* =========================
   GET ALL DROP POINTS
========================= */
export async function GET() {
  try {
    await connectDB();

    const dropPoints = await DropPoint.find().lean();

    return NextResponse.json({
      success: true,
      data: dropPoints,
    });
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

    const { name, address, location, capacity, status } = body;

    if (!name || !address || !location || !capacity) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const dropPoint = await DropPoint.create({
      name,
      address,
      capacity,
      status,
      location, // langsung pakai
    });

    return NextResponse.json({
      success: true,
      data: dropPoint,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
