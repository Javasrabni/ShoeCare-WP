// import Image from 'next/image'
import { Layers3Icon } from 'lucide-react'

interface SidebarType {
    userRole: string
}

const Sidebar = (props: SidebarType) => {
    return (
        <aside className="w-70 bg-white flex flex-col border-r border-(--border) h-screen fixed left-0 top-0 z-100">
            {/* Logo */}
            <div className='flex flex-row items-center justify-center gap-4 w-full h-22.5 border-b border-(--border)'>
                <div className="bg-(--primary) size-fit px-2 py-1 text-white rounded-lg">
                    <Layers3Icon size={24} />
                    {/* <Image /> */}
                </div>
                <h1 className="text-xl font-[poppins] font-semibold">ShoeCare</h1>
            </div>

            <div className="p-5 flex flex-col gap-4">
                <p className="text-sm text-(--secondary) font-[inter] select-none"><span className='capitalize'>{props.userRole}</span> menu</p>
            </div>

        </aside>
    )
}

export default Sidebar
