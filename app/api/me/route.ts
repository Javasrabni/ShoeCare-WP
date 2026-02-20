// app/api/me/route.ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        isGuest: user.isGuest,
        loyaltyPoints: user.loyaltyPoints,
      }
    });
  } catch (error) {
    console.error("Error in /api/me:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}