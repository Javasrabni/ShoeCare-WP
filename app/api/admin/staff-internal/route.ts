import { NextResponse } from "next/server"
import { getAdmins } from "@/lib/user.service"

export async function GET() {
  try {
    const admins = await getAdmins()
    return NextResponse.json({ data: admins })
  } catch (error) {
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}
