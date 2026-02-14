import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Users } from "@/app/models/users";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, passwordConfirm } =
      await request.json();

    // validasi semua kolom terisi
    if (!name || !phone || !password || !passwordConfirm) {
      return NextResponse.json(
        { message: "Isi semua kolom yang diperlukan" },
        { status: 400 }
      );
    }

    // validasi panjang nama minimal 5 karakter
    if (name.length < 5) {
      return NextResponse.json(
        { message: "Nama minimal 5 karakter" },
        { status: 400 }
      );
    } 

    if(name.length > 30) {
      return NextResponse.json(
        { message: "Nama maksimal 20 karakter" },
        { status: 400 }
      );
    }

    // validasi kecocokan password
    if (password !== passwordConfirm) {
      return NextResponse.json(
        { message: "Kata sandi tidak cocok" },
        {
          status: 400,
        }
      );
    }

    // validasi panjang password minimal 6 karakter
    if (password.length < 7) {
      return NextResponse.json(
        { message: "Password minimal 7 karakter" },
        {
          status: 400,
        }
      );
    }

    // Validasi format email jika diisi
    if (email) {
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailRegex.test(email)) {
        return NextResponse.json(
          { message: "Email tidak valid." },
          { status: 400 }
        );
      }
    }

    // CAPTCHA VERIFICATION
    // if (!captchaToken) {
    //   return NextResponse.json({ error: "Captcha required" }, { status: 400 });
    // }

    // // Verify ke Cloudflare
    // const verifyRes = await fetch(
    //   "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     body: new URLSearchParams({
    //       secret: process.env.TURNSTILE_SECRET_KEY!,
    //       response: captchaToken,
    //     }),
    //   }
    // );
    // const verifyData = await verifyRes.json();
    // if (!verifyData.success) {
    //   return NextResponse.json({ message: "Captcha invalid" }, { status: 400 });
    // }

    // connect to DB
    await connectDB();

    // normalisasi email
    const normalizedEmail = email.trim().toLowerCase();

    // normalisasi phone
    let normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "62" + normalizedPhone.slice(1);
    }
    if (!normalizedPhone.startsWith("62")) {
      return NextResponse.json(
        { message: "Format nomor telepon tidak valid" },
        { status: 400 }
      );
    }

    // Validasi struktur nomor HP
    const phoneRegex = /^628[1-9][0-9]{6,10}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        { message: "Nomor HP tidak valid" },
        { status: 400 }
      );
    }

    // checing apakah email atau phone sudah terdaftar
    const checkUser = await Users.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });
    if (checkUser) {
      return NextResponse.json(
        { message: "Email atau Nomor Telepon sudah terdaftar" },
        { status: 400 }
      );
    }

    // enkripsi password
    const hashedPassword = await bcrypt.hash(password, 10);

    // simpan user baru
    await Users.create({
      name: name.toLowerCase(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "customer",
      isGuest: false,
    });

    return NextResponse.json(
      { message: "Registrasi berhasil, silakan login!", success: true },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
