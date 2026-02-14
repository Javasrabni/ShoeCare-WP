
import Sidebar from '@/components/admin/sidebar/sidebar'

interface DashboardType {
    userRole: string
    userName?: string
}

const DashboardClient = (props: DashboardType) => {
    return (
        <div className='px-6 sm:px-16 py-8'>
            <Sidebar userRole={props.userRole} />
            <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis inventore reiciendis dolorum dolore libero, molestias voluptas praesentium eos sapiente consectetur perspiciatis maiores incidunt recusandae excepturi a beatae optio atque amet.</p>
        </div>
    )
}

export default DashboardClient
