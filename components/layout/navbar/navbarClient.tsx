"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from 'next/image'
import { MenuIcon, TrophyIcon, IdCardLanyardIcon, ChevronRightIcon, Layers3Icon, FootprintsIcon } from "lucide-react";
import Notification from "@/components/UI/navbar/notification/notification";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useSidebar } from '@/app/context/sidebar/sidebarContext';

interface NavbarClientProps {
    guestUser: boolean; // !Guest = LoggedIn
    userName: string;
    role: string;

}

const NavbarClient = (props: NavbarClientProps) => {
    const { sidebarStatus, sidebarToggle } = useSidebar()
    console.log(sidebarStatus)

    const pathname = usePathname()  // contoh: "/admin/manajemen-order/detail"
    // Split path jadi array, filter agar kosong hilang
    const pathSegments = pathname.split('/').filter(segment => segment.length > 0)

    // State to control visibility of Auth button
    const showAuthButton = pathname !== '/auth';

    const userPath = pathname.startsWith('/layanan')
    const adminPath = pathname.startsWith('/admin')
    const authPath = pathname.startsWith('/auth')


    // Menghindari konfilk z-index saat transisi opacity
    const [navbarZ, setNavbarZ] = useState("z-30");
    useEffect(() => {
        if (sidebarStatus) {
            setNavbarZ("-z-5");
        } else {
            const delay = setTimeout(() => {
                setNavbarZ("z-30");
            }, 530); // samakan dengan durasi transition overlay

            return () => clearTimeout(delay);
        }
    }, [sidebarStatus]);


    return (
        <>
            {/* Open sidebar toggle */}
            {(userPath || adminPath) && (

                <div className="flex fixed bottom-8 right-8 z-150 md:hidden bg-(--primary) text-white rounded-lg shadow-xs" onClick={() => sidebarToggle(prev => !prev)}>
                    <button className="size-10 sm:size-10 rounded-lg flex items-center justify-center cursor-pointer" >
                        <MenuIcon size={16} />
                    </button>
                </div>
            )}

            <div id="navbarIndex" className={clsx(`sticky ${navbarZ} top-0 left-0 w-full h-22.5 flex items-center justify-between  bg-white border-b border-(--border) text-black `, sidebarStatus ? 'py-4 pr-6 sm:pr-8 pl-6 md:pl-78' : 'py-4 pr-6 sm:pr-8 pl-6 md:pl-8', (userPath || adminPath) && "md:pl-78")}>



                {/* Logo identity */}
                <div className={clsx("flex flex-row items-center justify-center gap-4  h-22.5 pr-2 sm:pr-8", (userPath || adminPath) && "md:hidden")}>
                    <div className="bg-(--primary) size-fit px-2 py-1 text-white rounded-lg">
                        <FootprintsIcon size={24} />
                        {/* <Image /> */}
                    </div>
                    <h1 className="text-base sm:text-xl font-[poppins] font-semibold">ShoeCare</h1>
                </div>

                {/* <div className={clsx("text-(--secondary) flex-row gap-3 items-center hidden", (userPath || adminPath) && "hidden md:flex")}>
                    {pathSegments.map((segment, idx) => {
                        // Buat label bisa diubah, contoh ubah dash jadi spasi, kapitalisasi
                        const label = segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

                        // Build link ke segmen saat ini
                        const href = '/' + pathSegments.slice(0, idx + 1).join('/')

                        // Tampilkan separator hanya jika bukan segmen terakhir
                        const isLast = idx === pathSegments.length - 1

                        return (
                            <div key={href} className="flex items-center text-sm gap-3 select-none">
                                {!isLast ? (
                                    <Link href={props.role === "admin" ? "/admin" : '/layanan'} className="hover:underline">
                                        <p></p>
                                    </Link>
                                ) : (
                                    <p>{label}</p>
                                )}

                                {!isLast && <ChevronRightIcon size={16} />}
                            </div>
                        )
                    })}

                </div> */}
                <div>
                    <p></p>
                </div>

                <div>
                    {showAuthButton && (
                        <>
                            {/* Navbar untuk user yang telah login */}
                            {props.guestUser === false ? (
                                <div className="flex w-fit gap-2 sm:gap-8 items-center">

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
                                                <p className="hidden sm:flex text-xs font-[inter] font-regular capitalize text-(--secondary)">{props.userName}</p>
                                            </div>

                                            {/* Photo Profile */}
                                            <div className="size-8 md:size-12 shrink-0 rounded-full bg-(--primary)">
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
                </div>
            </div>
        </>

    )
}

export default NavbarClient