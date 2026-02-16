"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface DashboardProps {
    userId: string | object
    userRole: string
}

export function Dashboard({ userId, userRole }: DashboardProps) {
    const router = useRouter()

    useEffect(() => {
        if (userRole === "admin") {
            router.replace("/admin/dashboard")
        }
    }, [userRole, router])

    return (
        <div>
            <p>ini adalah dashboard untuk guest atau member</p>
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