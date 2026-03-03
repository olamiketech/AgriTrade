import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email/service';
import { EMAIL_TEMPLATES } from '@/lib/email/templates';
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
        const { action, notes } = body;

        if (!['approve_for_referral', 'request_more_info', 'decline'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const financeRequest = await prisma.financeRequest.findUnique({
            where: { id },
            include: { exporter: { include: { user: true } } }
        });
        if (!financeRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        let newStatus = financeRequest.status;

        if (action === 'approve_for_referral') {
            newStatus = 'UNDER_REVIEW';
        } else if (action === 'request_more_info') {
            newStatus = 'NEEDS_INFO';
            await sendEmail(financeRequest.exporter.user.email, EMAIL_TEMPLATES.EXPORTER_NEEDS_INFO(financeRequest.exporter.companyName, notes));
        } else if (action === 'decline') {
            newStatus = 'DECLINED';
        }

        const updated = await prisma.financeRequest.update({
            where: { id },
            data: {
                status: newStatus,
                adminNotes: notes
            }
        });

        await prisma.financeReferralLog.create({
            data: {
                financeRequestId: id,
                action: `admin_${action}`,
                actorId: user.userId as string,
                payload: JSON.stringify({ notes, previous_status: financeRequest.status })
            }
        });

        return NextResponse.json(updated);
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
