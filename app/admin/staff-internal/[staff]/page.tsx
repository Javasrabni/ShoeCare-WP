import { notFound } from "next/navigation"

type StaffProps = {
    params: Promise<{ staff: string }>
}

const allowedStaffParams = ["admin", "dropper", "courier", "technician", "quality-control"]

export default async function Page({ params }: StaffProps) {
    const { staff } = await params
    
    if (!allowedStaffParams.includes(staff)) {
        notFound()
    }
    return (
        <div>
            <p>{staff} Page</p>
        </div>
    )
}

