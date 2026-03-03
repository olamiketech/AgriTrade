"use client"

import { FileText, DollarSign, CheckCircle, Clock, TrendingUp, Package, ArrowUpRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // REPLACED: Removing unused import that caused build error
import { StatusBadge } from "@/components/StatusBadge"

// Reusable Stat Component
function DashboardStat({ title, value, icon: Icon, trend, trendUp }: { title: string, value: string, icon: any, trend?: string, trendUp?: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <p className={`text-xs ${trendUp ? 'text-emerald-600' : 'text-slate-500'} flex items-center mt-1`}>
                        {trendUp && <ArrowUpRight className="h-3 w-3 mr-1" />}
                        {trend}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

export default function ExporterDashboard() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Overview of your trade activity and financial status.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/exporter/finance">
                        <Button variant="outline">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Request Finance
                        </Button>
                    </Link>
                    <Link href="/exporter/deals/new">
                        <Button className="bg-emerald-700 hover:bg-emerald-800">
                            <Plus className="mr-2 h-4 w-4" />
                            New Trade Deal
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStat
                    title="Active Deals"
                    value="3"
                    icon={FileText}
                    trend="+1 from last month"
                    trendUp={true}
                />
                <DashboardStat
                    title="Pending Payment"
                    value="$124,500"
                    icon={Clock}
                    trend="Due in 5 days"
                />
                <DashboardStat
                    title="Completed Trades"
                    value="12"
                    icon={CheckCircle}
                    trend="Lifetime total"
                />
                <DashboardStat
                    title="Export Volume"
                    value="$2.4M"
                    icon={TrendingUp}
                    trend="+12% YoY"
                    trendUp={true}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Deals Table */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Deals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[
                                { id: "TR-2024-001", buyer: "Global Foods Ltd", amount: "$45,000", status: "In Transit", date: "2024-02-15" },
                                { id: "TR-2024-002", buyer: "UK Retailers", amount: "$12,500", status: "Pending Payment", date: "2024-02-14" },
                                { id: "TR-2024-003", buyer: "Hamburg Coffee", amount: "$89,000", status: "Customs Cleared", date: "2024-02-10" },
                            ].map((deal) => (
                                <div key={deal.id} className="flex items-center">
                                    <div className="ml-4 space-y-1 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium leading-none">{deal.buyer}</p>
                                            <div className="text-sm font-medium">{deal.amount}</div>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-muted-foreground">{deal.id} • {deal.date}</p>
                                            <div className={`text-xs px-2 py-0.5 rounded-full ${deal.status === 'Pending Payment' ? 'bg-amber-100 text-amber-700' :
                                                deal.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {deal.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / Notifications */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Action Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="bg-amber-100 p-2 rounded-full">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Upload Bill of Lading</p>
                                    <p className="text-xs text-slate-500 mt-1">Order #TR-2024-002 requires documentation.</p>
                                    <Button variant="link" className="h-auto p-0 text-emerald-600 text-xs mt-2">Upload now</Button>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Sign Contract</p>
                                    <p className="text-xs text-slate-500 mt-1">Pending signature for Deal #TR-2024-004.</p>
                                    <Button variant="link" className="h-auto p-0 text-emerald-600 text-xs mt-2">Review & Sign</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
