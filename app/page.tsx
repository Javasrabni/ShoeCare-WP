import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const user = await getUser()
  // console.log(user.role)
  if (user?.isGuest == false) {
    if (user?.role == "admin") {
      return redirect('/admin/dashboard')
    } else if (user?.role == "courier") {
      return redirect('/dashboard/kurir/queue')
    } else {
      return redirect('/layanan')
    }
  }

  return (
    <div className="px-6 sm:px-16 py-4 sm:py-8">  
      <p>ShoeCare</p>
      <Link href="/layanan">layanan</Link>
    </div>
  );
}
