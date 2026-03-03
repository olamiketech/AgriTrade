"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/StatusBadge"

export default function BuyerDealsPage() {
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
                    setDeals(data.deals)
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
        deal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.productDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.exporter?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Purchases</h1>
                    <p className="text-slate-500">Manage your trade agreements and incoming shipments.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by Deal ID, product, or exporter..."
                                className="pl-9 bg-slate-50 border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Future: Add Filter logic here */}
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Deal ID</th>
                                    <th className="px-6 py-4 font-medium">Product</th>
                                    <th className="px-6 py-4 font-medium">Exporter</th>
                                    <th className="px-6 py-4 font-medium">Value</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Delivery</th>
                                    <th className="px-6 py-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-emerald-600 mr-2"></div>
                                            Loading purchases...
                                        </td>
                                    </tr>
                                ) : filteredDeals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Search className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-900 font-medium">No deals found</p>
                                                <p className="text-slate-500 text-sm">We couldn't find any deals matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDeals.map((deal) => (
                                        <tr key={deal.id} className="bg-white hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                #{deal.id.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={deal.productDetails}>
                                                {deal.productDetails}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {deal.exporter?.companyName || deal.exporter?.email?.split('@')[0] || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {deal.currency} {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(deal.price)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={deal.status} type="deal" />
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium text-xs">
                                                {deal.deliveryStatus}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => router.push(`/buyer/deals/${deal.id}`)}
                                                >
                                                    View Details
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
