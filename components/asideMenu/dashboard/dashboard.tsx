"use client"

import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"

interface DashboardProps {
    userId?: string
    userRole: string
}

export function Dashboard({ userId, userRole }: DashboardProps) {
    // const router = useRouter()
    // const [user, setUser] = useState(null)

    // useEffect(() => {
    //     async function getData() {
    //         try {
    //             const userFromHelper = await getUser()
    //             setUser(userFromHelper)

    //             if (userFromHelper?.role === "admin") {
    //                 return router.push('/admin/dashboard')
    //             }
    //         } catch (error) {
    //             console.error(error)
    //         }
    //     }

    //     getData()
    // }, [])

    return (
        <div>
            <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Minima provident dolor esse magni odit voluptas, necessitatibus dolorum blanditiis repellendus, enim ullam quos? Nostrum ex atque reiciendis nesciunt optio. Sunt, reiciendis!</p>
        </div>
    )

}

export function MemberDashboard() {
    return (
        <div><p>member dashboard</p></div>
    )
}

export function AdminDashboard() {
    return (
        <div><p>admin dashboard</p></div>
    )
}

// export function