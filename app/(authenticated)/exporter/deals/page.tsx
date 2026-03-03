"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/StatusBadge"

export default function MyDealsPage() {
    const router = useRouter()
    const [deals, setDeals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        async function fetchDeals() {
            try {
                const res = await fetch('/api/deals')
                if (res.ok) {
                    const data = await res.json()
                    setDeals(data.deals || [])
                }
            } catch (error) {
                console.error("Failed to fetch deals", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDeals()
    }, [])

    const filteredDeals = deals.filter(deal =>
        (deal.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.buyerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.productDetails || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Trade Deals</h1>
                    <p className="text-slate-500">Manage your export transactions and track their status.</p>
                </div>
                <Button
                    className="bg-emerald-700 hover:bg-emerald-800"
                    onClick={() => router.push('/exporter/deals/new')}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Deal
                </Button>
            </div>

            <Card>
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search deals..."
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Future: Add Filter dropdown */}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Deal ID</th>
                                    <th className="px-6 py-3 font-medium">Buyer</th>
                                    <th className="px-6 py-3 font-medium">Product</th>
                                    <th className="px-6 py-3 font-medium">Value</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDeals.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            {searchTerm ? 'No deals found matching your search.' : 'No deals created yet.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDeals.map((deal) => (
                                        <tr key={deal.id} className="bg-white hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {deal.id.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {deal.buyerEmail}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]" title={deal.productDetails}>
                                                {deal.productDetails}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {deal.currency} {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(deal.price)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={deal.status} type="deal" />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => router.push(`/exporter/deals/${deal.id}`)}
                                                >
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
