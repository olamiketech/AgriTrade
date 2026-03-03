"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DollarSign, Search, PlusCircle, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/StatusBadge"

export default function ExporterFinancePage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchRequests() {
            try {
                const res = await fetch('/api/finance')
                if (res.ok) {
                    const data = await res.json()
                    setRequests(data.requests || [])
                }
            } catch (error) {
                console.error("Failed to fetch requests", error)
            } finally {
                setLoading(false)
            }
        }
        fetchRequests()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance Requests</h1>
                    <p className="text-slate-500">Track your submitted applications for trade financing.</p>
                </div>
                {/* Future: Add 'New Finance Request' button linking to a creation page or modal */}
                <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm" disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Finance Request
                </Button>
            </div>

            <Card>
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search requests..."
                                className="pl-9 bg-white"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Request ID</th>
                                    <th className="px-6 py-3 font-medium">Associated Deal</th>
                                    <th className="px-6 py-3 font-medium">Requested Amount</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Notes</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No finance requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {req.id.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {req.trade ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{req.trade.id.substring(0, 8)}</span>
                                                        <StatusBadge status={req.trade.status} type="deal" className="scale-75 origin-left" />
                                                    </span>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                ${new Intl.NumberFormat('en-US').format(req.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={req.status} type="finance" />
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]" title={req.notes}>
                                                {req.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="hover:text-amber-700 hover:bg-amber-50">
                                                    View
                                                    <ExternalLink className="ml-2 h-3 w-3" />
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
