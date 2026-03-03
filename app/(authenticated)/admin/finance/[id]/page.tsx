"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, Send, FileText, Download, Building2, CreditCard } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { StatusBadge } from "@/components/StatusBadge"
import { Textarea } from "@/components/ui/textarea"

export default function AdminFinanceRequestDetail() {
    const { id } = useParams()
    const router = useRouter()
    const [request, setRequest] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Action State
    const [reviewNote, setReviewNote] = useState('')
    const [isForwarding, setIsForwarding] = useState(false)
    const [forwardPartner, setForwardPartner] = useState('')
    const [forwardMethod, setForwardMethod] = useState('email')

    useEffect(() => {
        if (id) fetchRequest()
    }, [id])

    const fetchRequest = async () => {
        try {
            const res = await fetch(`/api/finance-requests/${id}`, {
                headers: { 'x-user-role': 'ADMIN', 'x-user-id': 'admin-mock-id' }
            })
            if (res.ok) {
                const data = await res.json()
                setRequest(data)
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleReview = async (action: string) => {
        if (!confirm(`Are you sure you want to ${action.replace(/_/g, ' ')}?`)) return

        try {
            const res = await fetch(`/api/admin/finance-requests/${id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes: reviewNote })
            })
            if (res.ok) {
                alert('Status updated')
                fetchRequest()
            } else {
                alert('Failed to update status')
            }
        } catch (e) {
            console.error(e)
            alert('Error updating status')
        }
    }

    const handleForward = async () => {
        if (!forwardPartner) return alert('Select a partner')

        try {
            const res = await fetch(`/api/admin/finance-requests/${id}/forward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partner_id: forwardPartner,
                    send_via: forwardMethod
                })
            })
            if (res.ok) {
                const data = await res.json()
                alert(`Forwarded successfully! ${data.result || ''}`)
                setIsForwarding(false)
                fetchRequest()
            } else {
                alert('Failed to forward')
            }
        } catch (e) {
            console.error(e)
            alert('Error forwarding')
        }
    }

    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
    if (!request) return <div className="text-center py-12 text-slate-500">Request not found</div>

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <Button variant="ghost" size="sm" asChild className="pl-0 hover:bg-transparent hover:text-emerald-600 text-slate-500 mb-1">
                        <Link href="/admin/finance">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Requests
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Request #{request.id.substring(0, 8).toUpperCase()}</h1>
                        <StatusBadge status={request.status} type="finance" />
                    </div>
                    <p className="text-slate-500 text-sm">Submitted on {new Date(request.createdAt).toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column: Request & Deal Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-slate-400" />
                                Request Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Exporter</dt>
                                    <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                        {request.exporter.companyName || request.exporter.email}
                                    </dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Amount Requested</dt>
                                    <dd className="mt-1 text-lg font-bold text-emerald-700">{request.currency} {new Intl.NumberFormat('en-US').format(request.amount)}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500">Partner Reference</dt>
                                    <dd className="mt-1 text-sm font-mono text-slate-600 bg-slate-100 inline-block px-2 py-0.5 rounded">{request.partnerRefId || 'N/A'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Purpose</dt>
                                    <dd className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded-md border border-slate-100">{request.purpose}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-slate-400" />
                                Trade Deal Context
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Underlying Asset (Product)</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{request.trade.productDetails}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Total Deal Value</dt>
                                    <dd className="mt-1 text-sm font-medium text-slate-900">{request.trade.currency} {new Intl.NumberFormat('en-US').format(request.trade.price)}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Associated Documents</dt>
                                    <dd className="mt-2">
                                        <ul className="space-y-2">
                                            {JSON.parse(request.supportingDocs || '[]').map((doc: any, i: number) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                                                    <FileText className="h-4 w-4 text-emerald-500" />
                                                    <span className="truncate">{doc.name || 'Supporting Doc'}</span>
                                                </li>
                                            ))}
                                            {request.trade.documents.map((doc: any) => (
                                                <li key={doc.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                        <span>{doc.type}</span>
                                                    </div>
                                                    <a href={`/api/documents/${doc.id}/download`} target="_blank" className="text-xs text-emerald-600 hover:underline flex items-center">
                                                        <Download className="h-3 w-3 mr-1" /> View
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Actions & Logs */}
                <div className="space-y-6">
                    <Card className="border-emerald-100 shadow-md">
                        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
                            <CardTitle className="text-emerald-900">Adjudication Console</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Internal / Review Notes</label>
                                <Textarea
                                    rows={3}
                                    placeholder="Add notes for exporter or internal log..."
                                    value={reviewNote}
                                    onChange={e => setReviewNote(e.target.value)}
                                    className="bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={() => handleReview('approve_for_referral')}
                                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    onClick={() => setIsForwarding(true)}
                                    className="bg-purple-600 hover:bg-purple-700 w-full text-white"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Forward
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleReview('request_more_info')}
                                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                                >
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    Request Info
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleReview('decline')}
                                    className="w-full"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Decline
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Audit Trail</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-80 overflow-y-auto">
                                <ul className="divide-y divide-slate-100">
                                    {request.referralLogs && request.referralLogs.length > 0 ? (
                                        request.referralLogs.map((log: any) => (
                                            <li key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-medium text-slate-900 capitalize">{log.action.replace(/_/g, ' ')}</span>
                                                    <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-mono bg-slate-50 p-1.5 rounded border border-slate-100 truncate">
                                                    {log.payload ? JSON.stringify(JSON.parse(log.payload)).substring(0, 50) + '...' : '-'}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 text-right">Actor: {log.actorId || 'System'}</p>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="p-6 text-center text-sm text-slate-500">No logs recorded yet.</li>
                                    )}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>

            {/* Forward Modal */}
            {isForwarding && (
                <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 py-4 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-slate-900/50 transition-opacity" onClick={() => setIsForwarding(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 animate-in zoom-in-95 duration-200">
                            <div>
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                                    <Send className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-slate-900">Forward to Finance Partner</h3>
                                    <div className="mt-4 text-left space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Select Partner</label>
                                            <select
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2"
                                                value={forwardPartner}
                                                onChange={e => setForwardPartner(e.target.value)}
                                            >
                                                <option value="">Select a partner...</option>
                                                <option value="KRIYA">Kriya (Trade Finance)</option>
                                                <option value="STASIS">Stasis (Stablecoin Liquidity)</option>
                                                <option value="OTHER">Other Logic</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Method</label>
                                            <div className="mt-2 space-y-3">
                                                <div className="flex items-center">
                                                    <input
                                                        id="email"
                                                        name="method"
                                                        type="radio"
                                                        checked={forwardMethod === 'email'}
                                                        onChange={() => setForwardMethod('email')}
                                                        className="h-4 w-4 border-slate-300 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <label htmlFor="email" className="ml-3 block text-sm font-medium text-slate-700">Email Referral (PDF Dossier)</label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        id="api"
                                                        name="method"
                                                        type="radio"
                                                        checked={forwardMethod === 'api'}
                                                        onChange={() => setForwardMethod('api')}
                                                        className="h-4 w-4 border-slate-300 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <label htmlFor="api" className="ml-3 block text-sm font-medium text-slate-700">Direct API Integration</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <Button
                                    onClick={handleForward}
                                    className="w-full bg-purple-600 hover:bg-purple-700 sm:col-start-2"
                                >
                                    Confirm Forward
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsForwarding(false)}
                                    className="mt-3 w-full sm:mt-0 sm:col-start-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
