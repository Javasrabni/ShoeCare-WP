import { getUser } from '@/lib/auth'

const Page = async () => {
  const user = await getUser()
  const userId = user?._id.toString()
  
  return (
    <div>
      <p>admin page</p>
    </div>
  )
}

export default Page
