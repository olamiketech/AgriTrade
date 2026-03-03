import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PartnerReferralPayload {
    partner_id: string; // e.g., 'KRIYA'
    partner_env: 'sandbox' | 'production';
    exporter: {
        id: string;
        company_name: string;
        country: string;
        kyc_status: string;
    };
    deal: {
        id: string;
        product: string;
        quantity: number;
        unit_price: number;
        currency: string;
        incoterm?: string;
        shipment_date?: string;
    };
    finance_request: {
        id: string;
        amount_requested: number;
        purpose: string;
        supporting_docs: Array<{ file_name: string; file_url: string }>;
    };
    meta: {
        platform: string;
        submitted_at: string;
    };
}

export async function createPartnerReferral(
    financeRequestId: string,
    partnerId: string,
    sendVia: 'email' | 'api'
) {
    // 1. Fetch full details
    const financeRequest = await prisma.financeRequest.findUnique({
        where: { id: financeRequestId },
        include: {
            exporter: true,
            trade: {
                include: {
                    documents: true,
                },
            },
        },
    });

    if (!financeRequest) throw new Error('Finance Request not found');

    // 2. Construct Payload
    const payload: PartnerReferralPayload = {
        partner_id: partnerId,
        partner_env: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        exporter: {
            id: financeRequest.exporter.id,
            company_name: financeRequest.exporter.companyName,
            country: financeRequest.exporter.country,
            kyc_status: financeRequest.exporter.kycStatus,
        },
        deal: {
            id: financeRequest.trade.id,
            product: financeRequest.trade.productDetails, // assuming product name is here
            quantity: financeRequest.trade.quantity,
            unit_price: financeRequest.trade.price,
            currency: financeRequest.trade.currency,
            incoterm: financeRequest.trade.deliveryTerms,
        },
        finance_request: {
            id: financeRequest.id,
            amount_requested: financeRequest.amount || 0,
            purpose: financeRequest.purpose || '',
            supporting_docs: (financeRequest.supportingDocs ? JSON.parse(financeRequest.supportingDocs) : []).map((d: any) => ({
                file_name: d.name || 'document.pdf',
                file_url: d.url || '#'
            })),
        },
        meta: {
            platform: 'AgriTrade Secure',
            submitted_at: new Date().toISOString(),
        },
    };

    // Map documents - rudimentary implementation, relies on parsing JSON if it was stored that way, or specific Document table queries
    // detailed doc logic to be added

    // 3. Send
    let actionResult = '';
    if (sendVia === 'api') {
        // Mock API call
        console.log(`[Partner API] Sending to ${partnerId}...`);
        // In real impl, fetch URL from config/env
        const response = await mockPartnerApi(payload);
        actionResult = `API response: ${JSON.stringify(response)}`;

        // Update request with partner ref if successful
        if (response.partner_ref_id) {
            await prisma.financeRequest.update({
                where: { id: financeRequestId },
                data: { partnerRefId: response.partner_ref_id }
            });
        }

    } else {
        // Email logic
        console.log(`[Partner Email] Generating email for ${partnerId}...`);

        const subject = `Finance referral: ${payload.exporter.company_name} — Deal ${payload.deal.id.substring(0, 8)}`;
        const body = `
Hello Partner,

Please find attached a finance referral from AgriTrade Secure.

Exporter: ${payload.exporter.company_name}
Country: ${payload.exporter.country}
Deal ID: ${payload.deal.id}
Product: ${payload.deal.product}
Deal Value: ${payload.deal.currency} ${payload.deal.unit_price * payload.deal.quantity}
Amount Requested: ${payload.deal.currency} ${payload.finance_request.amount_requested}

Attached: Trade Dossier (${payload.finance_request.supporting_docs.length} files)

Please reply with partner_ref_id or status update. This request is logged under ID ${payload.finance_request.id}.

Regards,
AgriTrade Secure Team
        `;

        // Map supporting docs to attachments
        // In a real app, we would read file streams. Here we mock content or pass URLs.
        const attachments = payload.finance_request.supporting_docs.map(doc => ({
            filename: doc.file_name,
            content: `Mock content for ${doc.file_url}` // Placeholder for file stream
        }));

        // Send Email
        const { sendEmail } = await import('@/lib/email/service');
        await sendEmail(`partners@${partnerId.toLowerCase()}.example`, { subject, body }, attachments);

        actionResult = 'Email forwarded to partner contact';
    }

    // 4. Log
    await prisma.financeReferralLog.create({
        data: {
            financeRequestId,
            action: sendVia === 'api' ? 'submitted_to_partner_api' : 'forwarded_email',
            payload: JSON.stringify(payload),
            actorId: 'system', // or admin user id if passed
        },
    });

    return { success: true, result: actionResult };
}

async function mockPartnerApi(payload: PartnerReferralPayload) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
        success: true,
        partner_ref_id: `REF-${Math.floor(Math.random() * 10000)}`,
        status: 'received',
    };
}
