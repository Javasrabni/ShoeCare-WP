"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PilihLayananPage from "@/components/customer/pilih-layanan/pilihLayanan"

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
            <PilihLayananPage />
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