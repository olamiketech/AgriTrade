import prisma from '@/lib/prisma';

export async function compileDossierInput(tradeId: string) {
    const trade = await prisma.tradeDeal.findUnique({
        where: { id: tradeId },
        include: {
            exporter: {
                select: {
                    companyName: true,
                    country: true,
                    verificationLevel: true
                }
            },
            documents: {
                include: {
                    extractions: {
                        where: { verified: true } // ONLY verified extractions
                    }
                }
            }
        }
    });

    if (!trade) {
        throw new Error(`Trade ${tradeId} not found`);
    }

    // Structure the input for the LLM
    // We intentionally exclude comprehensive PII, focusing on the trade entity

    const dossier = {
        trade_context: {
            trade_id: trade.id, // ID is safe
            status: trade.status,
            payment_status: trade.paymentStatus,
            product: trade.productDetails,
            quantity: trade.quantity,
            price: trade.price,
            currency: trade.currency,
            incoterms: trade.deliveryTerms,
            created_at: trade.createdAt.toISOString()
        },
        parties: {
            exporter: {
                company: trade.exporter.companyName,
                country: trade.exporter.country,
                verification: trade.exporter.verificationLevel
            },
            buyer: {
                // We use the email prefix or generic identifier if company name isn't fully linked in this relation
                identifier: trade.buyerEmail
            }
        },
        documents: trade.documents.map((doc: any) => ({
            type: doc.type,
            filename: doc.filePath,
            uploaded_at: doc.createdAt.toISOString(),
            extracted_data: doc.extractions.reduce((acc: any, curr: any) => {
                acc[curr.fieldName] = curr.fieldValue;
                return acc;
            }, {} as Record<string, string>)
        })).filter((doc: any) => Object.keys(doc.extracted_data).length > 0) // Only include docs with verified data
    };

    return dossier;
}
