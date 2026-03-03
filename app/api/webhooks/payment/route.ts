import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { captureException } from '@/lib/monitoring';
import { AuditService, AuditAction, ActorType, EntityType } from '@/lib/services/AuditService';

// Secret from environment variable (in a real scenario)
// For MVP/Demo, we can use a hardcoded secret or a default one if env is missing
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'test_secret';

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('x-signature');
        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        const bodyText = await req.text();

        // Validate signature
        const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
        const digest = hmac.update(bodyText).digest('hex');

        if (signature !== digest) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        const payload = JSON.parse(bodyText);
        const { tradeId, status, referenceId } = payload;

        if (!tradeId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Map external status to internal status
        let internalPaymentStatus = 'UNPAID';
        if (status === 'paid_held') {
            internalPaymentStatus = 'PAID'; // Funds held by partner
        } else if (status === 'released') {
            internalPaymentStatus = 'RELEASED'; // Funds released to exporter
        } else if (status === 'failed') {
            internalPaymentStatus = 'FAILED';
        }

        // Update TradeDeal
        const updatedTrade = await prisma.tradeDeal.update({
            where: { id: tradeId },
            data: {
                paymentStatus: internalPaymentStatus,
                paymentReference: referenceId,
                partnerStatus: status,
            },
        });

        // Audit Log
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

        if (adminUser) {
            await AuditService.log({
                action: status === 'paid_held' ? AuditAction.PAYMENT_RECEIVED :
                    status === 'released' ? AuditAction.PAYOUT_COMPLETED : AuditAction.DEAL_UPDATED,
                actorType: ActorType.SYSTEM,
                actorId: adminUser.id,
                entityType: EntityType.TRADE,
                entityId: tradeId,
                tradeId: tradeId,
                userId: adminUser.id,
                metadata: { originalStatus: status, referenceId }
            });
        }

        return NextResponse.json({ success: true, trade: updatedTrade });

    } catch (error) {
        console.error('Webhook error:', error);
        captureException(error, { context: 'payment_webhook' });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
