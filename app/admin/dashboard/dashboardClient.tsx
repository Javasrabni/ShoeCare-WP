
import Sidebar from '@/components/admin/sidebar/sidebar'

interface DashboardType {
    userRole: string
    userName?: string
}

const DashboardClient = (props: DashboardType) => {
    return (
        <div>
            <Sidebar userRole={props.userRole} />

        </div>
    )
}

export default DashboardClient
