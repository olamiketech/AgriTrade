"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import {
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Bell
} from 'lucide-react'

import NotificationBell from './NotificationBell'

export default function Navbar() {
    const { user, logout } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    return (
        <nav className="bg-white/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 border-b border-slate-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8">
                                <Image
                                    src="/logo.png"
                                    alt="AgriTrade Secure"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-xl font-bold text-slate-800 tracking-tight hidden sm:inline-block">
                                AgriTrade
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {user ? (
                            <>
                                <NotificationBell />

                                {/* User Menu Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center space-x-2 pl-3 pr-2 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 hidden lg:block">Account</span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="py-1">
                                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{user.role.toLowerCase()}</p>
                                                </div>
                                                <Link
                                                    href={
                                                        user.role === 'ADMIN'
                                                            ? '/admin'
                                                            : user.role === 'EXPORTER'
                                                                ? '/exporter'
                                                                : '/buyer'
                                                    }
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    <span>Dashboard</span>
                                                </Link>
                                                <div className="border-t border-slate-100 my-1"></div>
                                                <button
                                                    onClick={async () => {
                                                        setUserMenuOpen(false)
                                                        await logout()
                                                    }}
                                                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="text-sm font-medium bg-emerald-700 text-white px-4 py-2 rounded-md hover:bg-emerald-800 transition-colors shadow-sm"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-200 bg-white">
                    <div className="px-4 py-3 space-y-3">
                        {user ? (
                            <>
                                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900">{user.email}</div>
                                        <div className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</div>
                                    </div>
                                </div>
                                <Link
                                    href={user.role === 'ADMIN' ? '/admin' : user.role === 'EXPORTER' ? '/exporter' : '/buyer'}
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>Dashboard</span>
                                </Link>
                                <button
                                    onClick={async () => {
                                        setMobileMenuOpen(false)
                                        await logout()
                                    }}
                                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Link
                                    href="/login"
                                    className="block w-full text-center px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="block w-full text-center px-3 py-2 text-sm font-medium bg-emerald-700 text-white rounded-md hover:bg-emerald-800"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}

