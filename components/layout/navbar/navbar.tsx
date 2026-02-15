import NavbarClient from "./navbarClient";
import { getUser } from "@/lib/auth";

const Navbar = async () => {
    const user = await getUser();
    console.log(user)
    return (
        <>
            <NavbarClient guestUser={user?.isGuest} userName={user?.name} role={user?.role}/>
        </>
    )
}

export default Navbar