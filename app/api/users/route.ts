import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyJWT(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                verificationStatus: true,
                createdAt: true,
                exporterProfile: {
                    select: {
                        id: true,
                        companyName: true,
                        country: true,
                        approvalStatus: true,
                        verificationLevel: true,
                        verificationNotes: true
                    }
                },
                buyerProfile: { select: { companyName: true, country: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ users })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
