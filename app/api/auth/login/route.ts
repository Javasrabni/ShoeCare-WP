import connectDB from "@/lib/mongodb";
import { Users } from "@/app/models/users";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { identifier, password, role } = await request.json();

    if (!identifier || !password || !role) {
      return NextResponse.json(
        { message: "Isi semua kolom yang diperlukan" },
        { status: 400 }
      );
    }

    // const isPhone = identifier.startsWith("0");
    // const isEmail = identifier.endsWith("@gmail.com");

    // if (!isPhone && !isEmail) {
    //   return NextResponse.json(
    //     { message: "Email atau nomor telepon tidak valid" },
    //     { status: 400 }
    //   );
    // }

    if (identifier.length < 5) {
      return NextResponse.json(
        { message: "Data tidak valid" },
        { status: 400 }
      );
    }

    let phoneorEmail = identifier.includes("@")
      ? identifier
      : identifier.replace("0", "62");

    // DB
    await connectDB();

    const user = await Users.findOne({
      $or: [{ email: phoneorEmail }, { phone: phoneorEmail }],
    });
    if (!user) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan atau email/no hp tidak valid." },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Kata sandi salah" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: "7d" }
    );

    user.lastLogin = new Date();
    await user.save();
    
    console.log(user.role)
    const res = NextResponse.json({
      user: { name: user.name, email: user.email, role: user.role },
    });


    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    });

    return res;
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}
