"use client"

// import Image from 'next/image'
import { Dashboard } from '@/components/asideMenu/dashboard/dashboard';
import { ArchiveIcon, ClipboardCheckIcon, FootprintsIcon, HomeIcon, Layers3Icon, LayoutDashboardIcon, LogOutIcon, MapPinHouseIcon, PackageIcon, PackageSearchIcon, ScrollTextIcon, ShoppingCartIcon, StarIcon, UsersRoundIcon, UserStarIcon, VanIcon, WrenchIcon, BrushCleaningIcon, StoreIcon } from 'lucide-react'
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useSidebar } from '@/app/api/orders/sidebar/sidebarContext';
import { logout } from '@/lib/auth-client';

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




const Sidebar = (props: SidebarType) => {
    const [pendingCount, setPendingCount] = useState(0);
    const [processingCount, setProcessingCount] = useState(0);

    // Fetch pending orders count
    useEffect(() => {
        if (props.userRole === "admin") {
            fetchPendingCount();
            fetchProcessingCount();  // ⬅️ TAMBAHKAN INI
            // Polling setiap 30 detik
            const interval = setInterval(() => {
                fetchPendingCount();
                fetchProcessingCount();  // ⬅️ TAMBAHKAN INI
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [props.userRole]);

    const fetchPendingCount = async () => {
        try {
            const res = await fetch("/api/admin/orders/pending/count");
            const data = await res.json();
            if (data.success) {
                setPendingCount(data.count);
            }
        } catch (error) {
            console.error("Failed to fetch pending count");
        }
    };

    // ⬅️ TAMBAHKAN FUNGSI INI
    const fetchProcessingCount = async () => {
        try {
            const res = await fetch("/api/admin/orders/need-processing/count");
            const data = await res.json();
            if (data.success) {
                setProcessingCount(data.count);
            }
        } catch (error) {
            console.error("Failed to fetch processing count");
        }
    };

    const MenuListData: AdminMenuListType[] = [
        {
            admin: [
                { id: 1, label: 'Dashboard', icon: <LayoutDashboardIcon size={20} />, path: "/admin/dashboard" },
                {
                    id: 2,
                    label: 'Pesanan Masuk',
                    icon: <div className="relative">
                        <ShoppingCartIcon size={20} />
                        {pendingCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {pendingCount > 9 ? '9+' : pendingCount}
                            </span>
                        )}
                    </div>,
                    path: "/admin/manajemen-order"
                },
                {
                    id: 7,
                    label: 'Perlu Diproses',
                    icon: <div className="relative">
                        <PackageIcon size={20} />
                        {processingCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {processingCount > 9 ? '9+' : processingCount}
                            </span>
                        )}
                    </div>,
                    path: "/admin/perlu-diproses"
                },
                { id: 3, label: 'Drop Point', icon: <MapPinHouseIcon size={20} />, path: "/admin/drop-point" },
                { id: 4, label: 'Workshop', icon: <StoreIcon size={20} />, path: "/admin/workshop" },
                { id: 5, label: 'History & Log', icon: <ScrollTextIcon size={20} />, path: "/admin/order-history" },
                { id: 6, label: 'Ulasan Customer', icon: <StarIcon size={20} />, path: "/admin/semua-ulasan-customer" },
            ],
            memberUser: [
                { id: 1, label: 'Dashboard', icon: <LayoutDashboardIcon size={20} />, path: "/layanan" },  // ← TAMBAHKAN path
                { id: 2, label: 'Pesanan Saya', icon: <ShoppingCartIcon size={20} />, path: "/layanan/lacak-pesanan" },  // ← TAMBAHKAN path
                { id: 3, label: 'Lacak Pesanan', icon: <PackageSearchIcon size={20} />, path: "/layanan/lacak-pesanan" },  // ← TAMBAHKAN path
                { id: 4, label: 'Riwayat Transaksi', icon: <ScrollTextIcon size={20} />, path: "/layanan/riwayat" },  // ← TAMBAHKAN path (sesuaikan)
            ],
            guestUser: [
                { id: 1, label: 'Dashboard', icon: <HomeIcon size={20} />, path: "/layanan" },  // ← TAMBAHKAN path
                { id: 2, label: 'Lacak Pesanan', icon: <PackageSearchIcon size={20} />, path: "/layanan/lacak-pesanan" },  // ← TAMBAHKAN path
                { id: 3, label: 'Riwayat Transaksi', icon: <ScrollTextIcon size={20} />, path: "/layanan/lacak-pesanan" },  // ← TAMBAHKAN path (guest pakai lacak juga)
            ],

            support: [
                { id: 1, label: "Help center", },
                { id: 2, label: "Settings", },
            ],
            staffInternal: [
                { id: 1, label: "Admin", icon: <UserStarIcon size={20} />, path: "/admin/staff-internal/admin" },
                { id: 2, label: "Dropper", icon: <PackageIcon size={20} />, path: "/admin/staff-internal/dropper" },
                { id: 3, label: "Courier", icon: <VanIcon size={20} />, path: "/admin/staff-internal/courier" },
                { id: 4, label: "Technician", icon: <BrushCleaningIcon size={20} />, path: "/admin/staff-internal/technician" },
                { id: 5, label: "Quality Control (QC)", icon: <ClipboardCheckIcon size={20} />, path: "/admin/staff-internal/quality-control" },
            ],
            manajemenMember: [
                { id: 1, label: 'Data Customer', icon: <UsersRoundIcon size={20} />, path: "/admin/manajemen-customer" },
            ]
        }
    ]

    const { sidebarStatus, sidebarToggle } = useSidebar()

    const pathname = usePathname()
    const router = useRouter()
    const menu = MenuListData[0]
    const staffInternal = MenuListData[0].staffInternal
    const support = MenuListData[0].support
    const manajemenPengguna = MenuListData[0].manajemenMember

    const [indexSidebarMenu, setIndexSidebarMenu] = useState<number>(0)



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

    // Logout
    const handleLogout = async () => {
        await logout()
        router.push("/layanan")
        router.refresh()
    }



    return (
        <>
            <div id="overlay" className={`fixed top-0 right-0 w-full h-full bg-[#00000070] transition  ease-in-out ${sidebarStatus ? "z-35 flex" : " hidden "}`} onClick={() => sidebarToggle(false)} />

            <aside className={clsx(
                "fixed left-0 top-0 h-full pb-8 w-70 bg-white border-r border-(--border) z-40 transition-transform ",
                sidebarStatus ? "translate-x-0 duration-300" : "-translate-x-full duration-500",
                "md:translate-x-0"
            )}>
                {/* Logo */}
                <div className='flex flex-row items-center justify-center gap-4 w-full h-22.5 shrink-0 border-b border-(--border) rounded-lg'>
                    <div className="bg-(--primary) size-fit px-2 py-1 text-white rounded-lg">
                        <FootprintsIcon size={24} />
                        {/* <Image /> */}
                    </div>
                    <h1 className="text-base sm:text-xl font-[poppins] font-semibold">ShoeCare</h1>
                </div>

                {/* Menu */}
                <div className="p-5 flex w-full h-[calc(100vh-180px)] sm:h-[calc(100vh-90px)] flex-col gap-4 overflow-y-auto">
                    <p className="text-sm text-(--secondary) font-[inter] select-none">
                        Menu {props.userRole == "customer" ? "member" : props.userRole || "Guest"}
                    </p>

                    {/* Parsing data list */}
                    <div className="w-full">
                        {GetMenuItems().map((i, idx) =>
                            <ul key={idx}>
                                <li className={`p-4 text-(--secondary) font-[inter] font-semibold text-xs sm:text-base rounded-lg cursor-pointer select-none hover:text-black ${pathname == i.path ? "bg-(--muted) text-black" : ''}`} onClick={() => { handleClickMenu(i.label, props.userRole, i.path); sidebarToggle(false) }}><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
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
                                            <li className={`p-4 text-(--secondary) font-[inter] font-semibold text-xs sm:text-base rounded-lg cursor-pointer select-none hover:text-black ${pathname == i.path ? "bg-(--muted) text-black" : ''}`} onClick={() => { handleClickMenu(i.label, props.userRole, i.path); sidebarToggle(false) }}><span className="flex flex-row items-center gap-3 shrink-0">{i.icon} {i.label}</span></li>
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
                                            <li className={`p-4 text-(--secondary) font-[inter] font-semibold text-xs sm:text-base rounded-lg cursor-pointer select-none hover:text-black ${pathname == i.path ? "bg-(--muted) text-black" : ''}`} onClick={() => { handleClickMenu(i.label, props.userRole, i.path); sidebarToggle(false) }}><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                    )}
                    <div className="border-t border-(--border) w-full pt-4">
                        {support.map((i, idx) =>
                            <ul key={idx} className="flex flex-col gap-2">
                                <li className="px-4 py-2 hover:bg-(--muted) text-(--secondary) font-[inter] font-semibold text-xs select-none sm:text-base rounded-lg cursor-pointer hover:text-black"><span className="flex flex-row items-center gap-3 shrink-0" >{i.icon} {i.label}</span></li>
                            </ul>
                        )}
                    </div>

                    {/* Logout */}
                    {props.userId && (
                        <div className="border-t border-(--border) pt-4 p-4 select-none cursor-pointer" onClick={handleLogout}>
                            <span className="text-[tomato] flex flex-row gap-3 items-center"><LogOutIcon size={18} /> <p className="font-[inter] font-semibold text-xs sm:text-base ">Logout</p></span>
                        </div>
                    )}
                </div>
            </aside>
        </>

    )
}

export default Sidebar
