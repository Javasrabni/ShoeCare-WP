import AuthLogin from './authClient'
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

const Page = async () => {
    const user = await getUser();
    const userId = user?._id.toString()
    if(userId){
        redirect('/layanan');
    }
    return (
        <div className='w-full h-[calc(100vh-200px)] flex items-center justify-center p-6'>
            <AuthLogin />
        </div>
    )
}

export default Page
