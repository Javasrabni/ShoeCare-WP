"use client"

import { useEffect, useState } from "react"
import { wsManager, playNotificationSound } from "@/lib/websocket"
import { toast } from "sonner"
import { BellIcon, PackageIcon, TruckIcon, CheckCircleIcon } from "lucide-react"

interface Notification {
    id: string
    type: 'new_order' | 'order_assigned' | 'status_update' | 'system'
    title: string
    message: string
    timestamp: Date
    read: boolean
}

export default function RealtimeNotifications({ userRole }: { userRole: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        // Subscribe ke berbagai event
        const unsubNewOrder = wsManager.subscribe('new_order', (data) => {
            if (userRole === 'admin') {
                playNotificationSound('new_order');
                showNotification({
                    id: Date.now().toString(),
                    type: 'new_order',
                    title: 'Pesanan Baru!',
                    message: `Order ${data.orderNumber} dari ${data.customerName}`,
                    timestamp: new Date(),
                    read: false
                });
            }
        });

        const unsubAssigned = wsManager.subscribe('order_assigned', (data) => {
            if (userRole === 'courier') {
                playNotificationSound('assigned');
                showNotification({
                    id: Date.now().toString(),
                    type: 'order_assigned',
                    title: 'Order Ditugaskan!',
                    message: `Anda ditugaskan untuk order ${data.orderNumber}`,
                    timestamp: new Date(),
                    read: false
                });
            }
        });

        const unsubStatus = wsManager.subscribe('status_update', (data) => {
            playNotificationSound('completed');
            showNotification({
                id: Date.now().toString(),
                type: 'status_update',
                title: 'Status Diperbarui',
                message: `Order ${data.orderNumber} sekarang ${data.status}`,
                timestamp: new Date(),
                read: false
            });
        });

        return () => {
            unsubNewOrder();
            unsubAssigned();
            unsubStatus();
        };
    }, [userRole]);

    const showNotification = (notif: Notification) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show toast
        toast.custom((id) => (
            <div className="animate-enter max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
                <div className="flex-1 p-4">
                    <div className="flex items-start">
                        <div className="shrink-0 pt-0.5">
                            {notif.type === 'new_order' && <PackageIcon className="h-6 w-6 text-blue-500" />}
                            {notif.type === 'order_assigned' && <TruckIcon className="h-6 w-6 text-orange-500" />}
                            {notif.type === 'status_update' && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
                        </div>
                        <div className="ml-3 w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                            <p className="mt-1 text-sm text-gray-500">{notif.message}</p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-200">
                    <button
                        onClick={() => toast.dismiss(id)}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    return (
        <div className="relative">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <BellIcon size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}