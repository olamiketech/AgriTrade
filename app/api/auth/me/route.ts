import { NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function GET() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    try {
        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({ user: null }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { id: payload.userId as string },
            select: { id: true, email: true, role: true, exporterProfile: { select: { companyName: true } }, buyerProfile: { select: { companyName: true } } }
        })

        if (!user) return NextResponse.json({ user: null }, { status: 401 })

        return NextResponse.json({ user })
    } catch {
        return NextResponse.json({ user: null }, { status: 401 })
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true })
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
        path: '/',
    })
    return response
}
