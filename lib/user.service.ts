import connectDB from "@/lib/mongodb";
import { Users } from "@/app/models/users";

export async function getAdmins() {
  await connectDB();

  const admins = await Users.find(
    { role: "admin" },
    "_id name role phone email profilePhoto createdAt"
  ).lean();

  return admins;
}
