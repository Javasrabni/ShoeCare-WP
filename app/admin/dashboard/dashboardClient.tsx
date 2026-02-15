"use client"
import Sidebar from '@/components/admin/sidebar/sidebar'

interface DashboardType {
    userRole: string
    userName?: string
    userId: string
}

const DashboardClient = (props: DashboardType) => {
    return (
        <div className=''>
            <Sidebar userRole={props.userRole} userId={props.userId} />
            <p>ADMIN</p>
        </div>
    )
}

export default DashboardClient
