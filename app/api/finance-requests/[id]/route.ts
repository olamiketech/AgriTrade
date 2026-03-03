import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await verifyJWT(token)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const financeRequest = await prisma.financeRequest.findUnique({
            where: { id },
            include: {
                trade: {
                    include: { documents: true }
                },
                exporter: true
            }
        });

        if (!financeRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // RBAC
        if (user.role === 'ADMIN') {
            return NextResponse.json(financeRequest);
        }

        if (user.role === 'EXPORTER') {
            const exporterProfile = await prisma.exporterProfile.findUnique({ where: { userId: user.userId as string } });
            if (financeRequest.exporterId !== exporterProfile?.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
            return NextResponse.json(financeRequest);
        }

        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await verifyJWT(token)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json();
        const { amount_requested, purpose, supporting_docs } = body;

        const financeRequest = await prisma.financeRequest.findUnique({
            where: { id }
        });

        if (!financeRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Only exporter can edit
        if (user.role !== 'EXPORTER') return NextResponse.json({ error: 'Only exporters can edit' }, { status: 403 });

        const exporterProfile = await prisma.exporterProfile.findUnique({ where: { userId: user.userId as string } });
        if (financeRequest.exporterId !== exporterProfile?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Status check
        if (financeRequest.status !== 'DRAFT' && financeRequest.status !== 'NEEDS_INFO') {
            return NextResponse.json({ error: 'Cannot edit in current status' }, { status: 400 });
        }

        const updated = await prisma.financeRequest.update({
            where: { id },
            data: {
                amount: amount_requested,
                purpose,
                supportingDocs: supporting_docs ? JSON.stringify(supporting_docs) : undefined,
                status: financeRequest.status === 'NEEDS_INFO' ? 'SUBMITTED' : financeRequest.status
            }
        });

        // Log update
        await prisma.financeReferralLog.create({
            data: {
                financeRequestId: id,
                action: 'exporter_updated',
                actorId: user.userId as string,
                payload: JSON.stringify({ amount: amount_requested })
            }
        });

        return NextResponse.json(updated);
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
