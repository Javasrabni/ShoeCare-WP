import { getUser } from '@/lib/auth';
async function Page() {
    const user = await getUser();
    console.log('Dashboard User:', user);
    return (
        <div>
            <p>Dashboard Page for User: {user?.name}</p>
        </div>
    )
}

export default Page
