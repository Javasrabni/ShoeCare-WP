"use client"

// import Image from 'next/image'
import { Dashboard } from '@/components/asideMenu/dashboard/dashboard';
import { ClipboardCheckIcon, HomeIcon, Layers3Icon, LayoutDashboardIcon, MapPinHouseIcon, PackageIcon, ScrollTextIcon, ShoppingCartIcon, StarIcon, UsersRoundIcon, UserStarIcon, VanIcon, WrenchIcon } from 'lucide-react'
import React from 'react';
import { useRouter } from 'next/navigation';

interface SidebarType {
    userRole: string
    userId: string
    onMenuClick?: (menu: string, userRole: string) => void
}

interface MenuList {
    id: number;
    label: string;
    icon?: React.ReactNode;
    component?: React.ReactNode;
    path?: string;
}
interface AdminMenuListType {
    guestUser: MenuList[];
    admin: MenuList[];
    memberUser: MenuList[];
    support: MenuList[];
    staffInternal: MenuList[];
    manajemenMember: MenuList[];
}

export const MenuListData: AdminMenuListType[] = [
    {
        admin: [
            { id: 1, label: 'Dashboard', icon: <LayoutDashboardIcon size={20} />, path: "/admin/dashboard" },
            { id: 2, label: 'Semua Pesanan Masuk', icon: <ShoppingCartIcon size={20} />, path: "/admin/manajemen-order" },
            { id: 3, label: 'Drop Point', icon: <MapPinHouseIcon size={20} />, path: "/admin/drop-point" },
            { id: 4, label: 'Semua Ulasan', icon: <StarIcon  size={20} />, path: "/admin/semua-ulasan-customer" },
        ],
        memberUser: [
            { id: 1, label: 'Dashboard', icon: <LayoutDashboardIcon size={20} />, },  // Dashboard untuk member
            { id: 2, label: 'Pesanan Saya', icon: <ShoppingCartIcon size={20} />, },  // Menu untuk melihat pesanan
            { id: 3, label: 'Riwayat Transaksi', icon: <ScrollTextIcon size={20} />, }, // Profil
        ],
        guestUser: [
            { id: 1, label: 'Beranda', icon: <HomeIcon size={20} />, },  // Menu utama untuk guest
            { id: 2, label: 'Lacak Pesanan', },  // Opsi layanan
            { id: 3, label: 'Riwayat Transaksi', icon: <ScrollTextIcon size={20} />, }, // Profil
        ],
        support: [
            { id: 1, label: "Help center", },
            { id: 2, label: "Settings", },
        ],
        staffInternal: [
            { id: 1, label: "Admin", icon: <UserStarIcon size={20} /> },
            { id: 2, label: "Dropper", icon: <PackageIcon size={20} /> },
            { id: 3, label: "Courier", icon: <VanIcon size={20} /> },
            { id: 4, label: "Technician", icon: <WrenchIcon size={20} /> },
            { id: 5, label: "Quality Control (QC)", icon: <ClipboardCheckIcon size={20} /> },
        ],
        manajemenMember: [
            { id: 1, label: 'Anggota Member', icon: <UsersRoundIcon size={20} /> },
        ]
    }
]


const Sidebar = (props: SidebarType) => {
    const router = useRouter()
    const menu = MenuListData[0]
    const staffInternal = MenuListData[0].staffInternal
    const support = MenuListData[0].support
    const manajemenPengguna = MenuListData[0].manajemenMember

    // Kelompokkan menu list berdasarkan admin
    const GetMenuItems = () => {
        if (props.userRole === "admin") {
            return menu.admin
        } else if (props.userRole === "customer") {
            return menu.memberUser
        } else {
            return menu.guestUser
        }
    }

    function handleClickMenu(label: string, userRole: string, path?: string) {
        if (path) {
            return router.push(path)
        }
        if (props?.onMenuClick) { props.onMenuClick(label, userRole) }
    }


    return (
        <aside className="w-70 bg-white flex flex-col border-r border-(--border) h-screen fixed left-0 top-0 z-100">
            {/* Logo */}
            <div className='flex flex-row items-center justify-center gap-4 w-full h-22.5 shrink-0 border-b border-(--border)'>
                <div className="bg-(--primary) size-fit px-2 py-1 text-white rounded-lg">
                    <Layers3Icon size={24} />
                    {/* <Image /> */}
                </div>
                <h1 className="text-xl font-[poppins] font-semibold">ShoeCare</h1>
            </div>

            {/* Menu */}
            <div className="p-5 flex w-full h-full flex-col gap-4 overflow-y-auto">
                <p className="text-sm text-(--secondary) font-[inter] select-none">
                    Menu {props.userRole == "customer" ? "member" : props.userRole || "Guest"}
                </p>

                {/* Parsing data list */}
                <div className="w-full">
                    {GetMenuItems().map((i, idx) =>
                        <ul key={idx}>
                            <li className="p-4 hover:bg-(--muted) text-(--secondary) font-[poppins] font-semibold text-xs sm:text-base rounded-lg cursor-pointer hover:text-black" onClick={() => handleClickMenu(i.label, props.userRole, i.path)}><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
                        </ul>
                    )}
                </div>



                {props.userRole === "admin" && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-(--secondary) font-[inter] select-none">
                                Manajemen Customer
                            </p>
                            <div className='h-full'>
                                {manajemenPengguna.map((i, idx) =>
                                    <ul key={idx}>
                                        <li className="p-4 hover:bg-(--muted) text-(--secondary) font-[poppins] font-semibold text-xs sm:text-base rounded-lg cursor-pointer hover:text-black"><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-(--secondary) font-[inter] select-none">
                                Staff Internal
                            </p>
                            <div className='h-full'>
                                {staffInternal.map((i, idx) =>
                                    <ul key={idx}>
                                        <li className="p-4 hover:bg-(--muted) text-(--secondary) font-[poppins] font-semibold text-xs sm:text-base rounded-lg cursor-pointer hover:text-black"><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                )}
                <div className="border-t border-(--border) w-full pt-4">
                    {support.map((i, idx) =>
                        <ul key={idx} className="flex flex-col gap-2">
                            <li className="px-4 py-2 hover:bg-(--muted) text-(--secondary) font-[poppins] font-semibold text-xs sm:text-base rounded-lg cursor-pointer hover:text-black"><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
                        </ul>
                    )}
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
