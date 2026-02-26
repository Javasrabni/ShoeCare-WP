import { notFound } from "next/navigation"
import PuterAIChat from "../../dashboard/puter"
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
            <PuterAIChat
                systemPrompt="Anda adalah customer service ShoeCare. Bantu jawab pertanyaan customer dengan ramah dan profesional dalam Bahasa Indonesia."
            />
        </div>
    )
}

