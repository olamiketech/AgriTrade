"use client"

import { Users, DollarSign, FileText, Activity, AlertCircle, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function DashboardStat({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${color}-500`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
            </CardContent>
        </Card>
    )
}

export default function AdminDashboard() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Overview</h1>
                <p className="text-slate-500">Monitor platform health, verify users, and oversee trade activity.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStat
                    title="Pending Verifications"
                    value="3"
                    icon={Users}
                    color="amber"
                />
                <DashboardStat
                    title="Active Deals"
                    value="12"
                    icon={Activity}
                    color="blue"
                />
                <DashboardStat
                    title="Finance Requests"
                    value="5"
                    icon={DollarSign}
                    color="emerald"
                />
                <DashboardStat
                    title="Total Volume"
                    value="$4.2M"
                    icon={TrendingUp}
                    color="cyan"
                />
            </div>

            {/* Alert Section */}
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-4">
                <div className="bg-emerald-100 p-2 rounded-full">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-emerald-900">System Status: Healthy</h3>
                    <p className="text-sm text-emerald-700 mt-1">
                        All systems operational. AI Verification services are online and responding normally.
                    </p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                <Link href="/admin/users" className="block group">
                    <Card className="h-full hover:border-emerald-500/50 transition-colors cursor-pointer border-l-4 border-l-amber-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-amber-500" />
                                User Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 mb-4">
                                Review pending KYC documents and approve new exporter accounts.
                            </p>
                            <p className="text-xs font-medium text-emerald-600 group-hover:underline">Manage Users &rarr;</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/deals" className="block group">
                    <Card className="h-full hover:border-emerald-500/50 transition-colors cursor-pointer border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                Deal Oversight
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 mb-4">
                                Monitor trade deals, intervene in disputes, and track shipment milestones.
                            </p>
                            <p className="text-xs font-medium text-emerald-600 group-hover:underline">View Deals &rarr;</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/finance" className="block group">
                    <Card className="h-full hover:border-emerald-500/50 transition-colors cursor-pointer border-l-4 border-l-emerald-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                                Finance Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 mb-4">
                                Review and approve export finance applications from verified exporters.
                            </p>
                            <p className="text-xs font-medium text-emerald-600 group-hover:underline">Review Requests &rarr;</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Recent Global Activity (Placeholder) */}
            <Card>
                <CardHeader>
                    <CardTitle>Global Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { action: "New User Registered", user: "cocoa_exporter_ltd@gmail.com", time: "2 mins ago" },
                            { action: "Deal Created", user: "TR-2024-008", time: "15 mins ago" },
                            { action: "Document Verified", user: "Bill of Lading for TR-2024-004", time: "1 hour ago" },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{log.action}</p>
                                        <p className="text-xs text-slate-500">{log.user}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">{log.time}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
