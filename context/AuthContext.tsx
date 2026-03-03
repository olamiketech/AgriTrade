"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
    id: string
    email: string
    role: 'EXPORTER' | 'BUYER' | 'ADMIN'
}

type AuthContextType = {
    user: User | null
    loading: boolean
    login: (data: Record<string, unknown>) => Promise<{ mfaRequired?: boolean; user?: User } | void>
    register: (data: Record<string, unknown>) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function checkUser() {
            try {
                const res = await fetch('/api/auth/me')
                if (res.ok) {
                    const data = await res.json()
                    setUser(data.user)
                }
            } catch (error) {
                console.error("Auth check failed", error)
            } finally {
                setLoading(false)
            }
        }
        checkUser()
    }, [])

    const login = async (data: Record<string, unknown>) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Login failed')
        }

        const responseData = await res.json()

        if (responseData.mfaRequired) {
            return responseData // Return to component to handle MFA input
        }

        setUser(responseData.user)
        router.push(responseData.user.role === 'ADMIN' ? '/admin' : responseData.user.role === 'EXPORTER' ? '/exporter' : '/buyer')
        return responseData
    }

    const register = async (data: Record<string, unknown>) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Registration failed')
        }

        const responseData = await res.json()
        setUser(responseData.user)
        router.push(responseData.user.role === 'ADMIN' ? '/admin' : responseData.user.role === 'EXPORTER' ? '/exporter' : '/buyer')
    }

    const logout = async () => {
        try {
            await fetch('/api/auth/me', { method: 'DELETE' })
            setUser(null)
            // Use window.location for hard redirect to ensure clean logout
            window.location.href = '/'
        } catch (error) {
            console.error('Logout failed:', error)
            // Still clear user state and redirect even if API fails
            setUser(null)
            window.location.href = '/'
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
