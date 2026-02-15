import { getUser } from '@/lib/auth'
import DashboardClient from './dashboardClient'

const Page = async () => {
  const user = await getUser()
  const userId = user?._id.toString()
  
  return (
    <div>
      <DashboardClient userRole={user?.role} userId={userId} />
    </div>
  )
}

export default Page
