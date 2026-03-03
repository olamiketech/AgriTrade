import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

// Schema for creation
const createFinanceRequestSchema = z.object({
    deal_id: z.string(),
    amount_requested: z.number().positive(),
    currency: z.string().default('GBP'),
    purpose: z.string().min(1),
    supporting_docs: z.array(z.any()).optional(), // Accept any object structure (id, url, name)
});

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await verifyJWT(token)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json();
        const validatedData = createFinanceRequestSchema.parse(body);

        // Validate Deal Ownership
        const deal = await prisma.tradeDeal.findUnique({
            where: { id: validatedData.deal_id },
        });

        if (!deal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        const exporterProfile = await prisma.exporterProfile.findUnique({
            where: { userId: user.userId as string }
        });

        if (!exporterProfile) {
            return NextResponse.json({ error: 'Exporter profile not found' }, { status: 403 });
        }

        if (deal.exporterId !== exporterProfile.id) {
            return NextResponse.json({ error: 'Unauthorized for this deal' }, { status: 403 });
        }

        const financeRequest = await prisma.financeRequest.create({
            data: {
                tradeId: validatedData.deal_id,
                exporterId: exporterProfile.id,
                amount: validatedData.amount_requested,
                currency: validatedData.currency,
                purpose: validatedData.purpose,
                supportingDocs: JSON.stringify(validatedData.supporting_docs || []),
                status: 'SUBMITTED',
            }
        });

        // Logging
        await prisma.financeReferralLog.create({
            data: {
                financeRequestId: financeRequest.id,
                action: 'created_submitted',
                actorId: user.userId as string,
                payload: JSON.stringify({ amount: validatedData.amount_requested })
            }
        });

        return NextResponse.json(financeRequest, { status: 201 });

    } catch (error: unknown) {
        console.error('[FINANCE_CREATE_ERROR]', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tradeId = searchParams.get('tradeId');

        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // ADMIN ACCESS
        if (payload.role === 'ADMIN') {
            const whereClause: any = {}
            if (tradeId) whereClause.tradeId = tradeId

            const requests = await prisma.financeRequest.findMany({
                where: whereClause,
                include: {
                    exporter: { select: { companyName: true } },
                    trade: { select: { id: true, status: true } }
                },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json({ requests })
        }

        // EXPORTER ACCESS
        if (payload.role === 'EXPORTER') {
            const exporterProfile = await prisma.exporterProfile.findUnique({
                where: { userId: payload.userId as string }
            })
            if (!exporterProfile) return NextResponse.json({ requests: [] })

            const whereClause: any = { exporterId: exporterProfile.id }
            if (tradeId) whereClause.tradeId = tradeId

            const requests = await prisma.financeRequest.findMany({
                where: whereClause,
                include: { trade: { select: { id: true, status: true } } },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json({ requests })
        }

        return NextResponse.json({ error: 'Unauthorized access level' }, { status: 403 })

    } catch (error) {
        console.error('[FINANCE_GET_ERROR]', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
