import { getUser } from '@/lib/auth';
import Sidebar from "@/components/admin/sidebar/sidebar";

async function Page() {
    const user = await getUser();
    // console.log('Dashboard User:', user);
    return (
        <div className='px-6 sm:px-16 py-8  '>
            <Sidebar/>
            <p>Dashboard Page for User: {user?.name}</p>
        </div>
    )
}

export default Page
