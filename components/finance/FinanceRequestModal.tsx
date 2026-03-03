"use client"

import { useState } from 'react'
import { X, Upload, FileText, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface FinanceRequestModalProps {
    isOpen: boolean
    onClose: () => void
    tradeId: string
    dealCurrency: string
    dealAmount: number
    onSuccess: () => void
}

export default function FinanceRequestModal({ isOpen, onClose, tradeId, dealCurrency, dealAmount, onSuccess }: FinanceRequestModalProps) {
    const [amount, setAmount] = useState(dealAmount && !isNaN(dealAmount) ? dealAmount.toString() : '')
    const [purpose, setPurpose] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            // 1. Upload Files (optional)
            const supportDocs = []
            for (const file of files) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('tradeId', tradeId)
                formData.append('type', 'FINANCE_SUPPORT')

                const res = await fetch('/api/documents', { method: 'POST', body: formData })
                if (res.ok) {
                    const data = await res.json()
                    supportDocs.push({ id: data.document.id, url: data.document.filePath, name: file.name })
                } else {
                    console.error('File upload failed for', file.name)
                }
            }

            // 2. Submit Request
            const res = await fetch('/api/finance-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deal_id: tradeId,
                    amount_requested: parseFloat(amount),
                    currency: dealCurrency,
                    purpose,
                    supporting_docs: supportDocs
                })
            })

            if (res.ok) {
                onSuccess()
                onClose()
            } else {
                const errorData = await res.json()
                setError(errorData.error || 'Failed to submit request')
            }
        } catch (error) {
            console.error(error)
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* Centering trick */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal panel */}
                <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">

                    {/* Header */}
                    <div className="bg-slate-50 px-4 py-5 sm:px-6 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-amber-100">
                                <DollarSign className="h-5 w-5 text-amber-600" />
                            </div>
                            <h3 className="text-lg leading-6 font-semibold text-slate-900" id="modal-title">
                                Request Trade Finance
                            </h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                            <X className="h-5 w-5 text-slate-400" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-5 sm:p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                id="amount"
                                label={`Amount Required (${dealCurrency})`}
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />

                            <div>
                                <label htmlFor="purpose" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Purpose of Funding
                                </label>
                                <textarea
                                    id="purpose"
                                    value={purpose}
                                    onChange={e => setPurpose(e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="e.g. Procurement of raw materials..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Supporting Documents (Optional)
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-lg hover:border-emerald-500/50 hover:bg-slate-50 transition-all cursor-pointer group">
                                    <div className="space-y-1 text-center">
                                        <div className="mx-auto h-12 w-12 text-slate-300 group-hover:text-emerald-500 transition-colors">
                                            <Upload className="h-full w-full" />
                                        </div>
                                        <div className="flex text-sm text-slate-600 justify-center">
                                            <label htmlFor="file-upload-finance" className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none">
                                                <span>Upload files</span>
                                                <input id="file-upload-finance" name="file-upload-finance" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        <p className="text-xs text-slate-500">PDF, PNG, JPG up to 10MB</p>
                                    </div>
                                </div>
                                {files.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Selected files</p>
                                        <ul className="space-y-2">
                                            {files.map((f, i) => (
                                                <li key={i} className="flex items-center text-sm p-2 bg-slate-50 rounded border border-slate-100">
                                                    <FileText className="w-4 h-4 mr-2 text-emerald-500" />
                                                    <span className="truncate text-slate-700">{f.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
