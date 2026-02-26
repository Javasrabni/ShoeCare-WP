import { getUser } from '@/lib/auth';
import LayananClient from './layananClient';
import { redirect } from 'next/navigation';

async function Page() {
    const user = await getUser()
    const userId = user?._id.toString()

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
      <LayananClient userRole={user?.role} userName={user?.name} userId={userId}/>
    )
}

export default Page
    