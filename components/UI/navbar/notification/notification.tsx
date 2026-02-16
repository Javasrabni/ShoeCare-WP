import { BellIcon, SearchIcon } from 'lucide-react'

interface UIInfo {
    withSearch?: boolean
    withNotification: boolean
    withBorderRight?: boolean
}

const Notification = (props: UIInfo) => {
    return (
        <div className={`flex flex-row items-center gap-3 pr-4 ${props.withBorderRight && "border-r border-(--border)"}`}>
            {props.withSearch && (
                <div className="size-12 rounded-lg text-(--secondary) border border-(--border) cursor-pointer items-center justify-center hover:bg-neutral-100 hidden sm:flex">
                    <SearchIcon size={16} />
                </div>
            )}
            {props.withNotification && (
                <div className="size-12 rounded-lg border border-(--border) text-(--secondary) cursor-pointer hidden sm:flex items-center justify-center hover:bg-neutral-100">
                    <BellIcon size={16} />
                </div>
            )}
        </div>
    )
}

export default Notification
