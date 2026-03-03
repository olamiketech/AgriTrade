"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldCheck, Upload, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ExporterVerificationPage() {
    const router = useRouter()
    const [status, setStatus] = useState<string>('IDLE')
    const [file, setFile] = useState<File | null>(null)

    const handleSubmit = async () => {
        if (!file) return alert('Please select a file')

        setStatus('SUBMITTING')
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('fileType', 'ID_DOCUMENT')

            const res = await fetch('/api/kyc/submit', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                setStatus('SUCCESS')
            } else {
                const data = await res.json()
                console.error('Submission error:', data)
                setStatus('ERROR')
            }
        } catch (e) {
            console.error(e)
            setStatus('ERROR')
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">KYC Verification</h1>
                    <p className="text-slate-500">Submit your documents to verify your exporter identity.</p>
                </div>
            </div>

            {status === 'SUCCESS' ? (
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-medium text-emerald-900">Submission Received</h3>
                        <p className="text-emerald-700">Your documents have been submitted for review. An administrator will verify your profile shortly.</p>
                        <Button onClick={() => router.push('/exporter/settings')} className="bg-emerald-600 hover:bg-emerald-700">Return to Settings</Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Required Documents</CardTitle>
                        <CardDescription>
                            Please upload a government-issued ID (Passport, National ID) or Company Registration Certificate.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="relative p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-emerald-500 transition-colors text-center cursor-pointer">
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-slate-400" />
                                <p className="text-sm text-slate-600">
                                    {file ? file.name : "Click to upload or drag and drop"}
                                </p>
                                <Input
                                    type="file"
                                    className="hidden"
                                    id="file-upload"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer opacity-0" />
                            </div>
                        </div>

                        {status === 'ERROR' && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Failed to submit verification. Please try again.</span>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={!file || status === 'SUBMITTING'}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {status === 'SUBMITTING' ? 'Submitting...' : 'Submit Documents'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
