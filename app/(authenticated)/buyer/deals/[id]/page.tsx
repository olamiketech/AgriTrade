"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Truck, ArrowLeft, Building2, Calendar, FileCheck, MessageSquare, Download, AlertTriangle } from 'lucide-react'
import VerificationBadge from '@/components/VerificationBadge'
import TradeChat from '@/components/TradeChat'
import TermsModal from '@/components/TermsModal'
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"

export default function BuyerDealDetail() {
    const { id } = useParams()
    const [deal, setDeal] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showTerms, setShowTerms] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

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

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me')
            if (res.ok) {
                const data = await res.json()
                setCurrentUser(data.user)
            }
        } catch (error) {
            console.error("Failed to fetch user", error)
        }
    }

    useEffect(() => {
        if (id) {
            fetchDeal()
            fetchUser()
        }
    }, [id])

    const handleAcceptClick = () => {
        setShowTerms(true)
    }

    const handleConfirmAcceptance = async () => {
        setShowTerms(false)
        try {
            const res = await fetch(`/api/deals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ACCEPTED', termsAccepted: true })
            })
            if (res.ok) {
                fetchDeal()
            } else {
                const err = await res.json()
                alert(err.error || 'Failed to accept deal')
            }
        } catch (err) { console.error(err) }
    }

    const handleConfirmDelivery = async () => {
        if (!confirm("Confirm that you have received the goods physically? This will release the final payment.")) return
        try {
            const res = await fetch(`/api/deals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryStatus: 'DELIVERED' })
            })
            if (res.ok) fetchDeal()
        } catch (err) { console.error(err) }
    }

    if (loading) return <div className="flex h-96 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
    if (!deal) return <div className="text-center py-12">Deal not found</div>

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <Button variant="ghost" size="sm" asChild className="pl-0 hover:bg-transparent hover:text-emerald-600 text-slate-500 mb-1">
                        <Link href="/buyer/deals">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Purchases
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Deal #{deal.id.substring(0, 8).toUpperCase()}</h1>
                        <StatusBadge status={deal.status} type="deal" />
                    </div>
                </div>

                <div className="flex gap-3">
                    {deal.status === 'PENDING_ACCEPTANCE' && (
                        <Button
                            onClick={handleAcceptClick}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept Deal & Terms
                        </Button>
                    )}
                    {deal.deliveryStatus === 'SHIPPED' && (
                        <Button
                            onClick={handleConfirmDelivery}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                        >
                            <Truck className="mr-2 h-4 w-4" />
                            Confirm Delivery Received
                        </Button>
                    )}
                </div>
            </div>

            {/* Success Banner */}
            {(deal.status === 'COMPLETED' || deal.status === 'RELEASED') && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg p-6 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="text-base font-semibold text-emerald-900">Purchase Complete!</h4>
                            <p className="text-sm text-emerald-700 mt-1">
                                Consistent trading on AgriTrade Secure builds your trust score, unlocking <strong>extended payment terms</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Details & Docs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Deal Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Trade Specifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Exporter</dt>
                                    <dd className="mt-1 flex items-center gap-2">
                                        <div className="p-1 bg-slate-100 rounded">
                                            <Building2 className="h-4 w-4 text-slate-600" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-900">
                                            {deal.exporter?.companyName || deal.exporter?.email}
                                        </span>
                                        {deal.exporter?.verificationLevel && (
                                            <VerificationBadge level={deal.exporter.verificationLevel} />
                                        )}
                                        {/* Link to profile removed for now as page not prominent, can add back later */}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Product</dt>
                                    <dd className="mt-1 text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-md border border-slate-100">{deal.productDetails}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Quantity</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{deal.quantity}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Total Contract Value</dt>
                                    <dd className="mt-1 text-sm font-bold text-slate-900">{deal.currency} {new Intl.NumberFormat('en-US').format(deal.price)}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Delivery Terms</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{deal.deliveryTerms}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Payment Status</dt>
                                    <dd className="mt-1">
                                        <StatusBadge status={deal.paymentStatus} type="payment" />
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileCheck className="h-5 w-5 text-slate-500" />
                                Received Documents
                            </CardTitle>
                            <CardDescription>Documents shared by the exporter.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="divide-y divide-slate-100 border border-slate-100 rounded-md overflow-hidden">
                                {deal.documents.length === 0 && (
                                    <li className="px-4 py-8 text-center text-slate-500 text-sm italic bg-slate-50">
                                        No documents have been shared yet.
                                    </li>
                                )}
                                {deal.documents.map((doc: any) => (
                                    <li key={doc.id} className="px-4 py-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                                <FileCheck className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{doc.type.replace(/_/g, ' ')}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-medium">
                                                        Verified & Watermarked
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
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

                    {/* Trade Discussion */}
                    {currentUser && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-slate-400" />
                                    <CardTitle>Trade Discussion</CardTitle>
                                </div>
                                <CardDescription>Secure message log with the exporter.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TradeChat tradeId={id as string} currentUserId={currentUser.id} />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Timeline/Status */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipment Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-2">
                                <div className="ml-6">
                                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-white">
                                        <Calendar className="h-3 w-3 text-emerald-600" />
                                    </span>
                                    <h3 className="flex items-center mb-1 text-sm font-semibold text-slate-900">Deal Started</h3>
                                    <time className="block mb-2 text-xs font-normal leading-none text-slate-400">
                                        {new Date(deal.createdAt).toLocaleDateString()}
                                    </time>
                                </div>
                                <div className="ml-6">
                                    <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white ${deal.termsAccepted ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                        <CheckCircle className={`h-3 w-3 ${deal.termsAccepted ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    </span>
                                    <h3 className="text-sm font-semibold text-slate-900">Terms Agreed</h3>
                                </div>
                                <div className="ml-6">
                                    <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white ${['SHIPPED', 'DELIVERY_CONFIRMED', 'RELEASE_REQUESTED', 'RELEASED', 'COMPLETED'].includes(deal.status) ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                        <Truck className={`h-3 w-3 ${['SHIPPED', 'DELIVERY_CONFIRMED', 'RELEASE_REQUESTED', 'RELEASED', 'COMPLETED'].includes(deal.status) ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    </span>
                                    <h3 className="text-sm font-semibold text-slate-900">Shipped</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-amber-900 flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                Payment Protection
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Your payment is held in escrow until you confirm delivery. Do not confirm delivery until you have inspected the goods using the provided document verification codes.
                            </p>
                        </CardContent>
                    </Card>
                </div>

            </div>

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
                onAccept={handleConfirmAcceptance}
            />

        </div>
    )
}
