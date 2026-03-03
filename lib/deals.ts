import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from './audit';

export const createDealSchema = z.object({
    buyerEmail: z.string().email(),
    productDetails: z.string().min(1),
    quantity: z.coerce.number().positive(),
    price: z.coerce.number().positive(),
    currency: z.string().min(3).max(3),
    deliveryTerms: z.string().min(1),
    termsAccepted: z.boolean().optional(),
})

export type CreateDealInput = z.infer<typeof createDealSchema>;

export async function createDeal(userId: string, data: CreateDealInput) {
    // 1. Get Exporter Profile
    const exporterProfile = await prisma.exporterProfile.findUnique({
        where: { userId }
    })

    if (!exporterProfile) {
        throw new Error('Exporter profile not found');
    }

    // 2. Check KYC
    // 2. Check KYC & Determine Status
    const isKycApproved = exporterProfile.kycStatus === 'APPROVED';
    const isManuallyVerified = ['VERIFIED', 'VERIFIED_PLUS'].includes(exporterProfile.verificationLevel);
    const isVerified = isKycApproved || isManuallyVerified;

    const initialStatus = isVerified ? 'PENDING_ACCEPTANCE' : 'DRAFT';

    // 3. Create Deal
    const deal = await prisma.tradeDeal.create({
        data: {
            exporterId: exporterProfile.id,
            buyerEmail: data.buyerEmail,
            productDetails: data.productDetails,
            quantity: data.quantity,
            price: data.price,
            currency: data.currency,
            deliveryTerms: data.deliveryTerms,
            status: initialStatus,
        }
    })

    // 3.1 Send Invite Email (Only if Verified)
    if (initialStatus === 'PENDING_ACCEPTANCE') {
        const { sendEmail } = await import('@/lib/email/service');
        // TODO: Implement actual email template for deal invitation
        await sendEmail(data.buyerEmail, {
            subject: `New Deal Offer from ${exporterProfile.companyName}`,
            body: `You have received a new deal offer from ${exporterProfile.companyName}. Login to view details.`
        });
    }

    // 4. Record Terms Acceptance
    if (data.termsAccepted) {
        await prisma.termsAcceptance.create({
            data: {
                userId,
                dealId: deal.id,
                termsVersion: '1.0',
                acceptedAt: new Date(),
            }
        })
    }

    // 5. Audit Log
    await createAuditLog('TRADE_CREATE', userId, deal.id, {
        amount: data.quantity * data.price,
        currency: data.currency
    });

    return deal;
}
