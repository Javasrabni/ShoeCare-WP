"use client"
import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/sidebar/sidebar";
import { Dashboard } from "@/components/asideMenu/dashboard/dashboard";
import PesananSaya from "@/app/layanan/pesanan-saya/pesananSaya";
import LacakPesanan from "@/app/layanan/lacak-pesanan/lacakPesanan";

import RiwayatTransaksi from "@/app/layanan/riwayat-transaksi/riwayatTransaksi";
import clsx from "clsx";
import { useSidebar } from "../context/sidebar/sidebarContext";

interface LayananType {
    userRole: string
    userName: string
    userId: string
}
const LayananClient = (props: LayananType) => {
    const { sidebarStatus } = useSidebar()
    const [activeMenu, setActiveMenu] = useState<{
        menu: string; userRole: string
    }>({ menu: "Dashboard", userRole: 'admin' })

    // Get data from sidebar
    const handleMenuClick = (menu: string, userRole: string) => {
        setActiveMenu({ menu, userRole })
    }

    return (
        <div className={clsx("px-6 md:px-16 py-8 md:ml-70 transition duration-300 ease-in-out", sidebarStatus && "ml-0 md:ml-70")}>
            <Sidebar onMenuClick={handleMenuClick} userRole={props.userRole} userId={props.userId} />
            <div>
                {activeMenu.menu === "Dashboard" && (
                    <Dashboard userRole={activeMenu.userRole} userId={props.userId} />
                )}
                {activeMenu.menu === "Pesanan Saya" && (
                    <PesananSaya />
                )}
                {activeMenu.menu === "Riwayat Transaksi" && (
                    <RiwayatTransaksi />
                )}
                {activeMenu.menu === "Lacak Pesanan" && (
                    <LacakPesanan />
                )}
          
            </div>
        </div>
    )
}

export default LayananClient
