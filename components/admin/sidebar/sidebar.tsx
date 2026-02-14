// import Image from 'next/image'
import { Layers3Icon, LayoutDashboardIcon, ShoppingCartIcon } from 'lucide-react'
import { getUser } from '@/lib/auth';

interface SidebarType {
    userRole?: string;
}

interface MenuList {
    id: number;
    label: string;
    icon?: React.ReactNode
    component: React.ReactNode
}
interface AdminMenuListType {
    guestUser: MenuList[];
    admin: MenuList[];
    memberUser: MenuList[];
    support: MenuList[];
}

export const MenuListData: AdminMenuListType[] = [
    {
        admin: [
            { id: 1, label: 'Dashboard', icon: <LayoutDashboardIcon size={20} />, component: '' },
            { id: 2, label: 'Daftar Pesanan', icon: <ShoppingCartIcon size={20} />, component: '' },
            { id: 3, label: 'Inventory', component: '' },
            { id: 3, label: 'Anggota Member', component: '' },
        ],
        memberUser: [
            { id: 1, label: 'Dashboard', icon: <LayoutDashboardIcon size={20} />, component: '' },  // Dashboard untuk member
            { id: 2, label: 'Pesanan Saya', icon: <ShoppingCartIcon size={20} />, component: '' },  // Menu untuk melihat pesanan
            { id: 3, label: 'Riwayat Transaksi', component: '' }, // Profil
            { id: 4, label: 'Profile', component: '' }, // Profil
        ],
        guestUser: [
            { id: 1, label: 'Beranda', component: '' },  // Menu utama untuk guest
            { id: 2, label: 'Lacak Pesanan', component: '' },  // Opsi layanan
        ],
        support: [
            { id: 1, label: "Help center", component: '' },
            { id: 2, label: "Settings", component: '' },
        ]
    }
]


const Sidebar = async (props: SidebarType) => {
    const user = await getUser()
    const menu = MenuListData[0]
    const GetMenuItems = () => {
        if (user?.role === "admin") {
            return menu.admin
        } else if (user?.role === "customer") {
            return menu.memberUser
        } else {
            return menu.guestUser
        }

    }

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

            {/* Menu */}
            <div className="p-5 flex flex-col gap-4">
                <p className="text-sm text-(--secondary) font-[inter] select-none">
                    Menu {user?.role == "customer" ? "member" : user.role}
                </p>

                {/* Parsing data list */}
                <div className="w-full h-full">
                    {GetMenuItems().map((i, idx) =>
                        <ul key={idx}>
                            <li className="p-4 hover:bg-(--muted) text-(--secondary) font-[poppins] font-semibold text-xs sm:text-base rounded-lg cursor-pointer hover:text-black"><span className="flex flex-row items-center gap-3 ">{i.icon} {i.label}</span></li>
                        </ul>
                    )}
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
