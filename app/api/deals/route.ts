import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'

import { createDeal, createDealSchema } from '@/lib/deals'

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyJWT(token)
        if (!payload || payload.role !== 'EXPORTER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const parsedData = createDealSchema.parse(body)

        if (!parsedData.termsAccepted) {
            return NextResponse.json({ error: 'Terms must be accepted' }, { status: 400 })
        }

        try {
            const deal = await createDeal(payload.userId as string, parsedData)
            return NextResponse.json({ success: true, deal })
        } catch (e: any) {
            if (e.message.includes('KYC Verification Required')) {
                return NextResponse.json({ error: e.message }, { status: 403 })
            }
            if (e.message === 'Exporter profile not found') {
                return NextResponse.json({ error: e.message }, { status: 404 })
            }
            throw e
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch deals based on role
        if (payload.role === 'EXPORTER') {
            const exporterProfile = await prisma.exporterProfile.findUnique({
                where: { userId: payload.userId as string }
            })
            if (!exporterProfile) return NextResponse.json({ deals: [] })

            const deals = await prisma.tradeDeal.findMany({
                where: { exporterId: exporterProfile.id },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json({ deals })
        } else if (payload.role === 'BUYER') {
            // For buyer, we match by email. 
            // Ideally we should link to buyerProfile if they accepted, but for now matching by email is the "invite" mechanism
            const deals = await prisma.tradeDeal.findMany({
                where: { buyerEmail: payload.email as string },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json({ deals })
        } else if (payload.role === 'ADMIN') {
            const deals = await prisma.tradeDeal.findMany({
                orderBy: { createdAt: 'desc' },
                include: { exporter: { select: { companyName: true } } }
            })
            return NextResponse.json({ deals })
        }

        return NextResponse.json({ deals: [] })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
