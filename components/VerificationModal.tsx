'use client'

import { useState } from 'react'
import { Upload, X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface VerificationModalProps {
    isOpen: boolean
    onClose: () => void
    tradeId: string
    onSuccess: () => void
}

export default function VerificationModal({ isOpen, onClose, tradeId, onSuccess }: VerificationModalProps) {
    const [uploading, setUploading] = useState(false)
    const [step, setStep] = useState(1) // 1: Upload, 2: Success
    const [files, setFiles] = useState<{
        companyReg: File | null,
        govtId: File | null
    }>({
        companyReg: null,
        govtId: null
    })

    if (!isOpen) return null

    const handleFileChange = (type: 'companyReg' | 'govtId', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }))
        }
    }

    const handleSubmit = async () => {
        if (!files.companyReg || !files.govtId) {
            alert("Please upload both documents.")
            return
        }

        setUploading(true)
        try {
            // 1. Upload Company Registration
            const formData1 = new FormData()
            formData1.append('file', files.companyReg)
            formData1.append('tradeId', tradeId)
            formData1.append('type', 'COMPANY_REGISTRATION')
            await fetch('/api/documents', { method: 'POST', body: formData1 })

            // 2. Upload Govt ID
            const formData2 = new FormData()
            formData2.append('file', files.govtId)
            formData2.append('tradeId', tradeId)
            formData2.append('type', 'GOVERNMENT_ID')
            await fetch('/api/documents', { method: 'POST', body: formData2 })

            // 3. Update Deal Status to PENDING_VERIFICATION
            const res = await fetch(`/api/deals/${tradeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CREATED' })
            })

            if (res.ok) {
                setStep(2)
            } else {
                throw new Error("Failed to update status")
            }

        } catch (error) {
            console.error(error)
            alert("Upload failed. Please try again.")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden border border-slate-100">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-slate-800">Identity Verification</h3>
                    </div>
                    {step === 1 && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <p className="text-sm text-slate-600">
                                To activate your account and proceed with this deal, please upload the following documents for admin review.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Company Registration / Business License</Label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                        <Input
                                            type="file"
                                            accept=".pdf,.jpg,.png"
                                            onChange={(e) => handleFileChange('companyReg', e)}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Accepted: PDF, JPG, PNG (Max 5MB)</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Government ID (Passport / Driving License)</Label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                        <Input
                                            type="file"
                                            accept=".pdf,.jpg,.png"
                                            onChange={(e) => handleFileChange('govtId', e)}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Accepted: PDF, JPG, PNG (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 space-y-4">
                            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-slate-900">Verification Submitted!</h4>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                                    Your documents have been sent to our compliance team. You will be notified once verified.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                    {step === 1 ? (
                        <>
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={uploading || !files.companyReg || !files.govtId}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {uploading ? 'Uploading...' : 'Submit Documents'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => { onClose(); onSuccess(); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                        >
                            Return to Deal
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
