import Sidebar from "@/components/admin/sidebar/sidebar";

interface LayananType {
    userRole: string | null
    userName: string | null
}
const LayananClient = (props: LayananType) => {
    return (
        <div className='px-6 sm:px-16 py-8 ml-70'>
            <Sidebar userRole={props.userRole} />
            <p>Dashboard Page for User: {props.userName}</p>
        </div>
    )
}

export default LayananClient
