import Link from "next/link";

const Navbar = () => {
    return (
        <div className='fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-white bg-white border-b border-gray-300 text-black px-6 sm:px-16'>
            <div>
                <Link href="/">
                    <h1 className="text-sm sm:text-base font-semibold">ShoeCare</h1>
                </Link>
            </div>
            <div>
                <Link href="/auth">
                    <button className='bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-sm font-bold py-2 px-4 rounded-md transition duration-300 cursor-pointer'>
                        Login
                    </button>
                </Link>
            </div>
        </div>
    )
}

export default Navbar