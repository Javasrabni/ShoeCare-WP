import { getUser } from '@/lib/auth';
import LayananClient from './layananClient';


async function Page() {
    const user = await getUser()
    return (
      <LayananClient userRole={user?.role} userName={user?.name} />
    )
}

export default Page
