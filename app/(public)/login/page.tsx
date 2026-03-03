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

const schema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
    mfaCode: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
    const { login } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [mfaRequired, setMfaRequired] = useState(false)
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: FormData) => {
        setError(null)
        try {
            if (mfaRequired && credentials) {
                if (!data.mfaCode) {
                    setError('Please enter the MFA code sent to your email/app')
                    return
                }
                const payload = { ...credentials, mfaCode: data.mfaCode }
                await login(payload as any)
                return
            }

            const res = await login({ email: data.email, password: data.password })

            if (res && res.mfaRequired) {
                setMfaRequired(true)
                setCredentials({ email: data.email, password: data.password })
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred")
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
                        {mfaRequired ? 'Security Verification' : 'Sign in to your account'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Secure access for Exporters, Buyers, and Admin
                    </p>
                </div>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <Card className="shadow-lg border-slate-200">
                    <CardContent className="pt-8 px-8 pb-8">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {!mfaRequired && (
                                <>
                                    <Input
                                        {...register('email')}
                                        id="email"
                                        type="email"
                                        label="Email address"
                                        autoComplete="email"
                                        error={errors.email?.message}
                                        disabled={isSubmitting}
                                        placeholder="name@company.com"
                                    />

                                    <Input
                                        {...register('password')}
                                        id="password"
                                        type="password"
                                        label="Password"
                                        autoComplete="current-password"
                                        error={errors.password?.message}
                                        disabled={isSubmitting}
                                    />
                                </>
                            )}

                            {mfaRequired && (
                                <Input
                                    {...register('mfaCode')}
                                    id="mfaCode"
                                    type="text"
                                    label="Authentication Code"
                                    helperText="Check your email or authenticator app (check console for dev mode code)"
                                    className="text-center tracking-widest font-mono text-lg"
                                    placeholder="000000"
                                    maxLength={6}
                                    error={errors.mfaCode?.message}
                                />
                            )}

                            {error && (
                                <div className="rounded-md bg-red-50 p-3">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Login failed</h3>
                                            <div className="mt-1 text-sm text-red-700">{error}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 shadow-sm"
                                >
                                    {isSubmitting ? 'Verifying...' : (mfaRequired ? 'Verify & Login' : 'Sign in')}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-sm leading-6">
                                    <span className="bg-white px-6 text-slate-500">Not a member yet?</span>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-600">
                                    Create an account now
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="mt-8 text-center text-xs text-slate-400">
                    &copy; 2026 AgriTrade Secure. Regulated Fintech Platform.
                </div>
            </div>
        </div>
    )
}


