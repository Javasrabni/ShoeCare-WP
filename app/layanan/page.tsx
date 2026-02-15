import { getUser } from '@/lib/auth';
import LayananClient from './layananClient';


async function Page() {
    const user = await getUser()
    const userId = user?._id.toString()

    return (
      <LayananClient userRole={user?.role} userName={user?.name} userId={userId}/>
    )
}

export default Page
    