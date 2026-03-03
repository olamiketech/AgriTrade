"use client"

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Card,
    CardContent
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Factory, ShoppingCart } from 'lucide-react'
import clsx from 'clsx'

const schema = z.object({
    email: z.string().email({ message: "Valid email is required" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    role: z.enum(['EXPORTER', 'BUYER']),
    companyName: z.string().min(1, { message: "Legal Company Name is required" }),
    country: z.string().min(1, { message: "Country of Registration is required" }),
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
    const { register: registerAuth } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            role: 'EXPORTER' // Default but user will likely click
        }
    })

    const selectedRole = watch('role')

    const onSubmit = async (data: FormData) => {
        setError(null)
        try {
            await registerAuth(data)
        } catch (err: any) {
            if (Array.isArray(err.message)) {
                setError(err.message.join(', '))
            } else {
                setError(err.message || 'Registration failed')
            }
        }
    }

    return (
        <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link href="/" className="flex justify-center mb-6">
                    <span className="text-2xl font-bold tracking-tight text-slate-900">AgriTrade Secure</span>
                </Link>
                <div className="text-center">
                    <h2 className="text-2xl font-bold leading-9 tracking-tight text-slate-900">
                        Create your corporate account
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Join the secure network for agricultural trade
                    </p>
                </div>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[600px]">
                <Card className="shadow-lg border-slate-200">
                    <CardContent className="pt-8 px-8 pb-8">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

                            {/* Role Selection UI */}
                            <div>
                                <label className="block text-sm font-medium leading-6 text-slate-900 mb-3">
                                    I am registering as:
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setValue('role', 'EXPORTER')}
                                        className={clsx(
                                            "cursor-pointer rounded-lg border p-4 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-50",
                                            selectedRole === 'EXPORTER'
                                                ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                                                : "border-slate-200"
                                        )}
                                    >
                                        <Factory className={clsx("w-8 h-8 mb-2", selectedRole === 'EXPORTER' ? "text-emerald-700" : "text-slate-400")} />
                                        <span className={clsx("font-semibold text-sm", selectedRole === 'EXPORTER' ? "text-emerald-900" : "text-slate-600")}>Exporter</span>
                                        <span className="text-xs text-slate-500 mt-1">Selling goods</span>
                                    </div>

                                    <div
                                        onClick={() => setValue('role', 'BUYER')}
                                        className={clsx(
                                            "cursor-pointer rounded-lg border p-4 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-50",
                                            selectedRole === 'BUYER'
                                                ? "border-cyan-600 bg-cyan-50 ring-1 ring-cyan-600"
                                                : "border-slate-200"
                                        )}
                                    >
                                        <ShoppingCart className={clsx("w-8 h-8 mb-2", selectedRole === 'BUYER' ? "text-cyan-700" : "text-slate-400")} />
                                        <span className={clsx("font-semibold text-sm", selectedRole === 'BUYER' ? "text-cyan-900" : "text-slate-600")}>Buyer</span>
                                        <span className="text-xs text-slate-500 mt-1">Purchasing goods</span>
                                    </div>
                                </div>
                                {/* Hidden input for form submission compatibility if needed, though react-hook-form handles standard submit */}
                            </div>

                            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                                <div className="sm:col-span-2">
                                    <Input
                                        {...register('companyName')}
                                        type="text"
                                        label="Company / Legal Entity Name"
                                        placeholder="e.g. Global Agri Corp Ltd."
                                        error={errors.companyName?.message}
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <Input
                                        {...register('email')}
                                        type="email"
                                        label="Work Email"
                                        placeholder="name@company.com"
                                        error={errors.email?.message}
                                    />
                                </div>

                                <div>
                                    <Input
                                        {...register('country')}
                                        type="text"
                                        label="Country (HQ)"
                                        placeholder="e.g. United Kingdom"
                                        error={errors.country?.message}
                                    />
                                </div>

                                <div>
                                    <Input
                                        {...register('password')}
                                        type="password"
                                        label="Password"
                                        error={errors.password?.message}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-3">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Registration Error</h3>
                                            <div className="mt-1 text-sm text-red-700">{error}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 shadow-md transition-all"
                                >
                                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                                </Button>
                            </div>

                            <p className="text-xs text-slate-500 text-center px-4">
                                By clicking sign up, you agree to our Terms of Service and Anti-Money Laundering (AML) policies.
                            </p>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-sm leading-6">
                                    <span className="bg-white px-6 text-slate-500">Already registered?</span>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-600">
                                    Sign into your account
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
