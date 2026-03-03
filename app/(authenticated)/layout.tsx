"use client"

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        return null // Will redirect
    }

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Sidebar />
            <div className="flex flex-col md:pl-64 min-h-screen transition-all duration-300 ease-in-out">
                <Header />
                <main className="flex-1 p-6 md:p-8 pt-6 animate-fade-in">
                    <div className="container-wide">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
