"use client"

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, User } from 'lucide-react'

export default function BuyerSettingsPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch('/api/auth/me')
                if (res.ok) {
                    const data = await res.json()
                    setUser(data.user)
                }
            } catch (error) {
                console.error("Failed to fetch user", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    if (!user) {
        return <div className="text-center py-10">User not found</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
                <p className="text-slate-500">Manage your profile and company information.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-slate-400" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Your login details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <Input value={user.email} disabled className="mt-1 bg-slate-50" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Role</label>
                            <Input value={user.role} disabled className="mt-1 bg-slate-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-slate-400" />
                            Company Profile
                        </CardTitle>
                        <CardDescription>Your business identity on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Company Name</label>
                            <Input
                                defaultValue={user.buyerProfile?.companyName || 'Not Set'}
                                disabled
                                className="mt-1 bg-slate-50"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Appearance & Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                            <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                            <p className="text-xs text-slate-500">Receive updates about your purchases via email.</p>
                        </div>
                        <Button variant="outline" size="sm" disabled>Enabled</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
