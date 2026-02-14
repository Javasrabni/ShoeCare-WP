import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export default async function proxy(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
    // const isMemberRoute =
    //   request.nextUrl.pathname.startsWith("/dashboard/member");

    if (!token) {
      return NextResponse.json(
        { message: "Login diperlukan untuk mengakses halaman ini" },
        { status: 401 }
      );
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {role: string};

    if (isAdminRoute && payload.role !== "admin") {
      return NextResponse.redirect(new URL('/layanan', request.url));
    }

    // if (isMemberRoute && payload.role !== "member") {
    //   return NextResponse.redirect(new URL('/layanan', request.url));
    // }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { message: "Token tidak valid atau sudah kadaluarsa" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
