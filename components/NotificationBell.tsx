"use client"

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'

// Simple type for notification
interface Notification {
    id: string
    title: string
    message: string
    type: string
    read: boolean
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e)
        } finally {
            setLoading(false)
        }
    }

    // Effect to poll or fetch on mount
    useEffect(() => {
        fetchNotifications()

        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const [isOpen, setIsOpen] = useState(false)
    const unreadCount = notifications.filter((n: any) => !n.read).length

    // Close dropdown when clicking outside
    useEffect(() => {
        const close = () => setIsOpen(false)
        if (isOpen) window.addEventListener('click', close)
        return () => window.removeEventListener('click', close)
    }, [isOpen])

    return (
        <div className="relative">
            <div
                className="cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors relative"
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900">Notifications</span>
                        <span className="text-xs text-gray-500">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-xs text-gray-500">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">No notifications</div>
                        ) : (
                            <ul>
                                {notifications.map((n) => (
                                    <li key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message || "No content"}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
