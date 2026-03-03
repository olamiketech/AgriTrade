"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowLeft, Building2, Package, FileText, DollarSign, Download, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { StatusBadge } from "@/components/StatusBadge"

export default function AdminDealDetail() {
    const { id } = useParams()
    const router = useRouter()
    const [deal, setDeal] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchDeal = async () => {
        try {
            const res = await fetch(`/api/deals/${id}`)
            if (res.ok) {
                const data = await res.json()
                setDeal(data.deal)
            }
        } catch (error) {
            console.error("Failed to fetch deal", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) fetchDeal()
    }, [id])

    const handleConfirmPayment = async () => {
        if (!confirm("Are you SURE you have verified the payment externally? This action tracks that funds are secured.")) return
        try {
            const res = await fetch(`/api/deals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentStatus: 'PAID_HELD',
                    status: 'PAID_HELD'
                })
            })
            if (res.ok) fetchDeal()
        } catch (err) { console.error(err) }
    }

    const handleUpdateStatus = async (newStatus: string) => {
        if (!confirm(`Are you sure you want to update status to ${newStatus}?`)) return
        try {
            const res = await fetch(`/api/deals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                fetchDeal()
            } else {
                const data = await res.json()
                alert(`Error: ${data.error}`)
            }
        } catch (err) { console.error(err); alert('Network error'); }
    }


    const handleVerifyExporter = async () => {
        if (!deal.exporter?.user?.id) return
        if (!confirm(`Are you sure you want to verify exporter ${deal.exporter.companyName}?`)) return

        try {
            const res = await fetch(`/api/users/${deal.exporter.user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationStatus: 'VERIFIED' })
            })

            if (res.ok) {
                fetchDeal()
            } else {
                const data = await res.json()
                alert(`Failed: ${data.error}`)
            }
        } catch (err) {
            console.error(err)
            alert("An error occurred")
        }
    }


    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
    if (!deal) return <div className="text-center py-12 text-slate-500">Deal not found</div>

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="pl-0 hover:bg-transparent hover:text-emerald-600 text-slate-500 mb-1"
                        onClick={() => router.push('/admin/deals')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Deals
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Deal #{deal.id.substring(0, 8).toUpperCase()}</h1>
                        <StatusBadge status={deal.status} type="deal" />
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* Confirm Payment -> PAID_HELD */}
                    {deal.paymentStatus !== 'PAID_HELD' && (deal.status === 'AWAITING_PAYMENT') && (
                        <Button
                            onClick={handleConfirmPayment}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm Payment Received
                        </Button>
                    )}

                    {/* Verification Actions */}
                    {(deal.status === 'CREATED' || deal.status === 'PENDING_VERIFICATION') && (
                        <div className="flex gap-2">
                            {/* New Verify Exporter Button */}
                            {deal.exporter?.user?.verificationStatus !== 'VERIFIED' && (
                                <Button
                                    onClick={handleVerifyExporter}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Verify Exporter
                                </Button>
                            )}

                            <Button
                                onClick={() => handleUpdateStatus('REJECTED')}
                                variant="destructive"
                            >
                                Reject
                            </Button>
                            <Button
                                onClick={() => handleUpdateStatus('ACCEPTED')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={deal.exporter?.user?.verificationStatus !== 'VERIFIED'}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve & invite Buyer
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-slate-400" />
                                Trade Specifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Product</dt>
                                    <dd className="mt-1 text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-md border border-slate-100">{deal.productDetails}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Quantity</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{deal.quantity}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Total Value</dt>
                                    <dd className="mt-1 text-sm font-bold text-slate-900">{deal.currency} {new Intl.NumberFormat('en-US').format(deal.price)}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Delivery Terms</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{deal.deliveryTerms}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Payment Status</dt>
                                    <dd className="mt-1">
                                        <StatusBadge status={deal.paymentStatus} type="payment" />
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-slate-400" />
                                Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="divide-y divide-slate-100 border border-slate-100 rounded-md overflow-hidden">
                                {deal.documents.length === 0 && (
                                    <li className="px-4 py-8 text-center text-slate-500 text-sm italic bg-slate-50">
                                        No documents found.
                                    </li>
                                )}
                                {deal.documents.map((doc: any) => (
                                    <li key={doc.id} className="px-4 py-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">{doc.type.replace(/_/g, ' ')}</span>
                                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
                                            <a href={`/api/documents/${doc.id}/download`} target="_blank">
                                                <Download className="h-4 w-4 mr-1" />
                                                Download
                                            </a>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Participants & Finance */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Participants</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Exporter</h4>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-full">
                                        <Building2 className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{deal.exporter?.companyName || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500 truncate">{deal.exporter?.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Buyer</h4>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-full">
                                        <Building2 className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{deal.buyerEmail}</p>
                                        <p className="text-xs text-slate-500">Buyer Account</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                Finance Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deal.financeRequests.length > 0 ? (
                                <div className="space-y-3">
                                    {deal.financeRequests.map((req: any) => (
                                        <Link key={req.id} href={`/admin/finance/${req.id}`}>
                                            <div className="p-3 bg-slate-50 rounded-md border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <StatusBadge status={req.status} type="finance" />
                                                    <span className="text-xs text-slate-400">View &rarr;</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-900 mt-2">{deal.currency} {new Intl.NumberFormat('en-US').format(req.amount)}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No finance requests associated with this deal.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Admin Actions (Manual Override) */}
                    <Card className="border-red-100">
                        <CardHeader className="bg-red-50/30 border-b border-red-50">
                            <CardTitle className="flex items-center gap-2 text-base text-red-900">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                Admin Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <p className="text-xs text-slate-500">
                                <strong>Warning:</strong> Forcing a state change bypasses normal checks. Use only for corrections or disputes.
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('RELEASED')} className="justify-start text-red-700 hover:bg-red-50 hover:text-red-800 border-red-200">
                                    Force Release Funds
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('CANCELLED')} className="justify-start hover:bg-slate-50">
                                    Force Cancel Deal
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('DISPUTED')} className="justify-start hover:bg-slate-50">
                                    Mark as Disputed
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    )
}
