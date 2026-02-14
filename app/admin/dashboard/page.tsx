import { getUser } from '@/lib/auth'
import DashboardClient from './dashboardClient'

const Page = async () => {
  const user = await getUser()
  return (
    <div>
      <DashboardClient userRole={user?.role} />
    </div>
  )
}

export default Page
