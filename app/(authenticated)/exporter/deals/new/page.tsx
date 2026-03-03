"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'

import TermsModal from '@/components/TermsModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const schema = z.object({
    buyerEmail: z.string().email("Invalid email address"),
    productDetails: z.string().min(10, "Please provide more details about the product"),
    quantity: z.coerce.number().positive("Quantity must be positive"),
    price: z.coerce.number().positive("Price must be positive"),
    currency: z.string().length(3, "Currency must be 3 characters code"),
    deliveryTerms: z.string().min(1, "Delivery terms are required"),
})

type FormData = z.infer<typeof schema>

export default function CreateDealPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isKycError, setIsKycError] = useState(false)
    const [showTerms, setShowTerms] = useState(false)
    const [pendingData, setPendingData] = useState<FormData | null>(null)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            currency: 'USD',
            deliveryTerms: 'FOB'
        }
    })

    const onFormSubmit = (data: FormData) => {
        setPendingData(data)
        setShowTerms(true)
    }

    const handleTermsAccepted = async () => {
        if (!pendingData) return
        setShowTerms(false)
        setError(null)
        setIsKycError(false)

        try {
            const res = await fetch('/api/deals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...pendingData, termsAccepted: true })
            })

            if (!res.ok) {
                const errorData = await res.json()
                if (Array.isArray(errorData.error)) {
                    throw new Error(errorData.error.map((e: any) => e.message).join(', '))
                } else {
                    throw new Error(errorData.error || 'Failed to create deal')
                }
            }

            const data = await res.json()
            if (data.deal?.status === 'DRAFT') {
                router.push('/exporter/deals?status=draft_created')
            } else {
                router.push('/exporter/deals?status=created')
            }
        } catch (err: any) {
            setError(err.message)
            if (err.message.includes('KYC Verification Required')) {
                setIsKycError(true)
            }
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/exporter')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Trade Deal</h1>
                    <p className="text-slate-500">Initiate a secure transaction with a buyer.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Deal Details</CardTitle>
                    <CardDescription>
                        Provide the specifics of the trade. The buyer will review and accept these terms.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={handleSubmit(onFormSubmit)}>

                        {/* Buyer Information */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="col-span-2">
                                <Input
                                    {...register('buyerEmail')}
                                    label="Buyer Email Address"
                                    type="email"
                                    placeholder="buyer@company.com"
                                    error={errors.buyerEmail?.message}
                                    helperText="We will send an invitation to this email to join the deal."
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-sm font-medium leading-none mb-2 block">
                                    Product Description
                                </label>
                                <textarea
                                    {...register('productDetails')}
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Describe the goods, quality, packaging, etc."
                                />
                                {errors.productDetails && (
                                    <p className="text-xs font-medium text-destructive mt-1">{errors.productDetails.message}</p>
                                )}
                            </div>

                            <div>
                                <Input
                                    {...register('quantity', { valueAsNumber: true })}
                                    label="Quantity"
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    error={errors.quantity?.message}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium leading-none mb-2 block">
                                    Incoterms (Delivery)
                                </label>
                                <select
                                    {...register('deliveryTerms')}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="FOB">FOB (Free On Board)</option>
                                    <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                                    <option value="EXW">EXW (Ex Works)</option>
                                    <option value="DAP">DAP (Delivered at Place)</option>
                                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                                </select>
                                {errors.deliveryTerms && (
                                    <p className="text-xs font-medium text-destructive mt-1">{errors.deliveryTerms.message}</p>
                                )}
                            </div>

                            <div>
                                <Input
                                    {...register('price', { valueAsNumber: true })}
                                    label="Total Contract Value"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    error={errors.price?.message}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium leading-none mb-2 block">
                                    Currency
                                </label>
                                <select
                                    {...register('currency')}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CNY">CNY (¥)</option>
                                </select>
                                {errors.currency && (
                                    <p className="text-xs font-medium text-destructive mt-1">{errors.currency.message}</p>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4 border border-red-100 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div className="text-sm text-red-700">
                                    {error}
                                    {isKycError && (
                                        <div className="mt-2">
                                            <Link href="/exporter/settings">
                                                <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800">
                                                    Complete Verification
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.back()}
                                className="mr-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-[150px]"
                            >
                                {isSubmitting ? (
                                    'Processing...'
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Deal
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
                onAccept={handleTermsAccepted}
            />
        </div>
    )
}

