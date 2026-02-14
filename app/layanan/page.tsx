import { getUser } from '@/lib/auth';
async function Page() {
    const user = await getUser();
    // console.log('Dashboard User:', user);
    return (
        <div className='px-6 sm:px-16 py-8  '>
            <p>Dashboard Page for User: {user?.name}</p>
        </div>
    )
}

export default Page
