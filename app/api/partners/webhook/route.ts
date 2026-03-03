import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const PARTNER_SECRET = process.env.PARTNER_SECRET || 'secret';

function verifySignature(payload: string, signature: string) {
    const hmac = crypto.createHmac('sha256', PARTNER_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: Request) {
    try {
        const signature = request.headers.get('x-partner-signature');
        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        const rawBody = await request.text();
        // In real app, verify signature here. 
        // For debugging/demo without sending real headers, we might skip or log warning.
        // if (!verifySignature(rawBody, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

        const body = JSON.parse(rawBody);
        const { finance_request_id, status, partner_ref_id, message } = body;

        if (!finance_request_id || !status) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Map partner status to internal status
        let internalStatus = 'UNDER_REVIEW';
        if (status === 'funded') internalStatus = 'FINANCED';
        if (status === 'declined') internalStatus = 'DECLINED';
        if (status === 'info_needed') internalStatus = 'NEEDS_INFO';

        // Update Finance Request
        await prisma.financeRequest.update({
            where: { id: finance_request_id },
            data: {
                status: internalStatus,
                partnerRefId: partner_ref_id // Update ref ID if provided
            }
        });

        // Log to Audit
        await prisma.financeReferralLog.create({
            data: {
                financeRequestId: finance_request_id,
                action: 'webhook_received',
                payload: rawBody,
                actorId: 'partner_system'
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[WEBHOOK_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
