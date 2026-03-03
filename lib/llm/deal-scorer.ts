import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

const SYSTEM_PROMPT = `You are a strict trade finance risk analyst.
Your job is to evaluate a trade deal for financing viability.
You must output JSON only.

Analyze the provided trade data and documents.
Output JSON format:
{
  "score": number, // 0-100 integer.
  "explanation": "string", // 2-3 sentences explaining the score.
  "improvements": ["string", "string"] // List of specific actions to improve the score.
}

Scoring Criteria:
- >80: Complete documentation (Bill of Lading, Invoice, Packing List), verified exporter, realistic price.
- 50-80: Missing some minor docs, or price needs justification.
- <50: Missing critical docs (Invoice/BL), unverified exporter, or high risk.

Rules:
- Be critical.
- If no documents are uploaded, score must be < 40.
- If terms are DRAFT, score is lower.
- Respond ONLY with valid JSON.`;

export async function calculateDealScore(tradeId: string, userId: string) {
    try {
        console.log(`[DealScore] Calculating score for trade ${tradeId}...`);

        // 1. Fetch Trade Data
        const trade = await prisma.tradeDeal.findUnique({
            where: { id: tradeId },
            include: {
                documents: true,
                exporter: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!trade) throw new Error('Trade not found');

        // 2. Prepare Context for AI
        const context = {
            trade: {
                product: trade.productDetails,
                value: `${trade.currency} ${trade.price}`,
                quantity: trade.quantity,
                status: trade.status,
                paymentStatus: trade.paymentStatus,
                deliveryStatus: trade.deliveryStatus
            },
            exporter: {
                company: trade.exporter.companyName,
                country: trade.exporter.country,
                verificationLevel: trade.exporter.verificationLevel,
                kycStatus: trade.exporter.kycStatus
            },
            documents: trade.documents.map((d: any) => ({
                type: d.type,
                uploadedAt: d.createdAt
            }))
        };

        // 3. Call OpenAI
        const openai = (await import('./openai-client')).default;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: JSON.stringify(context) }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Failed to generate score');

        const result = JSON.parse(content);

        // 4. Save to DB (Upsert)
        // We use upsert to keep only the latest score per deal, 
        // simplifies the relation. If we wanted history we'd use create.
        // Schema checks: tradeId is unique? yes in our plan we made it unique.

        // Wait, did I make tradeId unique in schema?
        // "tradeId String @unique" -> Yes.

        const scoreRecord = await prisma.dealScore.upsert({
            where: { tradeId },
            update: {
                score: result.score,
                explanation: result.explanation,
                improvements: JSON.stringify(result.improvements),
                generatedAt: new Date()
            },
            create: {
                tradeId,
                score: result.score,
                explanation: result.explanation,
                improvements: JSON.stringify(result.improvements)
            }
        });

        // 5. Audit Log
        await createAuditLog('DEAL_SCORE_CALCULATED', userId, tradeId, {
            score: result.score
        });

        return {
            ...scoreRecord,
            improvements: JSON.parse(scoreRecord.improvements) // Return as array
        };

    } catch (error) {
        console.error(`[DealScore] Error calculating score:`, error);
        throw error;
    }
}
