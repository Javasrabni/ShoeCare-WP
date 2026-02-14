import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getUser()
  if(user) {
    redirect('/layanan')
  }
  
  return (
    <div className="px-6 sm:px-16 py-4 sm:py-8">
      <p>ShoeCare</p>
    </div>
  );
}
