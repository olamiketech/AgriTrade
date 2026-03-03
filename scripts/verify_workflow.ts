
import prisma from '../lib/prisma';
import { processDocument } from '../lib/ocr/service';
import { generateDossierSummary } from '../lib/llm/summarizer';

async function main() {
    console.log("Starting Verification Workflow...");

    // 1. Create a Test User (Exporter)
    const email = `test_exporter_${Date.now()}@example.com`;
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: 'dummy',
            role: 'EXPORTER',
            exporterProfile: {
                create: {
                    companyName: 'Test Exporter Ltd',
                    country: 'Brazil',
                }
            }
        },
        include: { exporterProfile: true }
    });
    console.log(`Created User: ${user.email}`);

    // 2. Create a Trade Deal
    const trade = await prisma.tradeDeal.create({
        data: {
            exporterId: user.exporterProfile!.id,
            buyerEmail: 'buyer@example.com',
            productDetails: 'Soybeans Grade A',
            quantity: 1000,
            price: 50000,
            currency: 'USD',
            deliveryTerms: 'FOB',
            status: 'DRAFT'
        }
    });
    console.log(`Created Trade: ${trade.id}`);

    // 3. Create a Document (Simulate Upload)
    const document = await prisma.document.create({
        data: {
            tradeId: trade.id,
            filePath: 'dummy.pdf',
            type: 'INVOICE',
            uploadedBy: user.id
        }
    });
    console.log(`Created Document: ${document.id}`);

    // 4. Trigger OCR
    console.log("Triggering OCR...");
    await processDocument(document.id);

    // Check extractions
    const extractions = await prisma.documentExtraction.findMany({
        where: { documentId: document.id }
    });
    console.log(`OCR Extracted ${extractions.length} fields.`);

    if (extractions.length === 0) {
        console.error("No extractions found!");
        return;
    }

    // 5. Verify Extractions (Simulate Human Review)
    console.log("Verifying Extractions...");
    await prisma.documentExtraction.updateMany({
        where: { documentId: document.id },
        data: { verified: true, verifiedBy: user.id, verifiedAt: new Date() }
    });

    // 6. Generate Summary
    console.log("Generating Summary...");
    const summary = await generateDossierSummary(trade.id, user.id);

    console.log("\n--- GENERATED SUMMARY ---");
    console.log(summary.content);
    console.log("-------------------------\n");

    if (summary.content.includes("Trade Summary (AI Generated)")) {
        console.log("✅ Workflow Verification PASSED");
    } else {
        console.error("❌ Summary generation failed or empty");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
