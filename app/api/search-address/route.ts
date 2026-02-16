import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  if (!q) {
    return NextResponse.json({ error: "Query kosong" }, { status: 400 })
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    q
  )}&format=json&countrycodes=id&addressdetails=1`

  const response = await fetch(url, {
    headers: {
      "User-Agent": "your-app-name"
    }
  })

  const data = await response.json()

  return NextResponse.json(data)
}
