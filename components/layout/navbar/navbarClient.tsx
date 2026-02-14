"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from 'next/image'

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
        <div className='sticky z-50 top-0 left-0 w-full flex items-center justify-between py-4 bg-white bg-white border-b border-gray-300 text-black px-6 sm:px-16'>
            <div>
                <Link href="/">
                    <h1 className="text-sm sm:text-base font-semibold">ShoeCare</h1>
                </Link>
            </div>
            <div>
                {showAuthButton && (
                    <>
                        {props.guestUser ? (
                            <Link href="/auth">
                                <button className='bg-blue-100 font-[inter] hover:bg-blue-100 text-blue-800 text-xs sm:text-sm sm:text-sm font-semibold py-2 px-4 rounded-lg transition duration-300 cursor-pointer'>
                                    Login
                                </button>
                            </Link>
                        ) : (
                            <div className="flex w-fit gap-8 items-center">
                                <p className="text-xs sm:text-sm font-[inter] text-neutral-700 font-semibold capitalize">{props.role === "customer" ? 'Member Berbayar' : props.role}</p>
                                <Link href="/profil">
                                    <div className='flex items-center justify-center gap-4'>
                                        <p className="text-xs sm:text-sm font-[inter] text-neutral-700">{props.userName}</p>
                                        <div className="w-8 h-8 rounded-full bg-blue-200">
                                            {/* <Image src={} /> */}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default NavbarClient