import Sidebar from '@/components/admin/sidebar/sidebar';
import { getUser } from '@/lib/auth';

import clsx from 'clsx'

export default async function AdminLayout({ children, }: { children: React.ReactNode }) {
    const user = await getUser()
    const userId = user?._id.toString()
    return (
        <div className="flex ">
            <Sidebar
                userRole={user?.role ?? "Guest"}
                userId={userId}
            />

            <main className={clsx("w-full px-6 sm:px-16 py-4 sm:py-8 ml-0 md:ml-70")}>
                {children}
            </main>
        </div>
    )
}