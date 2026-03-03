'use client'

import { useState, useEffect } from 'react'
import { X, Download, FileText, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KYCDocument {
    id: string
    fileName: string
    fileType: string
    mimeType: string
    uploadedAt: string
    reviewedBy?: string
    reviewedAt?: string
    reviewNotes?: string
}

interface DocumentReviewModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    userName: string
    onApprove?: () => void
    onReject?: () => void
}

export default function DocumentReviewModal({
    isOpen,
    onClose,
    userId,
    userName,
    onApprove,
    onReject
}: DocumentReviewModalProps) {
    const [documents, setDocuments] = useState<KYCDocument[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && userId) {
            fetchDocuments()
        }
    }, [isOpen, userId])

    const fetchDocuments = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/users/${userId}/documents`)
            if (res.ok) {
                const data = await res.json()
                setDocuments(data.documents || [])
            } else {
                setError('Failed to load documents')
            }
        } catch (err) {
            setError('Error loading documents')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (docId: string, fileName: string) => {
        try {
            const res = await fetch(`/api/kyc/documents/${docId}`)
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = fileName
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (err) {
            console.error('Download error:', err)
            alert('Failed to download document')
        }
    }

    const handleViewInline = (docId: string) => {
        window.open(`/api/kyc/documents/${docId}`, '_blank')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">KYC Documents</h3>
                        <p className="text-sm text-gray-500">{userName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            <p>{error}</p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                            <p>No documents submitted yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="border border-slate-200 rounded-lg p-4 hover:border-emerald-300 transition-colors bg-white"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="h-5 w-5 text-emerald-600" />
                                                <h4 className="font-medium text-slate-900">{doc.fileName}</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-2">
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="font-medium">Type:</span> {doc.fileType}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {doc.reviewNotes && (
                                                <p className="text-xs text-slate-500 italic mt-2">
                                                    Notes: {doc.reviewNotes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewInline(doc.id)}
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                            >
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDownload(doc.id, doc.fileName)}
                                                className="hover:bg-slate-100"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {documents.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-between items-center gap-3">
                        <p className="text-sm text-slate-600">
                            {documents.length} document{documents.length !== 1 ? 's' : ''} submitted
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                            {onReject && (
                                <Button
                                    variant="destructive"
                                    onClick={onReject}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            )}
                            {onApprove && (
                                <Button
                                    onClick={onApprove}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
