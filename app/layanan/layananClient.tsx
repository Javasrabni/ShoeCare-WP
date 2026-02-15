"use client"
import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/sidebar/sidebar";
import { Dashboard } from "@/components/asideMenu/dashboard/dashboard";
import DaftarPesanan from "@/components/asideMenu/daftar_pesanan/daftarPesanan";
import PesananSaya from "@/components/asideMenu/pesanan_saya/pesananSaya";
import RiwayatTransaksi from "@/components/asideMenu/riwayat_transaksi/riwayatTransaksi";

interface LayananType {
    userRole: string
    userName: string
    userId: string
}
const LayananClient = (props: LayananType) => {
    const [activeMenu, setActiveMenu] = useState<{
        menu: string; userRole: string
    }>({ menu: "Dashboard", userRole: 'admin' })

    // Get data from sidebar
    const handleMenuClick = (menu: string, userRole: string) => {
        setActiveMenu({ menu, userRole })
    }

    return (
        <div className='px-6 sm:px-16 py-8 ml-70'>
            <Sidebar onMenuClick={handleMenuClick} userRole={props.userRole} userId={props.userId} />
            <div>
                {activeMenu.menu === "Dashboard" && (
                    <Dashboard userRole={activeMenu.userRole} />
                )}
                {activeMenu.menu === "Daftar Pesanan" && (
                    <DaftarPesanan />
                )}
                {activeMenu.menu === "Pesanan Saya" && (
                    <PesananSaya />
                )}
                {activeMenu.menu === "Riwayat Transaksi" && (
                    <RiwayatTransaksi />
                )}
            </div>
        </div>
    )
}

export default LayananClient
