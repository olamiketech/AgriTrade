"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Filter, Search } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"

export default function AdminFinanceRequests() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/finance-requests')
            if (res.ok) {
                const data = await res.json()
                setRequests(data)
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const filteredRequests = filter === 'ALL' ? requests : requests.filter(r => r.status === filter)

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance Requests</h1>
                    <p className="text-slate-500">Review and adjudicate export finance applications.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'FINANCED', 'DECLINED'].map((tab) => (
                                <Button
                                    key={tab}
                                    variant={filter === tab ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilter(tab)}
                                    className={filter === tab ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                >
                                    {tab.replace('_', ' ')}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Exporter</th>
                                    <th className="px-6 py-4 font-medium">Deal Product</th>
                                    <th className="px-6 py-4 font-medium">Amount Req.</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading requests...</td>
                                    </tr>
                                ) : filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No finance requests found.</td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {req.exporter?.companyName || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {req.trade?.productDetails?.substring(0, 30)}...
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {req.currency} {new Intl.NumberFormat('en-US').format(req.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={req.status} type="finance" />
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                    Review
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
