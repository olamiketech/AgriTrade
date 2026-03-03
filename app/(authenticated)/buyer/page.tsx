"use client"

import { FileText, Package, CheckCircle, Clock, TrendingUp, ArrowUpRight, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function DashboardStat({ title, value, icon: Icon, trend, trendUp }: { title: string, value: string, icon: any, trend?: string, trendUp?: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
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

export default function BuyerDashboard() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Buyer Dashboard</h1>
                    <p className="text-slate-500">Track incoming shipments and manage trade approvals.</p>
                </div>
                <div>
                    <Link href="/buyer/deals">
                        <Button className="bg-emerald-700 hover:bg-emerald-800">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Browse Marketplace
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStat
                    title="Pending Approvals"
                    value="2"
                    icon={Clock}
                    trend="Requires attention"
                    trendUp={false}
                />
                <DashboardStat
                    title="In Transit"
                    value="5"
                    icon={Package}
                    trend="Arriving this week"
                    trendUp={true}
                />
                <DashboardStat
                    title="Total Purchases"
                    value="$1.2M"
                    icon={TrendingUp}
                    trend="+8% from last month"
                    trendUp={true}
                />
                <DashboardStat
                    title="Completed Deals"
                    value="18"
                    icon={CheckCircle}
                    trend="Lifetime total"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity / Deals */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[
                                { id: "TR-2024-005", exporter: "Coffee Co. Brazil", status: "Awaiting Approval", date: "Today", amount: "$32,000" },
                                { id: "TR-2024-004", exporter: "Vietnam Spices", status: "In Transit", date: "Yesterday", amount: "$15,400" },
                                { id: "TR-2024-001", exporter: "Ghana Cocoa Ltd", status: "Completed", date: "Feb 10", amount: "$55,000" },
                            ].map((deal, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <FileText className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div className="ml-4 space-y-1 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium leading-none text-slate-900">{deal.exporter}</p>
                                            <div className="text-sm font-medium text-slate-900">{deal.amount}</div>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-slate-500">{deal.id} • {deal.date}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${deal.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    deal.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-amber-100 text-amber-700'
                                                }`}>
                                                {deal.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications / Quick Actions */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <div className="bg-white p-1.5 rounded-full shadow-sm">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Action Required</p>
                                    <p className="text-xs text-slate-600 mt-0.5">Deal #TR-2024-005 requires your acceptance of terms.</p>
                                    <Button variant="link" className="h-auto p-0 text-amber-700 text-xs mt-1.5 font-medium hover:text-amber-800">
                                        Review Terms
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="bg-white p-1.5 rounded-full shadow-sm">
                                    <Package className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Shipment Arriving</p>
                                    <p className="text-xs text-slate-600 mt-0.5">Shipment for #TR-2024-004 is expected to arrive at port tomorrow.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
