
import { POST } from '../app/api/webhooks/payment/route';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'test_secret';

async function main() {
    console.log('Starting payment webhook verification...');

    // 1. Create a test user and trade deal
    const exporter = await prisma.user.create({
        data: {
            email: `test_exporter_${Date.now()}@example.com`,
            passwordHash: 'hash',
            role: 'EXPORTER',
            verificationStatus: 'VERIFIED',
            exporterProfile: {
                create: {
                    companyName: 'Test Exporter',
                    country: 'UK',
                }
            }
        },
        include: { exporterProfile: true }
    });

    const trade = await prisma.tradeDeal.create({
        data: {
            exporterId: exporter.exporterProfile!.id,
            buyerEmail: 'buyer@example.com',
            productDetails: 'Test Wheat',
            quantity: 100,
            price: 50,
            currency: 'USD',
            deliveryTerms: 'FOB',
            status: 'AGREED',
            paymentStatus: 'UNPAID',
        }
    });

    console.log(`Created test trade: ${trade.id}`);

    // 2. Prepare webhook payload
    const payload = {
        tradeId: trade.id,
        status: 'paid_held',
        referenceId: 'REF_12345',
    };
    const bodyText = JSON.stringify(payload);

    // 3. Sign the payload
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const signature = hmac.update(bodyText).digest('hex');

    // 4. Create mock request
    const req = new NextRequest('http://localhost:3000/api/webhooks/payment', {
        method: 'POST',
        body: bodyText,
        headers: {
            'x-signature': signature,
            'content-type': 'application/json',
        },
    });

    // 5. Call the handler
    console.log('Calling webhook handler...');
    const response = await POST(req);

    if (response.status !== 200) {
        const error = await response.json();
        console.error('Webhook failed:', response.status, error);
        process.exit(1);
    }

    // 6. Verify trade status
    const updatedTrade = await prisma.tradeDeal.findUnique({
        where: { id: trade.id },
    });

    if (updatedTrade?.paymentStatus === 'PAID' && updatedTrade.partnerStatus === 'paid_held') {
        console.log('SUCCESS: Trade payment status updated correctly.');
    } else {
        console.error('FAILURE: Trade status not updated correctly.', updatedTrade);
        process.exit(1);
    }

    // Clean up
    await prisma.tradeDeal.delete({ where: { id: trade.id } });
    await prisma.exporterProfile.delete({ where: { id: exporter.exporterProfile!.id } });
    await prisma.user.delete({ where: { id: exporter.id } });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
