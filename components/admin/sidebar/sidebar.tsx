import React from 'react'
import Image from 'next/image'

const Sidebar = () => {
    return (
        <aside className="w-[280px] bg-white px-5 flex flex-col items-center justify-beetween">
            {/* Logo */}
            <div>
                <div>
                    <Layers3Icon size={16} />
                </div>
                {/* <Image /> */}
            </div>

        </aside>
    )
}

export default Sidebar
