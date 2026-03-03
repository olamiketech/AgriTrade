"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Upload, DollarSign, FileText, Sparkles, CheckCircle2, AlertTriangle, ArrowLeft, Download, ShieldCheck, ChevronRight, MessageSquare, Briefcase } from 'lucide-react'
import ExtractionVerification from '@/components/ExtractionVerification'
import FinanceRequestModal from '@/components/finance/FinanceRequestModal'
import VerificationModal from '@/components/VerificationModal'
import TradeChat from '@/components/TradeChat'
import DealStrengthCard from '@/components/DealStrengthCard'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ExportDealDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const [deal, setDeal] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false)
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('documents')

    // Document Upload State
    const [docType, setDocType] = useState('SHIPPING_INVOICE')

    // UI State
    const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
    const [summary, setSummary] = useState<any>(null)
    const [dealScore, setDealScore] = useState<any>(null)
    const [generatingSummary, setGeneratingSummary] = useState(false)

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

    const fetchSummary = async () => {
        try {
            const res = await fetch(`/api/deals/${id}/summary`)
            if (res.ok) {
                const data = await res.json()
                setSummary(data.summary)
            }
        } catch (e) { console.error(e) }
    }

    const fetchDealScore = async () => {
        try {
            const res = await fetch(`/api/deals/${id}/score`)
            if (res.ok) {
                const data = await res.json()
                setDealScore(data.score)
            }
        } catch (e) { console.error(e) }
    }

    useEffect(() => {
        if (id) {
            fetchDeal()
            fetchSummary()
            fetchDealScore()
        }
    }, [id])

    const handleGenerateSummary = async () => {
        setGeneratingSummary(true)
        try {
            const res = await fetch(`/api/deals/${id}/summary`, { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                if (data.error) {
                    alert(data.error)
                } else {
                    fetchSummary()
                }
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to generate summary.')
            }
        } catch (err) {
            console.error(err)
            alert('Failed to generate summary')
        } finally {
            setGeneratingSummary(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        setUploading(true)
        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('tradeId', id as string)
        formData.append('type', docType)

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                body: formData
            })
            if (res.ok) {
                fetchDeal() // Refresh
            } else {
                alert('Upload failed')
            }
        } catch (err) {
            console.error(err)
            alert('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const handleMarkShipped = async () => {
        if (!confirm("Are you sure you want to mark this as SHIPPED? Ensure you have uploaded shipping documents.")) return

        try {
            const res = await fetch(`/api/deals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deliveryStatus: 'SHIPPED'
                })
            })
            if (res.ok) {
                fetchDeal()
            } else {
                alert('Failed to update status. Ensure payment is confirmed first.')
            }
        } catch (err) {
            console.error(err)
        }
    }

    const openVerificationModal = () => setIsVerificationModalOpen(true)

    if (loading) return <div className="flex h-96 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
    if (!deal) return <div className="text-center py-12">Deal not found</div>

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">

            {/* Header with Breadcrumb-like Back Button */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <Button variant="ghost" size="sm" asChild className="pl-0 hover:bg-transparent hover:text-emerald-600 text-slate-500 mb-1">
                        <Link href="/exporter/deals">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Deals
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Deal #{deal.id.substring(0, 8).toUpperCase()}</h1>
                        <StatusBadge status={deal.status} type="deal" />
                    </div>
                    <p className="text-slate-500 flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4" />
                        Buyer: {deal.buyerEmail}
                    </p>
                </div>
                <div className="flex gap-3">
                    {deal.paymentStatus === 'PAID_HELD' && deal.status !== 'SHIPPED' &&
                        deal.status !== 'COMPLETED' && (
                            <Button
                                onClick={handleMarkShipped}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Upload className="-ml-0.5 mr-1.5 h-4 w-4" />
                                Mark as Shipped
                            </Button>
                        )}
                    {/* Submit for Verification (Basic Tier) */}
                    {deal.status === 'DRAFT' && (
                        <Button
                            onClick={openVerificationModal}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <ShieldCheck className="-ml-0.5 mr-1.5 h-4 w-4" />
                            Submit for Review
                        </Button>
                    )}
                </div>
            </div>

            {/* Retention / Completed Banner */}
            {deal.status === 'COMPLETED' && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="text-base font-semibold text-emerald-900">Deal Completed Successfully!</h4>
                            <p className="text-sm text-emerald-700 mt-1">
                                Great job! Developing a track record on AgriTrade Secure unlocks <strong>lower fees</strong> and <strong>premium finance rates</strong>.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" className="border-emerald-200 text-emerald-800 hover:bg-emerald-100 bg-white" asChild>
                        <Link href="/exporter/deals/new">Start Next Deal</Link>
                    </Button>
                </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Details & Finance */}
                <div className="space-y-6 lg:col-span-2">

                    {/* Deal Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Trade Specifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
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
                                    <dt className="text-sm font-medium text-slate-500">Payment Status</dt>
                                    <dd className="mt-1">
                                        <StatusBadge status={deal.paymentStatus} type="payment" />
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Delivery Status</dt>
                                    <dd className="mt-1">
                                        <StatusBadge status={deal.deliveryStatus} type="deal" />
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Deal Strength Score */}
                    <DealStrengthCard
                        tradeId={id as string}
                        score={dealScore}
                        onRefresh={fetchDealScore}
                    />

                    {/* AI Dossier / Summary */}
                    <Card className="border-purple-100 overflow-hidden">
                        <CardHeader className="bg-purple-50/30 border-b border-purple-50">
                            <CardTitle className="flex items-center text-purple-900">
                                <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                                AI Trade Dossier
                            </CardTitle>
                            <CardDescription>
                                Automated analysis of all verified documents for this deal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {summary ? (
                                <div className="space-y-4">
                                    <div className="prose prose-sm text-slate-700 max-w-none whitespace-pre-wrap font-sans bg-slate-50 p-4 rounded-md border border-slate-100">
                                        {summary.content}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <p>Generated: {new Date(summary.generatedAt).toLocaleString()}</p>
                                        <div className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
                                            <ShieldCheck className="h-3 w-3" /> Verified Sources
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 mb-3">
                                        <FileText className="h-6 w-6 text-purple-300" />
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">Generate a comprehensive summary based on verified documents. Ensure all extraction fields are verified first.</p>
                                    <Button
                                        onClick={handleGenerateSummary}
                                        disabled={generatingSummary}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {generatingSummary ? (
                                            <>Generating Analysis...</>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Generate Dossier
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabs for Documents & Finance (Visual Tabs) */}
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`${activeTab === 'documents' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                            >
                                <FileText className="h-4 w-4" /> Documents
                            </button>
                            <button
                                onClick={() => setActiveTab('finance')}
                                className={`${activeTab === 'finance' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                            >
                                <DollarSign className="h-4 w-4" /> Export Finance
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`${activeTab === 'chat' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                            >
                                <MessageSquare className="h-4 w-4" /> Discussion
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="pt-2">
                        {activeTab === 'documents' && (
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <CardTitle>Trade Documents</CardTitle>
                                            <CardDescription>Upload shipping documents and certificates.</CardDescription>
                                        </div>
                                        {/* Simple Upload UI */}
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={docType}
                                                onChange={(e) => setDocType(e.target.value)}
                                                className="block rounded-md border-slate-300 text-sm focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
                                            >
                                                <option value="SHIPPING_INVOICE">Shipping Invoice</option>
                                                <option value="BILL_OF_LADING">Bill of Lading</option>
                                                <option value="PACKING_LIST">Packing List</option>
                                                <option value="CERTIFICATE_OF_ORIGIN">Certificate of Origin</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                            <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-9 px-4 py-2">
                                                {uploading ? 'Uploading...' : 'Upload'}
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    disabled={uploading}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="divide-y divide-slate-100">
                                        {deal.documents.length === 0 && (
                                            <li className="py-8 text-center text-slate-500 text-sm italic">
                                                No documents uploaded yet.
                                            </li>
                                        )}
                                        {deal.documents.map((doc: any) => (
                                            <li key={doc.id} className="py-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                                            <FileText className="h-5 w-5 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">{doc.type.replace(/_/g, ' ')}</p>
                                                            <p className="text-xs text-slate-500">
                                                                Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                                                        >
                                                            {expandedDocId === doc.id ? 'Close' : 'Verify Extraction'}
                                                        </Button>
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={`/api/documents/${doc.id}/download`} target="_blank">
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                                {expandedDocId === doc.id && (
                                                    <div className="mt-4 p-4 border rounded-md border-emerald-100 bg-emerald-50/30">
                                                        <ExtractionVerification documentId={doc.id} />
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'finance' && (
                            <Card className="border-amber-100">
                                <CardHeader className="bg-amber-50/30 border-b border-amber-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-amber-900">Export Finance Requests</CardTitle>
                                            <CardDescription>Request capital against this trade deal.</CardDescription>
                                        </div>
                                        <Button
                                            onClick={() => setIsFinanceModalOpen(true)}
                                            className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                                        >
                                            <DollarSign className="mr-2 h-4 w-4" />
                                            Request Finance
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {deal.financeRequests && deal.financeRequests.length > 0 ? (
                                        <div className="space-y-4">
                                            {deal.financeRequests.map((req: any) => (
                                                <div key={req.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <StatusBadge status={req.status} type="finance" />
                                                            <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-lg font-semibold text-slate-900">{deal.currency} {new Intl.NumberFormat('en-US').format(req.amount)}</p>
                                                        <p className="text-sm text-slate-600 italic mt-1">{req.purpose}</p>
                                                    </div>
                                                    {req.adminNotes && (
                                                        <div className="text-sm bg-slate-50 p-3 rounded border border-slate-100 sm:max-w-xs">
                                                            <span className="font-semibold text-slate-700 block mb-1">Response:</span>
                                                            <span className="text-slate-600">{req.adminNotes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            No finance requests have been made for this deal yet.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'chat' && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-slate-400" />
                                        <CardTitle>Trade Discussion</CardTitle>
                                    </div>
                                    <CardDescription>Secure message log for this transaction. All messages are audited.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {user && <TradeChat tradeId={id as string} currentUserId={user.id} />}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right Column: Timeline / Quick Actions (Optional, but good for layout balance) */}
                <div className="space-y-6 lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deal Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Simple Vertical Timeline */}
                            <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-2">
                                <div className="mb-8 ml-6">
                                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-white">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    </span>
                                    <h3 className="flex items-center mb-1 text-sm font-semibold text-slate-900">Deal Created</h3>
                                    <time className="block mb-2 text-xs font-normal leading-none text-slate-400">
                                        {new Date(deal.createdAt).toLocaleDateString()}
                                    </time>
                                </div>
                                <div className="mb-8 ml-6">
                                    <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white ${deal.termsAccepted ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                        <CheckCircle2 className={`h-4 w-4 ${deal.termsAccepted ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    </span>
                                    <h3 className="text-sm font-semibold text-slate-900">Terms Accepted</h3>
                                    <p className="text-xs text-slate-500 mt-1">Both parties agreed to terms.</p>
                                </div>
                                <div className="mb-0 ml-6">
                                    <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white ${deal.paymentStatus === 'PAID_HELD' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                        <DollarSign className={`h-4 w-4 ${deal.paymentStatus === 'PAID_HELD' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    </span>
                                    <h3 className="text-sm font-semibold text-slate-900">Payment Secured</h3>
                                    <p className="text-xs text-slate-500 mt-1">{deal.paymentStatus.replace('_', ' ').toLowerCase()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-slate-200">
                        <CardContent className="pt-6">
                            <h4 className="font-semibold text-sm mb-2 text-slate-800">Need Help?</h4>
                            <p className="text-xs text-slate-500 mb-4">
                                Contact support if you need assistance with shipping documents or finance requests.
                            </p>
                            <Button variant="outline" size="sm" className="w-full bg-white">Contact Support</Button>
                        </CardContent>
                    </Card>
                </div>

            </div>

            <FinanceRequestModal
                isOpen={isFinanceModalOpen}
                onClose={() => setIsFinanceModalOpen(false)}
                tradeId={id as string}
                dealCurrency={deal.currency}
                dealAmount={deal.price}
                onSuccess={fetchDeal}
            />

            <VerificationModal
                isOpen={isVerificationModalOpen}
                onClose={() => setIsVerificationModalOpen(false)}
                tradeId={id as string}
                onSuccess={fetchDeal}
            />

        </div>
    )
}
