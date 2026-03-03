

import { calculateDealScore } from '../lib/llm/deal-scorer';

import prisma from '../lib/prisma';

async function main() {
    // 1. Create a dummy deal if needed or find one
    let deal = await prisma.tradeDeal.findFirst();

    if (!deal) {
        console.log("No deal found, creating one...");
        const user = await prisma.user.findFirst({ where: { role: 'EXPORTER' } });
        if (!user) throw new Error("No exporter user found");

        const exporter = await prisma.exporterProfile.findUnique({ where: { userId: user.id } });
        if (!exporter) throw new Error("No exporter profile found");

        deal = await prisma.tradeDeal.create({
            data: {
                exporterId: exporter.id,
                buyerEmail: "test@test.com",
                productDetails: "Test Product",
                quantity: 100,
                price: 1000,
                currency: "USD",
                deliveryTerms: "FOB",
                status: "DRAFT"
            }
        });
    }

    console.log(`Testing score for deal: ${deal.id}`);

    try {
        const score = await calculateDealScore(deal.id, "test-user-id");
        console.log("Score:", score);
    } catch (e) {
        console.error("Error calculating score:", e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
