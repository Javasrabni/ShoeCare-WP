"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from 'next/image'
import { MenuIcon, TrophyIcon, IdCardLanyardIcon } from "lucide-react";
import Notification from "@/components/UI/navbar/notification/notification";
import clsx from "clsx";

interface NavbarClientProps {
    guestUser: boolean; // !Guest = LoggedIn
    userName: string;
    role: string;

}

const NavbarClient = (props: NavbarClientProps) => {
    // State to control visibility of Auth button
    const pathname = usePathname();
    const showAuthButton = pathname !== '/auth';

    return (
        <div className='sticky z-50 top-0 left-0 w-full h-22.5 flex items-center justify-between py-4 bg-white border-b border-(--border) text-black px-6 sm:px-8'>
            <div>
                {props.guestUser == false ? (
                    <button className="size-8 sm:ize-10 border border-default-medium rounded-lg flex items-center justify-center cursor-pointer">
                        <MenuIcon size={16} />
                    </button>
                ) : (
                    <Link href="/">
                        <h1 className="text-sm sm:text-base font-semibold">ShoeCare</h1>
                    </Link>
                )}
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
    )
}

export default NavbarClient