"use client"

// import Image from 'next/image'
import { Dashboard } from '@/components/asideMenu/dashboard/dashboard';
import { ArchiveIcon, ClipboardCheckIcon, HomeIcon, Layers3Icon, LayoutDashboardIcon, MapPinHouseIcon, PackageIcon, PackageSearchIcon, ScrollTextIcon, ShoppingCartIcon, StarIcon, UsersRoundIcon, UserStarIcon, VanIcon, WrenchIcon } from 'lucide-react'
import React from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useSidebar } from '@/app/context/sidebar/sidebarContext';

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
            { id: 2, label: 'Pesanan Masuk', icon: <ShoppingCartIcon size={20} />, path: "/admin/manajemen-order" },
            { id: 3, label: 'Drop Point', icon: <MapPinHouseIcon size={20} />, path: "/admin/drop-point" },
            { id: 4, label: 'Ulasan Customer', icon: <StarIcon size={20} />, path: "/admin/semua-ulasan-customer" },
            { id: 5, label: 'Inventori', icon: <ArchiveIcon size={20} />, path: "/admin/inventori" },
        ],
        memberUser: [
            { id: 1, label: 'Dashboard', icon: <LayoutDashboardIcon size={20} />, },  // Dashbsoard untuk member
            { id: 2, label: 'Pesanan Saya', icon: <ShoppingCartIcon size={20} />, },  // Menu untuk melihat pesanan
            { id: 3, label: 'Lacak Pesanan', icon: <PackageSearchIcon size={20} /> },  // Opsi layanan

            { id: 4, label: 'Riwayat Transaksi', icon: <ScrollTextIcon size={20} />, }, // Profil
        ],
        guestUser: [
            { id: 1, label: 'Dashboard', icon: <HomeIcon size={20} />, },  // Menu utama untuk guest
            { id: 2, label: 'Lacak Pesanan', icon: <PackageSearchIcon size={20} /> },  // Opsi layanan
            { id: 3, label: 'Riwayat Transaksi', icon: <ScrollTextIcon size={20} />, }, // Profil
        ],
        support: [
            { id: 1, label: "Help center", },
            { id: 2, label: "Settings", },
        ],
        staffInternal: [
            { id: 1, label: "Admin", icon: <UserStarIcon size={20} />, path: "/admin/staff-internal/admin" },
            { id: 2, label: "Dropper", icon: <PackageIcon size={20} />, path: "/admin/staff-internal/dropper" },
            { id: 3, label: "Courier", icon: <VanIcon size={20} />, path: "/admin/staff-internal/courier" },
            { id: 4, label: "Technician", icon: <WrenchIcon size={20} />, path: "/admin/staff-internal/technician" },
            { id: 5, label: "Quality Control (QC)", icon: <ClipboardCheckIcon size={20} />, path: "/admin/staff-internal/quality-control" },
        ],
        manajemenMember: [
            { id: 1, label: 'Data Customer', icon: <UsersRoundIcon size={20} />, path: "/admin/manajemen-customer" },
        ]
    }
]


const Sidebar = (props: SidebarType) => {
    const { sidebarStatus, sidebarToggle } = useSidebar()

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
        <>
            <div id="overlay" className={`fixed top-0 right-0 w-full h-full bg-[#00000070] transition  ease-in-out ${sidebarStatus ? "z-35 opaciy-1 duration-500" : "-z-4 opacity-0 duration-700"}`} onClick={() => sidebarToggle(false)} />

            <aside className={clsx(
                "fixed left-0 top-0 h-full w-70 bg-white border-r border-(--border) z-40 transition-transform ",
                sidebarStatus ? "translate-x-0 duration-300" : "-translate-x-full duration-500",
                "md:translate-x-0"
            )}>
                {/* Logo */}
                <div className='flex flex-row items-center justify-center gap-4 w-full h-22.5 shrink-0 border-b border-(--border)'>
                    <div className="bg-(--primary) size-fit px-2 py-1 text-white rounded-lg">
                        <Layers3Icon size={24} />
                        {/* <Image /> */}
                    </div>
                    <h1 className="text-base sm:text-xl font-[poppins] font-semibold">ShoeCare</h1>
                </div>

                {/* Menu */}
                <div className="p-5 flex w-full h-[calc(100vh-90px)] flex-col gap-4 overflow-y-auto">
                    <p className="text-sm text-(--secondary) font-[inter] select-none">
                        Menu {props.userRole == "customer" ? "member" : props.userRole || "Guest"}
                    </p>

                    {/* Parsing data list */}
                    <div className="w-full">
                        {GetMenuItems().map((i, idx) =>
                            <ul key={idx}>
                                <li className="p-4 hover:bg-(--muted) text-(--secondary) font-[poppins] font-semibold text-xs sm:text-base rounded-lg cursor-pointer select-none hover:text-black" onClick={() => { handleClickMenu(i.label, props.userRole, i.path); sidebarToggle(false) }}><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
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
                                            <li className="p-4 hover:bg-(--muted) text-(--secondary) font-[poppins] font-semibold text-xs sm:text-base rounded-lg cursor-pointer select-none hover:text-black" onClick={() => { handleClickMenu(i.label, props.userRole, i.path); sidebarToggle(false) }}><span className="flex flex-row items-center gap-3 shrink-0">{i.icon} {i.label}</span></li>
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
                                            <li className="p-4 hover:bg-(--muted) text-(--secondary) font-[poppins] font-semibold text-xs sm:text-base rounded-lg cursor-pointer select-none hover:text-black" onClick={() => { handleClickMenu(i.label, props.userRole, i.path); sidebarToggle(false) }}><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                    )}
                    <div className="border-t border-(--border) w-full pt-4">
                        {support.map((i, idx) =>
                            <ul key={idx} className="flex flex-col gap-2">
                                <li className="px-4 py-2 hover:bg-(--muted) text-(--secondary) font-[poppins] font-semibold text-xs select-none sm:text-base rounded-lg cursor-pointer hover:text-black"><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
                            </ul>
                        )}
                    </div>
                </div>
            </aside>
        </>

    )
}

export default Sidebar
