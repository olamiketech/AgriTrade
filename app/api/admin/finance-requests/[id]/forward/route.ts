import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createPartnerReferral } from '@/lib/finance/partner-service';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await verifyJWT(token)
        if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await request.json();
        const { partner_id, send_via } = body;

        if (!partner_id || !['email', 'api'].includes(send_via)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const financeRequest = await prisma.financeRequest.findUnique({ where: { id } });
        if (!financeRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Call Service
        const result = await createPartnerReferral(id, partner_id, send_via);

        // Update Status
        const updated = await prisma.financeRequest.update({
            where: { id },
            data: { status: 'REFERRED' }
        });

        return NextResponse.json({ ...result, data: updated });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
