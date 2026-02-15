"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from 'next/image'
import { MenuIcon, TrophyIcon, IdCardLanyardIcon, ChevronRightIcon } from "lucide-react";
import Notification from "@/components/UI/navbar/notification/notification";
import clsx from "clsx";
import { useSidebar } from '@/app/context/sidebar/sidebarContext';

interface NavbarClientProps {
    guestUser: boolean; // !Guest = LoggedIn
    userName: string;
    role: string;

}

const NavbarClient = (props: NavbarClientProps) => {
    const { sidebarStatus, sidebarToggle } = useSidebar()

    const pathname = usePathname()  // contoh: "/admin/manajemen-order/detail"
    // Split path jadi array, filter agar kosong hilang
    const pathSegments = pathname.split('/').filter(segment => segment.length > 0)

    // State to control visibility of Auth button
    const showAuthButton = pathname !== '/auth';

    return (
        <div className='flex-1'>
            {/* Open sidebar toggle */}
            <div className="flex fixed bottom-8 right-8 z-50 md:hidden">
                <button className="size-8 sm:size-10 border border-default-medium rounded-lg flex items-center justify-center cursor-pointer bg-white" onClick={() => sidebarToggle()}>
                    <MenuIcon size={16} />
                </button>
            </div>

            <div className={clsx("sticky z-30 top-0 left-0 w-full h-22.5 flex items-center justify-between py-4 bg-white border-b border-(--border) text-black px-6 sm:px-8 transition duration-300 ease-in-out", sidebarStatus ?'ml-70' : "ml-0")}>



                {/* Logo identity */}
                <div className="flex flex-row gap-3 items-center pr-12">
                    <Link href="/">
                        <h1 className="text-sm sm:text-base font-[poppins] font-semibold">ShoeCare</h1>
                    </Link>
                </div>

                <div className="text-(--secondary) flex flex-row gap-3 items-center">
                    {pathSegments.map((segment, idx) => {
                        // Buat label bisa diubah, contoh ubah dash jadi spasi, kapitalisasi
                        const label = segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

                        // Build link ke segmen saat ini
                        const href = '/' + pathSegments.slice(0, idx + 1).join('/')

                        // Tampilkan separator hanya jika bukan segmen terakhir
                        const isLast = idx === pathSegments.length - 1

                        return (
                            <div key={href} className="flex items-center text-sm gap-3 select-none">
                                {/* Jika bukan segment terakhir, jadikan link */}
                                {!isLast ? (
                                    <Link href={props.role === "admin" ? "/admin/dashboard" : '/layanan'} className="hover:underline">
                                        <p>Home</p>
                                    </Link>
                                ) : (
                                    <p>{label}</p>
                                )}

                                {!isLast && <ChevronRightIcon size={16} />}
                            </div>
                        )
                    })}

                </div>

                <div>
                    {showAuthButton && (
                        <>
                            {/* Navbar untuk user yang telah login */}
                            {props.guestUser === false ? (
                                <div className="flex w-fit gap-8 items-center">

                                    <Notification withNotification withSearch withBorderRight />
                                    <Link href="/profil">
                                        <div className='flex items-center justify-center gap-3'>

                                            {/* User Information */}
                                            <div className="flex flex-col gap-1 text-right">

                                                {/* Role */}
                                                <span className="flex items-center justify-end gap-2 ">
                                                    {/* <div className="dot-pulse" /> */}
                                                    <p className={clsx("text-xs sm:text-sm font-[poppins] font-semibold capitalize ", { "text-green-600": props.role === 'admin', "text-yellow-500": props.role === "customer" })}>
                                                        {props.role === "customer" ? (
                                                            <span className="flex flex-row items-center gap-2">
                                                                <TrophyIcon size={16} /> Member
                                                            </span>
                                                        ) : (
                                                            <span className="flex flex-row items-center gap-1">
                                                                <IdCardLanyardIcon size={16} /> {props.role}
                                                            </span>
                                                        )}
                                                    </p>
                                                </span>

                                                {/* Username */}
                                                <p className="text-xs font-[inter] font-regular capitalize text-(--secondary)">{props.userName}</p>
                                            </div>

                                            {/* Photo Profile */}
                                            <div className="size-12 rounded-full bg-(--primary)">
                                                {/* <Image src={} /> */}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ) : (
                                // Navbar untuk yang belum login
                                <Link href="/auth">
                                    <button className='bg-blue-100 font-[inter] hover:bg-blue-100 text-blue-800 text-xs sm:text-sm font-semibold py-2 px-4 rounded-lg transition duration-300 cursor-pointer'>
                                        Login
                                    </button>
                                </Link>
                            )}
                        </>
                    )
                    }
                </div >
            </div >
        </div>
    )
}

export default NavbarClient