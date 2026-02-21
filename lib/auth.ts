import connectDB from "./mongodb";
import { Users } from "@/app/models/users";
// import { NextResponse } from "next/server";
// import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getUser() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("token")?.value;
    if (!cookie) return null;

    const payload = jwt.verify(cookie, process.env.JWT_SECRET_KEY!) as {
      userId: string;
    };

    await connectDB();
    const user = await Users.findById(payload.userId)
      .select("_id name role email isGuest phone loyaltyPoints")
      .lean();
    if (!user) return null;

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}
// lib/auth.ts
export async function getSession() {
  const user = await getUser();
  if (!user) return null;
  return { user }; // ⬅️ Wrap dalam object
}


export async function Logout() {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error("Failed to log out");
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error logging out:", error);
    return null;
  }
}
