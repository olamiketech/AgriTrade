
import { createDeal } from '../lib/deals';
import prisma from '../lib/prisma';
import { NextRequest } from 'next/server';

async function main() {
    console.log('Starting KYC verification (Direct Service Check)...');

    // 1. Create a test user
    const email = `test_kyc_${Date.now()}@example.com`;
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: 'hash',
            role: 'EXPORTER',
            exporterProfile: {
                create: {
                    companyName: 'KYC Test Co',
                    country: 'FR',
                    kycStatus: 'PENDING',
                }
            }
        },
        include: { exporterProfile: true }
    });

    const dealData = {
        buyerEmail: 'buyer@example.com',
        productDetails: 'Wheat',
        quantity: 100,
        price: 50,
        currency: 'USD',
        deliveryTerms: 'FOB',
        termsAccepted: true
    };

    // 2. Try to create deal (Should Fail)
    console.log('Attempting to create deal with PENDING KYC...');
    try {
        await createDeal(user.id, dealData);
        console.error('FAILURE: Deal creation NOT blocked for PENDING KYC.');
        process.exit(1);
    } catch (error: any) {
        if (error.message.includes('KYC Verification Required')) {
            console.log('SUCCESS: Deal creation blocked for PENDING KYC.');
        } else {
            console.error('FAILURE: Unexpected error:', error);
            process.exit(1);
        }
    }

    // 3. Update KYC to APPROVED via DB
    console.log('Updating KYC status to APPROVED...');
    await prisma.exporterProfile.update({
        where: { id: user.exporterProfile!.id },
        data: { kycStatus: 'APPROVED' }
    });

    // 4. Try to create deal (Should Succeed)
    console.log('Attempting to create deal with APPROVED KYC...');
    try {
        const deal = await createDeal(user.id, dealData);
        console.log('SUCCESS: Deal creation allowed for APPROVED KYC. Deal ID:', deal.id);

        // Clean up
        await prisma.termsAcceptance.deleteMany({ where: { dealId: deal.id } });
        await prisma.tradeDeal.delete({ where: { id: deal.id } });
    } catch (error) {
        console.error('FAILURE: Deal creation failed for APPROVED KYC.', error);
        process.exit(1);
    }

    // Clean up user
    await prisma.exporterProfile.delete({ where: { id: user.exporterProfile!.id } });
    await prisma.user.delete({ where: { id: user.id } });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
