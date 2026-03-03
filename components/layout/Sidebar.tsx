"use client"

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
    LayoutDashboard,
    PlusCircle,
    FileText,
    Users,
    DollarSign,
    LogOut,
    Settings,
    ShieldCheck,
    Briefcase,
    TrendingUp,
    CreditCard
} from 'lucide-react'
import { Button } from "@/components/ui/button" // Assuming Button is used for logout
import clsx from 'clsx'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    if (!user) return null

    const exporterLinks = [
        { name: 'Dashboard', href: '/exporter', icon: LayoutDashboard },
        { name: 'New Trade Deal', href: '/exporter/deals/new', icon: PlusCircle },
        { name: 'My Deals', href: '/exporter/deals', icon: FileText },
        { name: 'Finance Requests', href: '/exporter/finance', icon: DollarSign },
        { name: 'Settings', href: '/exporter/settings', icon: Settings },
    ]

    const buyerLinks = [
        { name: 'Dashboard', href: '/buyer', icon: LayoutDashboard },
        { name: 'My Purchases', href: '/buyer/deals', icon: Briefcase },
        { name: 'Settings', href: '/buyer/settings', icon: Settings },
    ]

    const adminLinks = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Deal Oversight', href: '/admin/deals', icon: ShieldCheck },
        { name: 'Finance Requests', href: '/admin/finance', icon: DollarSign },
        { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
    ]

    const links = user.role === 'EXPORTER'
        ? exporterLinks
        : user.role === 'BUYER'
            ? buyerLinks
            : adminLinks

    return (
        <div className={clsx("flex flex-col w-64 bg-slate-50 border-r border-slate-200 h-screen fixed left-0 top-0 hidden md:flex", className)}>
            {/* Logo Section - Professional & Clean */}
            <div className="flex h-16 items-center px-6 bg-white border-b border-slate-200">
                <Link href="/" className="flex items-center space-x-3">
                    <div className="w-8 h-8">
                        <Image
                            src="/logo.png"
                            alt="AgriTrade Secure"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>
                    <span className="text-lg font-semibold text-slate-900 tracking-tight">
                        AgriTrade
                    </span>
                </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 flex flex-col gap-1 px-3 py-6 overflow-y-auto">
                <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Menu
                </div>
                {links.map((link) => {
                    const LinkIcon = link.icon
                    const isActive = pathname === link.href

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={clsx(
                                'group flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                                isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' // Clean active state
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm' // Subtle hover state
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <LinkIcon className={clsx(
                                    "h-5 w-5",
                                    isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                                )} />
                                <span>{link.name}</span>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* User Profile Section - Footer */}
            <div className="p-4 border-t border-slate-200 bg-white mt-auto">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium border border-slate-200 shrink-0">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate" title={user.email}>{user.email}</p>
                        <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={logout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}

